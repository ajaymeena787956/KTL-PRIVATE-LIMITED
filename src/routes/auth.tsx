import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { MASTER_ADMIN_EMAIL, validateAdminSignup } from "@/lib/master-admin";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Master Admin Login — KTL PRIVATE LIMITED" }, { name: "description", content: "Master Admin sign in and registration for KTL PRIVATE LIMITED." }, { property: "og:title", content: "Master Admin Login — KTL" }, { property: "og:description", content: "Master Admin sign in." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Auth,
});

type Mode = "in" | "up" | "forgot";
function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("in");
  const [email, setEmail] = useState(MASTER_ADMIN_EMAIL);
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false); const [sent, setSent] = useState<string | null>(null);

  async function go(e: React.FormEvent) {
    e.preventDefault(); setSent(null);
    if (mode === "up") { const err = validateAdminSignup(email, pw, pw2); if (err) { toast.error(err); return; } }
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
        if (error) throw error;
        const { data: ok } = await supabase.rpc("is_admin");
        if (!ok) { await supabase.auth.signOut(); throw new Error("This account does not have Master Admin access."); }
        toast.success("Welcome, Master Admin"); nav({ to: "/admin" });
      } else if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password: pw, options: { emailRedirectTo: window.location.origin + "/admin" } });
        if (error) throw error;
        if (data.user && data.user.identities?.length === 0) { toast.info("This account already exists — please sign in."); setMode("in"); return; }
        setSent("Verification link sent. Open your email and click the link to activate Master Admin access.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        setSent("Password reset link sent to your email.");
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setBusy(false); }
  }
  const title = mode === "in" ? "Master Admin sign in" : mode === "up" ? "Register Master Admin" : "Reset password";
  return <div className="flex min-h-screen items-center justify-center bg-soft p-4">
    <form onSubmit={go} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <img src="/icon-192.png" alt="KTL" className="size-12 rounded-xl" />
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      {mode !== "forgot" && <div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} /></div>}
      {mode === "up" && <div className="space-y-1.5"><Label htmlFor="pw2">Confirm password</Label><Input id="pw2" type="password" autoComplete="new-password" minLength={8} required value={pw2} onChange={(e) => setPw2(e.target.value)} /><p className="text-xs text-muted-foreground">At least 8 characters, with letters and numbers.</p></div>}
      {sent && <p className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">{sent}</p>}
      <Button className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}</Button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        {mode !== "in" && <button type="button" className="text-primary" onClick={() => { setMode("in"); setSent(null); }}>Back to sign in</button>}
        {mode === "in" && <button type="button" className="text-primary" onClick={() => setMode("up")}>Register Master Admin</button>}
        {mode === "in" && <button type="button" className="text-primary" onClick={() => setMode("forgot")}>Forgot password?</button>}
      </div>
    </form></div>;
}
