import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";
export const Route = createFileRoute("/shipping-policy")({
  head: () => ({ meta: [{ title: "Shipping Policy — KTL PRIVATE LIMITED" }, { name: "description", content: "Shipping Policy of KTL PRIVATE LIMITED." }, { property: "og:title", content: "Shipping Policy — KTL" }, { property: "og:description", content: "Shipping Policy of KTL PRIVATE LIMITED." }] }),
  component: () => <PolicyPage title="Shipping Policy" field="policy_shipping" fallback="Delivery timelines are shared after booking confirmation and depend on location and stock. Large appliances and furniture include doorstep delivery; installation is arranged where applicable." />,
});
