import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { toPaise } from "./razorpay";

export interface RazorpayPaymentEntity {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed" | string;
}

export type SyncResult =
  | { ok: true; status: "paid" | "failed" | "processing"; orderRef: string }
  | { ok: false; reason: "order_not_found" | "amount_mismatch" };

/**
 * Apply a Razorpay payment (already verified as genuine) to its booking.
 * An order is only marked paid when Razorpay reports it captured for the exact booking amount in INR.
 */
export async function syncPaymentToOrder(
  admin: SupabaseClient<Database>,
  payment: RazorpayPaymentEntity,
): Promise<SyncResult> {
  if (!payment.order_id) return { ok: false, reason: "order_not_found" };
  const { data: order, error } = await admin
    .from("orders")
    .select("id, order_ref, booking_amount, payment_status, order_status")
    .eq("razorpay_order_id", payment.order_id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) return { ok: false, reason: "order_not_found" };
  if (order.payment_status === "paid") return { ok: true, status: "paid", orderRef: order.order_ref };

  if (payment.status === "captured") {
    if (payment.amount !== toPaise(order.booking_amount) || payment.currency !== "INR") {
      await admin
        .from("orders")
        .update({ admin_notes: `Razorpay amount mismatch: received ${payment.amount} ${payment.currency} (payment ${payment.id}).` })
        .eq("id", order.id);
      return { ok: false, reason: "amount_mismatch" };
    }
    const { error: upErr } = await admin
      .from("orders")
      .update({
        payment_status: "paid",
        razorpay_payment_id: payment.id,
        paid_amount: payment.amount / 100,
        paid_at: new Date().toISOString(),
        order_status: order.order_status === "new" ? "confirmed" : order.order_status,
      })
      .eq("id", order.id)
      .neq("payment_status", "paid");
    if (upErr) throw new Error(upErr.message);
    return { ok: true, status: "paid", orderRef: order.order_ref };
  }

  if (payment.status === "failed") {
    await admin
      .from("orders")
      .update({ payment_status: "failed", razorpay_payment_id: payment.id })
      .eq("id", order.id)
      .neq("payment_status", "paid");
    return { ok: true, status: "failed", orderRef: order.order_ref };
  }

  return { ok: true, status: "processing", orderRef: order.order_ref };
}
