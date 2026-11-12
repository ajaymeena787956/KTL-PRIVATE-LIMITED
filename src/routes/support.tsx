import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Customer Support — KTL PRIVATE LIMITED" }, { name: "description", content: "Contact KTL PRIVATE LIMITED support." }, { property: "og:title", content: "Customer Support — KTL" }, { property: "og:description", content: "Send us an enquiry." }] }),
  component: Support,
});
function Support() {
  const [f, setF] = useState({ name: "", phone: "", message: "" }); const [busy, setBusy] = useState(false);
  async function send(e: React.FormEvent) { e.preventDefault();
    if (f.name.trim().length < 2 || !/^[0-9+ -]{10,16}$/.test(f.phone) || f.message.trim().length < 5) { toast.error("Please fill name, valid phone and a message."); return; }
    setBusy(true); const { error } = await supabase.from("enquiries").insert(f); setBusy(false);
    if (error) { toast.error("Could not send. Please try again."); return; } toast.success("Enquiry sent! We'll contact you soon."); setF({ name: "", phone: "", message: "" }); }
  return <SiteLayout><div className="container-page max-w-lg py-12"><h1 className="mb-6 text-3xl font-bold">Customer support</h1>
    <form onSubmit={send} className="space-y-3"><Input placeholder="Name" maxLength={100} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><Input placeholder="Phone" maxLength={16} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /><Textarea placeholder="How can we help?" maxLength={2000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /><Button disabled={busy} className="w-full">{busy ? "Sending…" : "Send enquiry"}</Button></form></div></SiteLayout>;
}
