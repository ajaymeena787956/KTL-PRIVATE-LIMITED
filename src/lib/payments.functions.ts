import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizeIndianMobile } from "./booking";
import { razorpayAuthHeader, toPaise, verifyCheckoutSignature } from "./razorpay";

const RAZORPAY_API = "https://api.razorpay.com/v1";

function getKeys() {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

/** Public: tells the storefront whether online payment is available. Only the public key id is returned. */
export const getPaymentConfig = createServerFn({ method: "GET" }).handler(async () => {
  const keys = getKeys();
  return { razorpayEnabled: !!keys, keyId: keys?.keyId ?? null };
});

const createSchema = z.object({
  orderRef: z.string().trim().toUpperCase().regex(/^KTL-\d{6}-[A-F0-9]{6}$/, "Invalid order reference"),
  phone: z.string().trim().min(10).max(20),
});

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof createSchema>) => createSchema.parse(input))
  .handler(async ({ data }) => {
    const keys = getKeys();
    if (!keys) throw new Error("Online payment is not set up yet. Please use the UPI QR option or contact support.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const phone = normalizeIndianMobile(data.phone);
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_ref", data.orderRef)
      .eq("customer_phone", phone)
      .maybeSingle();
    if (error) throw new Error("Could not load your booking. Please try again.");
    if (!order) throw new Error("Booking not found.");
    if (order.payment_method !== "razorpay") throw new Error("This booking uses QR payment.");
    if (order.payment_status === "paid") throw new Error("This booking is already paid.");

    const amount = toPaise(order.booking_amount);
    let razorpayOrderId = order.razorpay_order_id;

    if (!razorpayOrderId) {
      const res = await fetch(`${RAZORPAY_API}/orders`, {
        method: "POST",
        headers: {
          Authorization: razorpayAuthHeader(keys.keyId, keys.keySecret),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency: "INR",
          receipt: order.order_ref,
          notes: { order_ref: order.order_ref, product: order.product_name.slice(0, 250) },
        }),
      });
      if (!res.ok) {
        console.error("Razorpay order creation failed", res.status, await res.text());
        throw new Error("Could not start the online payment. Please try again or use the UPI QR option.");
      }
      const rzp = (await res.json()) as { id: string };
      razorpayOrderId = rzp.id;
      const { error: upErr } = await supabaseAdmin
        .from("orders")
        .update({ razorpay_order_id: razorpayOrderId, payment_status: "pending" })
        .eq("id", order.id);
      if (upErr) throw new Error("Could not save the payment reference. Please try again.");
    }

    return {
      keyId: keys.keyId,
      razorpayOrderId,
      amount,
      currency: "INR",
      orderRef: order.order_ref,
      productName: order.product_name,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
    };
  });

const verifySchema = z.object({
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]{6,40}$/),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]{6,40}$/),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
});

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof verifySchema>) => verifySchema.parse(input))
  .handler(async ({ data }) => {
    const keys = getKeys();
    if (!keys) throw new Error("Online payment is not configured.");

    const genuine = await verifyCheckoutSignature(
      data.razorpay_order_id,
      data.razorpay_payment_id,
      data.razorpay_signature,
      keys.keySecret,
    );
    if (!genuine) throw new Error("Payment could not be verified. If money was deducted, contact support with your order reference.");

    // Confirm the payment state directly with Razorpay before touching the order.
    const res = await fetch(`${RAZORPAY_API}/payments/${data.razorpay_payment_id}`, {
      headers: { Authorization: razorpayAuthHeader(keys.keyId, keys.keySecret) },
    });
    if (!res.ok) throw new Error("Could not confirm payment status. We will update your booking once Razorpay confirms it.");
    const payment = (await res.json()) as {
      id: string;
      order_id: string | null;
      amount: number;
      currency: string;
      status: string;
    };
    if (payment.order_id !== data.razorpay_order_id) throw new Error("Payment does not match this booking.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { syncPaymentToOrder } = await import("./payment-sync.server");
    const result = await syncPaymentToOrder(supabaseAdmin, payment);
    if (!result.ok) {
      throw new Error(
        result.reason === "amount_mismatch"
          ? "Paid amount does not match the booking amount. Our team will review it."
          : "Booking not found for this payment.",
      );
    }
    return { status: result.status, orderRef: result.orderRef };
  });
