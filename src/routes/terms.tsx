import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";
export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — KTL PRIVATE LIMITED" }, { name: "description", content: "Terms & Conditions of KTL PRIVATE LIMITED." }, { property: "og:title", content: "Terms & Conditions — KTL" }, { property: "og:description", content: "Terms & Conditions of KTL PRIVATE LIMITED." }] }),
  component: () => <PolicyPage title="Terms & Conditions" field="policy_terms" fallback="Bookings are confirmed after the booking amount is verified. Prices and availability may change. The balance is payable on delivery. KTL PRIVATE LIMITED may cancel bookings for unavailable stock with a full refund of the booking amount." />,
});
