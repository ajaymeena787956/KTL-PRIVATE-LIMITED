import { formatINR } from "./format";

/** Normalise an Indian mobile number to 10 digits (strips +91 / 0 prefixes, spaces, dashes). */
export function normalizeIndianMobile(input: string): string {
  let d = (input ?? "").replace(/\D/g, "");
  if (/^91[6-9]\d{9}$/.test(d)) d = d.slice(2);
  if (/^0[6-9]\d{9}$/.test(d)) d = d.slice(1);
  return d;
}

export function isValidIndianMobile(input: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeIndianMobile(input));
}

/**
 * Booking amount shown to customers. Mirrors the database rule in create_booking:
 * product-specific amount, else the store default, never more than the product price.
 */
export function effectiveBookingAmount(
  price: number,
  productBookingAmount: number | null | undefined,
  storeDefault: number | null | undefined,
): number {
  const base = productBookingAmount ?? storeDefault ?? 0;
  return Math.max(0, Math.min(Number(base), Number(price)));
}

/** WhatsApp number in international format (digits only). 10-digit Indian numbers get the 91 prefix. */
export function normalizeWhatsAppNumber(input: string | null | undefined): string | null {
  const d = (input ?? "").replace(/\D/g, "");
  if (!d) return null;
  if (/^[6-9]\d{9}$/.test(d)) return `91${d}`;
  if (/^0[6-9]\d{9}$/.test(d)) return `91${d.slice(1)}`;
  if (d.length >= 10 && d.length <= 15) return d;
  return null;
}

export interface WhatsAppContext {
  productName?: string | undefined;
  price?: number | undefined;
  bookingAmount?: number | undefined;
  orderRef?: string | undefined;
  productUrl?: string | undefined;
  greeting?: string | null | undefined;
}

export function buildWhatsAppMessage(ctx: WhatsAppContext): string {
  const lines: string[] = [ctx.greeting?.trim() || "Hello KTL PRIVATE LIMITED,"];
  if (ctx.orderRef) {
    lines.push(`I have a booking enquiry for order reference ${ctx.orderRef}.`);
  } else if (ctx.productName) {
    lines.push("I would like to enquire about booking this product.");
  } else {
    lines.push("I need help with a product enquiry.");
  }
  if (ctx.productName) lines.push(`Product: ${ctx.productName}`);
  if (ctx.price != null) lines.push(`Price: ${formatINR(ctx.price)}`);
  if (ctx.bookingAmount != null) lines.push(`Booking amount: ${formatINR(ctx.bookingAmount)}`);
  if (ctx.orderRef) lines.push(`Order reference: ${ctx.orderRef}`);
  if (ctx.productUrl) lines.push(`Link: ${ctx.productUrl}`);
  return lines.join("\n");
}

export function buildWhatsAppUrl(number: string | null | undefined, ctx: WhatsAppContext): string | null {
  const n = normalizeWhatsAppNumber(number);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(buildWhatsAppMessage(ctx))}`;
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Payment pending",
  awaiting_verification: "Awaiting verification",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  new: "New",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  qr: "UPI QR (manual)",
  razorpay: "Online (Razorpay)",
};
