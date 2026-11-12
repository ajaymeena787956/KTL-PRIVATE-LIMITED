import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — KTL PRIVATE LIMITED" }, { name: "description", content: "Set a new Master Admin password." }, { property: "og:title", content: "Reset Password — KTL" }, { property: "og:description", content: "Set a new password." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Reset,
});
function Reset() {
  const nav = useNavigate();
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    if (pw !== pw2) return toast.error("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated"); nav({ to: "/admin" });
  }
  return <div className="flex min-h-screen items-center justify-center bg-soft p-4">
    <form onSubmit={go} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h1 className="text-2xl font-bold">Set new password</h1>
      <div className="space-y-1.5"><Label htmlFor="np">New password</Label><Input id="np" type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="np2">Confirm password</Label><Input id="np2" type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
      <Button className="w-full" disabled={busy}>{busy ? "Saving…" : "Update password"}</Button>
    </form></div>;
}
