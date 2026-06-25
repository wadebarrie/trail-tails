"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireRole } from "@/features/auth/queries";
import { writeAuditLog } from "@/features/audit/log";
import {
  applyApprovedPendingRequest,
  buildApprovedSmsMessage,
  buildDeclinedSmsMessage,
} from "@/features/pending-requests/apply";
import { logNotification } from "@/features/notifications/log";
import type { CommandType } from "@/types";
import type { ParsedPayload } from "@/features/sms/parser";

export type PendingRequestActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function approvePendingRequestAction(
  requestId: string
): Promise<PendingRequestActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("pending_requests")
    .select("id, company_id, customer_id, command_type, parsed_payload, status")
    .eq("id", requestId)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!request) return { ok: false, error: "Request not found" };
  if (request.status !== "pending") {
    return { ok: false, error: "Request was already resolved" };
  }

  const resolvedAt = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("pending_requests")
    .update({
      status: "approved",
      resolved_by: profile.id,
      resolved_at: resolvedAt,
    })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updated) {
    return { ok: false, error: "Request was already resolved by another admin" };
  }

  try {
    await applyApprovedPendingRequest(
      {
        id: request.id,
        company_id: request.company_id,
        customer_id: request.customer_id,
        command_type: request.command_type as CommandType,
        parsed_payload: request.parsed_payload as ParsedPayload,
      },
      profile.id
    );
  } catch (applyError) {
    await createServiceClient()
      .from("pending_requests")
      .update({ status: "pending", resolved_by: null, resolved_at: null })
      .eq("id", requestId);

    const message =
      applyError instanceof Error ? applyError.message : "Apply failed";
    return { ok: false, error: message };
  }

  await writeAuditLog({
    companyId: profile.company_id,
    actorId: profile.id,
    action: "pending_request.approved",
    entityType: "pending_request",
    entityId: requestId,
    metadata: { command_type: request.command_type },
  });

  await logNotification({
    companyId: request.company_id,
    customerId: request.customer_id,
    notificationType: "request_approved",
    body: buildApprovedSmsMessage(
      request.command_type as CommandType,
      request.parsed_payload as ParsedPayload
    ),
  });

  revalidatePath("/dashboard/pending-requests");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/dashboard/exceptions");

  return { ok: true };
}

export async function declinePendingRequestAction(
  requestId: string,
  adminNotes?: string
): Promise<PendingRequestActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("pending_requests")
    .select("id, company_id, customer_id, status")
    .eq("id", requestId)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!request) return { ok: false, error: "Request not found" };
  if (request.status !== "pending") {
    return { ok: false, error: "Request was already resolved" };
  }

  const { data: updated, error } = await supabase
    .from("pending_requests")
    .update({
      status: "declined",
      resolved_by: profile.id,
      resolved_at: new Date().toISOString(),
      admin_notes: adminNotes?.trim() || null,
    })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updated) {
    return { ok: false, error: "Request was already resolved by another admin" };
  }

  await writeAuditLog({
    companyId: profile.company_id,
    actorId: profile.id,
    action: "pending_request.declined",
    entityType: "pending_request",
    entityId: requestId,
    metadata: { admin_notes: adminNotes?.trim() || null },
  });

  await logNotification({
    companyId: request.company_id,
    customerId: request.customer_id,
    notificationType: "request_declined",
    body: buildDeclinedSmsMessage(adminNotes),
  });

  revalidatePath("/dashboard/pending-requests");

  return { ok: true };
}
