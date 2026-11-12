import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";
export const Route = createFileRoute("/refund-policy")({
  head: () => ({ meta: [{ title: "Refund & Return Policy — KTL PRIVATE LIMITED" }, { name: "description", content: "Refund & Return Policy of KTL PRIVATE LIMITED." }, { property: "og:title", content: "Refund & Return Policy — KTL" }, { property: "og:description", content: "Refund & Return Policy of KTL PRIVATE LIMITED." }] }),
  component: () => <PolicyPage title="Refund & Return Policy" field="policy_refund" fallback="Booking amounts are refundable if we cannot fulfil your order. Damaged or defective products reported within 48 hours of delivery are eligible for replacement or return, subject to inspection. Refunds go back to the original payment method within 7 working days." />,
});
