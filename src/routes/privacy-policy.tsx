import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";
export const Route = createFileRoute("/privacy-policy")({
  head: () => ({ meta: [{ title: "Privacy Policy — KTL PRIVATE LIMITED" }, { name: "description", content: "Privacy Policy of KTL PRIVATE LIMITED." }, { property: "og:title", content: "Privacy Policy — KTL" }, { property: "og:description", content: "Privacy Policy of KTL PRIVATE LIMITED." }] }),
  component: () => <PolicyPage title="Privacy Policy" field="policy_privacy" fallback="KTL PRIVATE LIMITED collects only the details needed to process bookings (name, mobile number, optional email/address). We never sell your data. Payment details are handled by our payment partners; we do not store card or UPI credentials." />,
});
