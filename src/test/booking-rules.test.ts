import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl, effectiveBookingAmount, isValidIndianMobile, normalizeIndianMobile } from "@/lib/booking";
import { hmacSha256Hex, verifyCheckoutSignature, toPaise } from "@/lib/razorpay";

describe("booking rules", () => {
  it("uses the product booking amount when set", () => expect(effectiveBookingAmount(18999, 1000, 500)).toBe(1000));
  it("falls back to the store default booking amount", () => expect(effectiveBookingAmount(18999, null, 500)).toBe(500));
  it("never charges more than the product price", () => expect(effectiveBookingAmount(300, null, 500)).toBe(300));
  it("normalises +91 mobile numbers", () => expect(normalizeIndianMobile("+91 98765-43210")).toBe("9876543210"));
  it("rejects numbers not starting 6-9", () => expect(isValidIndianMobile("5876543210")).toBe(false));
});

describe("WhatsApp support link", () => {
  it("includes product name, price and order reference", () => {
    const url = buildWhatsAppUrl("9876543210", { productName: "Laptop", price: 54990, orderRef: "KTL-261104-ABC123" })!;
    expect(url.startsWith("https://wa.me/919876543210?text=")).toBe(true);
    const text = decodeURIComponent(url.split("text=")[1]!);
    expect(text).toContain("Product: Laptop");
    expect(text).toContain("54,990");
    expect(text).toContain("KTL-261104-ABC123");
  });
  it("returns no link when the number is not set", () => expect(buildWhatsAppUrl("", {})).toBeNull());
});

describe("Razorpay verification", () => {
  it("accepts only the correct signature", async () => {
    const sig = await hmacSha256Hex("secret", "order_1|pay_1");
    expect(await verifyCheckoutSignature("order_1", "pay_1", sig, "secret")).toBe(true);
    expect(await verifyCheckoutSignature("order_1", "pay_2", sig, "secret")).toBe(false);
  });
  it("converts rupees to paise", () => expect(toPaise(1000.5)).toBe(100050));
});
