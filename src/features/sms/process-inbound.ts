import { customerHasPhone } from "@/lib/customer-contacts";
import { createServiceClient } from "@/lib/supabase/service";
import { logErrorFromException } from "@/lib/logger";
import { twimlMessageResponse } from "@/lib/twilio";
import {
  buildIdempotencyKey,
  parseSmsCommand,
  REQUEST_ACK_REPLY,
  UNREGISTERED_PHONE_REPLY,
} from "@/features/sms/parser";

type InboundSmsInput = {
  fromNumber: string;
  toNumber: string;
  body: string;
  twilioSid: string | null;
  defaultCompanyId: string;
};

async function findCustomerByPhone(fromNumber: string) {
  const supabase = createServiceClient();

  const { data: exactPrimary } = await supabase
    .from("customers")
    .select("id, company_id, phone, secondary_phone, owner_name, secondary_owner_name")
    .eq("phone", fromNumber)
    .eq("is_active", true)
    .maybeSingle();

  if (exactPrimary) return exactPrimary;

  const { data: exactSecondary } = await supabase
    .from("customers")
    .select("id, company_id, phone, secondary_phone, owner_name, secondary_owner_name")
    .eq("secondary_phone", fromNumber)
    .eq("is_active", true)
    .maybeSingle();

  if (exactSecondary) return exactSecondary;

  const { data: customers } = await supabase
    .from("customers")
    .select("id, company_id, phone, secondary_phone, owner_name, secondary_owner_name")
    .eq("is_active", true);

  return (
    customers?.find((c) => customerHasPhone(c, fromNumber)) ?? null
  );
}

export async function processInboundSms(input: InboundSmsInput): Promise<Response> {
  const { fromNumber, toNumber, body, twilioSid, defaultCompanyId } = input;
  const receivedAt = new Date();

  try {
    const supabase = createServiceClient();
    const customer = await findCustomerByPhone(fromNumber);

    if (!customer) {
      return twimlMessageResponse(UNREGISTERED_PHONE_REPLY);
    }

    if (twilioSid) {
      const { data: existingSms } = await supabase
        .from("sms_messages")
        .select("id")
        .eq("twilio_sid", twilioSid)
        .maybeSingle();

      if (existingSms) {
        return twimlMessageResponse(REQUEST_ACK_REPLY);
      }
    }

    const { data: company } = await supabase
      .from("companies")
      .select("timezone")
      .eq("id", customer.company_id)
      .single();

    const timeZone = company?.timezone ?? "America/Los_Angeles";
    const parsed = parseSmsCommand(body, timeZone);
    const idempotencyKey = buildIdempotencyKey(fromNumber, body, receivedAt);

    let pendingRequestId: string | null = null;

    if (parsed.createsRequest) {
      const { data: existingRequest } = await supabase
        .from("pending_requests")
        .select("id")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existingRequest) {
        pendingRequestId = existingRequest.id;
      } else {
        const { data: created, error } = await supabase
          .from("pending_requests")
          .insert({
            company_id: customer.company_id,
            customer_id: customer.id,
            raw_body: body.trim(),
            command_type: parsed.commandType,
            parsed_payload: parsed.payload,
            idempotency_key: idempotencyKey,
          })
          .select("id")
          .single();

        if (error) {
          if (error.code === "23505") {
            const { data: dup } = await supabase
              .from("pending_requests")
              .select("id")
              .eq("idempotency_key", idempotencyKey)
              .maybeSingle();
            pendingRequestId = dup?.id ?? null;
          } else {
            throw error;
          }
        } else {
          pendingRequestId = created?.id ?? null;
        }
      }
    }

    await supabase.from("sms_messages").insert({
      company_id: customer.company_id,
      customer_id: customer.id,
      direction: "inbound",
      from_number: fromNumber,
      to_number: toNumber,
      body,
      twilio_sid: twilioSid,
      status: "received",
      pending_request_id: pendingRequestId,
    });

    return twimlMessageResponse(parsed.autoReply);
  } catch (error) {
    logErrorFromException("webhook", "Failed to process inbound SMS", error, {
      companyId: defaultCompanyId,
      context: { fromNumber, twilioSid },
    });
    return twimlMessageResponse(REQUEST_ACK_REPLY);
  }
}
