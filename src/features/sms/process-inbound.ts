import { createServiceClient } from "@/lib/supabase/service";
import { logErrorFromException } from "@/lib/logger";
import { phoneMatchKey } from "@/lib/phone";
import { twimlMessageResponse, twimlMessagesResponse } from "@/lib/twilio";
import { latestOutboundCompanyId } from "@/features/sms/company-sms-route";
import { resolveInboundTenant, type InboundCandidate } from "@/features/sms/sms-policy";
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
};

type RoutedCustomer = {
  id: string;
  company_id: string;
};

function missingPhoneKey(error: { message?: string } | null): boolean {
  const message = error?.message ?? "";
  return message.includes("phone_key") || message.includes("does not exist");
}

async function candidatesForPhone(fromNumber: string): Promise<InboundCandidate[]> {
  const key = phoneMatchKey(fromNumber);
  if (!key) return [];
  const supabase = createServiceClient();
  const [primary, secondary] = await Promise.all([
    supabase
      .from("customers")
      .select("id, company_id")
      .eq("phone_key", key)
      .eq("is_active", true),
    supabase
      .from("customers")
      .select("id, company_id")
      .eq("secondary_phone_key", key)
      .eq("is_active", true),
  ]);
  if (primary.error || secondary.error) {
    if (!missingPhoneKey(primary.error) && !missingPhoneKey(secondary.error)) {
      return [];
    }
    const [exactPrimary, exactSecondary] = await Promise.all([
      supabase
        .from("customers")
        .select("id, company_id")
        .eq("phone", fromNumber)
        .eq("is_active", true),
      supabase
        .from("customers")
        .select("id, company_id")
        .eq("secondary_phone", fromNumber)
        .eq("is_active", true),
    ]);
    if (exactPrimary.error || exactSecondary.error) return [];
    const fallback = [...(exactPrimary.data ?? []), ...(exactSecondary.data ?? [])];
    const companyIds = [...new Set(fallback.map((row) => row.company_id))];
    if (!companyIds.length) return [];
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", companyIds);
    const names = new Map((companies ?? []).map((company) => [company.id, company.name]));
    return fallback.map((row) => ({
      companyId: row.company_id,
      companyName: names.get(row.company_id) ?? "PackRoute company",
      customerId: row.id,
    }));
  }

  const rows = [...(primary.data ?? []), ...(secondary.data ?? [])];
  const companyIds = [...new Set(rows.map((row) => row.company_id))];
  if (!companyIds.length) return [];

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .in("id", companyIds);
  const names = new Map((companies ?? []).map((company) => [company.id, company.name]));

  return rows.map((row) => ({
    companyId: row.company_id,
    companyName: names.get(row.company_id) ?? "PackRoute company",
    customerId: row.id,
  }));
}

export async function processInboundSms(input: InboundSmsInput): Promise<Response> {
  const { fromNumber, toNumber, body, twilioSid } = input;
  const receivedAt = new Date();

  try {
    const supabase = createServiceClient();
    const [candidates, latestCompanyId] = await Promise.all([
      candidatesForPhone(fromNumber),
      latestOutboundCompanyId(fromNumber),
    ]);
    const choice = resolveInboundTenant({
      candidates,
      latestOutboundCompanyId: latestCompanyId,
      body,
    });

    if (choice.kind === "none") {
      return twimlMessageResponse(UNREGISTERED_PHONE_REPLY);
    }
    if (choice.kind === "ask") {
      return twimlMessageResponse(choice.reply);
    }

    const customer: RoutedCustomer = {
      id: choice.customerId,
      company_id: choice.companyId,
    };

    const { data: company } = await supabase
      .from("companies")
      .select("timezone")
      .eq("id", customer.company_id)
      .single();

    const timeZone = company?.timezone ?? "America/Los_Angeles";

    if (twilioSid) {
      const { data: existingSms } = await supabase
        .from("sms_messages")
        .select("id")
        .eq("twilio_sid", twilioSid)
        .maybeSingle();

      if (existingSms) {
        const reparsed = parseSmsCommand(body, timeZone);
        if (reparsed.commandType === "help" && reparsed.autoReplies?.length) {
          return twimlMessagesResponse(reparsed.autoReplies);
        }
        return twimlMessageResponse(reparsed.autoReply);
      }
    }

    const parsed = parseSmsCommand(body, timeZone);
    const idempotencyKey = buildIdempotencyKey(fromNumber, body, receivedAt);

    if (
      parsed.commandType === "reminders_preference" &&
      parsed.nightBeforeRemindersEnabled !== undefined
    ) {
      await supabase
        .from("customers")
        .update({
          night_before_reminders_enabled: parsed.nightBeforeRemindersEnabled,
        })
        .eq("id", customer.id);

      await supabase.from("sms_messages").insert({
        company_id: customer.company_id,
        customer_id: customer.id,
        direction: "inbound",
        from_number: fromNumber,
        to_number: toNumber,
        body,
        twilio_sid: twilioSid,
        status: "received",
        pending_request_id: null,
      });

      return twimlMessageResponse(parsed.autoReply);
    }

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

    if (parsed.commandType === "help" && parsed.autoReplies?.length) {
      return twimlMessagesResponse(parsed.autoReplies);
    }

    return twimlMessageResponse(parsed.autoReply);
  } catch (error) {
    logErrorFromException("webhook", "Failed to process inbound SMS", error, {
      context: { fromNumber, twilioSid },
    });
    return twimlMessageResponse(REQUEST_ACK_REPLY);
  }
}
