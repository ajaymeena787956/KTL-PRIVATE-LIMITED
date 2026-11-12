import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/booking";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/track")({
  head: () => ({ meta: [{ title: "Track Booking — KTL PRIVATE LIMITED" }, { name: "description", content: "Check your booking status." }, { property: "og:title", content: "Track Booking — KTL" }, { property: "og:description", content: "Check your booking status." }] }),
  component: Track,
});
function Track() {
  const [ref, setRef] = useState(""); const [phone, setPhone] = useState("");
  const [r, setR] = useState<{ product_name: string; booking_amount: number; payment_status: string; order_status: string } | null>(null);
  async function go(e: React.FormEvent) { e.preventDefault();
    const { data, error } = await supabase.rpc("get_booking_status", { _order_ref: ref, _phone: phone });
    if (error || !data) { setR(null); { toast.error("No booking found for these details."); return; } }
    setR(data as unknown as { product_name: string; booking_amount: number; payment_status: string; order_status: string }); }
  return <SiteLayout><div className="container-page max-w-lg py-12"><h1 className="mb-6 text-3xl font-bold">Track your booking</h1>
    <form onSubmit={go} className="space-y-3"><Input placeholder="Order reference (KTL-...)" value={ref} onChange={(e) => setRef(e.target.value)} /><Input placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} /><Button className="w-full">Check status</Button></form>
    {r && <div className="mt-6 space-y-1 rounded-2xl border border-border bg-card p-5"><p className="font-bold">{r.product_name}</p><p>Booking: {formatINR(r.booking_amount)}</p><p>Payment: {PAYMENT_STATUS_LABEL[r.payment_status]}</p><p>Order: {ORDER_STATUS_LABEL[r.order_status]}</p></div>}
  </div></SiteLayout>;
}
