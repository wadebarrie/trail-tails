import { createServiceClient } from "@/lib/supabase/service";

type AuditInput = {
  companyId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(input: AuditInput) {
  const supabase = createServiceClient();
  await supabase.from("audit_log").insert({
    company_id: input.companyId,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata ?? {},
  });
}
