import { createServiceClient } from "@/lib/supabase/service";
import type { CommandType, ExceptionType } from "@/types";
import type { ParsedPayload } from "@/features/sms/parser";
import {
  datesToSyncAfterApproval,
  syncStopsForDate,
} from "@/features/hikes/sync-stops";
import { getDateInTimezone } from "@/lib/dates";

type PendingRequestRow = {
  id: string;
  company_id: string;
  customer_id: string;
  command_type: CommandType;
  parsed_payload: ParsedPayload;
};

function exceptionFromCommand(
  commandType: CommandType,
  payload: ParsedPayload,
  timeZone: string
): { exception_type: ExceptionType; start_date: string; end_date: string | null } | null {
  switch (commandType) {
    case "skip_tomorrow":
    case "skip_date":
    case "skip_weekday": {
      const date =
        payload.target_date ?? getDateInTimezone(timeZone, 1);
      return {
        exception_type: "skip_date",
        start_date: date,
        end_date: date,
      };
    }
    case "vacation":
      if (!payload.start_date) return null;
      return {
        exception_type: "vacation",
        start_date: payload.start_date,
        end_date: payload.end_date ?? payload.start_date,
      };
    case "pause":
      return {
        exception_type: "pause",
        start_date: payload.start_date ?? getDateInTimezone(timeZone, 0),
        end_date: null,
      };
    case "resume":
      return null;
    default:
      return null;
  }
}

/** Apply an approved request: exceptions per dog, then sync affected hike dates. */
export async function applyApprovedPendingRequest(
  request: PendingRequestRow,
  adminId: string
) {
  const supabase = createServiceClient();

  const { data: company } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", request.company_id)
    .single();

  const timeZone = company?.timezone ?? "America/Los_Angeles";
  const today = getDateInTimezone(timeZone, 0);

  const { data: dogs } = await supabase
    .from("dogs")
    .select("id")
    .eq("customer_id", request.customer_id)
    .eq("is_active", true);

  if (!dogs?.length) return;

  if (request.command_type === "resume") {
    for (const dog of dogs) {
      const { data: pauses } = await supabase
        .from("schedule_exceptions")
        .select("id, end_date")
        .eq("dog_id", dog.id)
        .eq("exception_type", "pause")
        .lte("start_date", today);

      for (const pause of pauses ?? []) {
        if (pause.end_date && pause.end_date < today) continue;
        await supabase
          .from("schedule_exceptions")
          .update({ end_date: today })
          .eq("id", pause.id);
      }
    }
  } else {
    const derived = exceptionFromCommand(
      request.command_type,
      request.parsed_payload,
      timeZone
    );
    if (!derived) return;

    for (const dog of dogs) {
      await supabase.from("schedule_exceptions").insert({
        dog_id: dog.id,
        exception_type: derived.exception_type,
        start_date: derived.start_date,
        end_date: derived.end_date,
        reason: `SMS: ${request.command_type}`,
        pending_request_id: request.id,
        created_by: adminId,
      });
    }
  }

  const dates = datesToSyncAfterApproval(
    request.command_type,
    request.parsed_payload,
    timeZone
  );

  for (const date of dates) {
    await syncStopsForDate(request.company_id, date);
  }
}

export function buildApprovedSmsMessage(
  commandType: CommandType,
  payload: ParsedPayload
): string {
  switch (commandType) {
    case "skip_tomorrow":
      return "Your skip for tomorrow has been approved. See you next time!";
    case "skip_weekday":
    case "skip_date":
      return payload.target_date
        ? `Your skip for ${payload.target_date} has been approved.`
        : "Your skip request has been approved.";
    case "vacation":
      return payload.start_date && payload.end_date
        ? `Your vacation ${payload.start_date} through ${payload.end_date} has been approved.`
        : "Your vacation request has been approved.";
    case "pause":
      return "Your service pause has been approved. Text RESUME when you're ready to come back.";
    case "resume":
      return "Welcome back! Your service has been resumed.";
    default:
      return "Your schedule change has been approved.";
  }
}

export function buildDeclinedSmsMessage(adminNotes?: string | null): string {
  if (adminNotes?.trim()) {
    return `We couldn't approve your schedule request: ${adminNotes.trim()}. Please contact the office if you have questions.`;
  }
  return "We couldn't approve your schedule request. Please contact the office for help.";
}
