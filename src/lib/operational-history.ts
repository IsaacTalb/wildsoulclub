import { supabaseAdmin } from "@/lib/supabase-admin";

export type AuditLogInput = {
  actorUserId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
};

export type InventoryTransactionInput = {
  productId: string;
  variantId?: string | null;
  quantityDelta: number;
  reason: string;
  referenceType?: string | null;
  referenceId?: string | null;
  actorUserId?: string | null;
};

export async function writeAuditLog(input: AuditLogInput) {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    actor_user_id: input.actorUserId ?? null,
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    before: input.before ?? null,
    after: input.after ?? null,
  });
  if (error) throw error;
}

export async function writeInventoryTransaction(input: InventoryTransactionInput) {
  if (input.quantityDelta === 0) return;

  const { error } = await supabaseAdmin.from("inventory_transactions").insert({
    product_id: input.productId,
    variant_id: input.variantId ?? null,
    quantity_delta: input.quantityDelta,
    reason: input.reason,
    reference_type: input.referenceType ?? null,
    reference_id: input.referenceId ?? null,
    actor_user_id: input.actorUserId ?? null,
  });
  if (error) throw error;
}
