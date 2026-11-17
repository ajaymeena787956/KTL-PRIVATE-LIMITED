import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  BadgePercent, ClipboardList, CreditCard, FileText, FolderTree, Inbox, LayoutDashboard, LogOut, MessageCircle,
  Package, Palette, Settings as SettingsIcon, ShieldCheck, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, buildWhatsAppUrl } from "@/lib/booking";
import { formatDateTime, formatINR, slugify } from "@/lib/format";
import { parseSpecs, type Category, type EnquiryStatus, type Offer, type Order, type OrderStatus, type Product, type StoreSettings } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Master Admin Panel — KTL PRIVATE LIMITED" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

const SECTIONS = [
  ["Overview", LayoutDashboard], ["Products", Package], ["Categories", FolderTree], ["Orders", ClipboardList],
  ["Payments", CreditCard], ["Offers", BadgePercent], ["Customers", Users], ["Enquiries", Inbox],
  ["Website Design", Palette], ["WhatsApp", MessageCircle], ["Policies", FileText], ["Settings", SettingsIcon], ["Security", ShieldCheck],
] as const;
type Section = (typeof SECTIONS)[number][0];

const sel = "h-10 rounded-lg border border-input bg-card px-2 text-sm";
const card = "rounded-xl border border-border bg-card p-4 shadow-card";

function err(e: unknown) { toast.error(e instanceof Error ? e.message : (e as { message?: string })?.message ?? "Something went wrong"); }

function useAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

// ---------- data hooks (RLS: admin only) ----------
const useProducts = () => useQuery({ queryKey: ["a-products"], queryFn: async () => { const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
const useCategories = () => useQuery({ queryKey: ["a-categories"], queryFn: async () => { const { data, error } = await supabase.from("categories").select("*").order("sort_order").order("name"); if (error) throw error; return data; } });
const useOrders = () => useQuery({ queryKey: ["a-orders"], queryFn: async () => { const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(1000); if (error) throw error; return data; } });
const useEnquiries = () => useQuery({ queryKey: ["a-enq"], queryFn: async () => { const { data, error } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(500); if (error) throw error; return data; } });
const useOffers = () => useQuery({ queryKey: ["a-offers"], queryFn: async () => { const { data, error } = await supabase.from("offers").select("*").order("sort_order"); if (error) throw error; return data; } });
const useSettings = () => useQuery({ queryKey: ["a-settings"], queryFn: async () => { const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single(); if (error) throw error; return data; } });

async function upload(file: File, folder: "products" | "store" | "categories"): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use JPG, PNG or WEBP images.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image must be under 10 MB.");
  const path = `${folder}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return `/api/public/media/${path}`;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1 text-sm"><span className="font-medium text-foreground">{label}</span>{children}</label>;
}

function UploadButton({ label, folder, onDone, multiple }: { label: string; folder: "products" | "store" | "categories"; onDone: (urls: string[]) => void; multiple?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-input bg-card px-3 text-sm font-semibold hover:bg-accent">
      {busy ? "Uploading…" : label}
      <input type="file" accept="image/jpeg,image/png,image/webp" hidden multiple={multiple} onChange={async (e) => {
        const files = Array.from(e.target.files ?? []); e.target.value = ""; if (!files.length) return;
        setBusy(true);
        try { const urls: string[] = []; for (const f of files) urls.push(await upload(f, folder)); onDone(urls); toast.success("Image uploaded"); }
        catch (x) { err(x); } finally { setBusy(false); }
      }} />
    </label>
  );
}

// ---------- shell ----------
function Admin() {
  const nav = useNavigate(); const qc = useQueryClient();
  const [section, setSection] = useState<Section>("Overview");
  const isAdmin = useQuery({ queryKey: ["is-admin"], queryFn: async () => { const { data, error } = await supabase.rpc("is_admin"); if (error) throw error; return data === true; } });
  async function signOut() { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); nav({ to: "/auth", replace: true }); }

  if (isAdmin.isLoading) return <p className="p-8 text-muted-foreground">Checking access…</p>;
  if (!isAdmin.data) return <div className="mx-auto max-w-md p-8"><h1 className="mb-2 text-xl font-bold">Access denied</h1><p className="mb-4 text-muted-foreground">This account is not the Master Admin.</p><Button onClick={signOut}>Sign out</Button></div>;

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar p-3 text-sidebar-foreground lg:flex">
        <p className="px-3 py-4 font-display text-lg font-bold">KTL Master Admin</p>
        <nav className="flex-1 space-y-0.5">
          {SECTIONS.map(([name, Icon]) => (
            <button key={name} onClick={() => setSection(name)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${section === name ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"}`}>
              <Icon className="size-4" /> {name}
            </button>
          ))}
        </nav>
        <a href="/" target="_blank" rel="noreferrer" className="px-3 py-2 text-sm underline">View website</a>
        <button onClick={signOut} className="flex items-center gap-2 px-3 py-2 text-sm"><LogOut className="size-4" /> Sign out</button>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-card lg:hidden">
          <div className="flex items-center justify-between bg-navy px-4 py-3 text-navy-foreground">
            <span className="font-display font-bold">KTL Master Admin</span>
            <Button size="sm" variant="heroOutline" onClick={signOut}><LogOut /> Sign out</Button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-2 py-2">
            {SECTIONS.map(([name, Icon]) => (
              <Button key={name} size="sm" variant={section === name ? "default" : "ghost"} onClick={() => setSection(name)} className="shrink-0"><Icon /> {name}</Button>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
          <h1 className="text-2xl font-bold">{section}</h1>
          {section === "Overview" && <Overview go={setSection} />}
          {section === "Products" && <Products />}
          {section === "Categories" && <Categories />}
          {section === "Orders" && <Orders />}
          {section === "Payments" && <Payments />}
          {section === "Offers" && <Offers />}
          {section === "Customers" && <Customers />}
          {section === "Enquiries" && <Enquiries />}
          {section === "Website Design" && <Design />}
          {section === "WhatsApp" && <WhatsApp />}
          {section === "Policies" && <Policies />}
          {section === "Settings" && <SettingsSection />}
          {section === "Security" && <Security />}
        </main>
      </div>
    </div>
  );
}

// ---------- overview ----------
function Overview({ go }: { go: (s: Section) => void }) {
  const o = useOrders(); const p = useProducts(); const e = useEnquiries();
  const orders = o.data ?? [];
  const paid = orders.filter((x) => x.payment_status === "paid");
  const stats: [string, string | number, Section][] = [
    ["Total bookings", orders.length, "Orders"],
    ["Awaiting payment check", orders.filter((x) => x.payment_status === "awaiting_verification").length, "Payments"],
    ["Paid bookings", paid.length, "Payments"],
    ["Booking revenue", formatINR(paid.reduce((s, x) => s + Number(x.paid_amount ?? x.booking_amount), 0)), "Payments"],
    ["Products", p.data?.length ?? 0, "Products"],
    ["Low stock (≤3)", (p.data ?? []).filter((x) => x.stock_quantity <= 3).length, "Products"],
    ["New enquiries", (e.data ?? []).filter((x) => x.status === "new").length, "Enquiries"],
    ["Customers", new Set(orders.map((x) => x.customer_phone)).size, "Customers"],
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([k, v, s]) => <button key={k} onClick={() => go(s)} className={`${card} text-left hover:border-primary`}><p className="text-xs text-muted-foreground">{k}</p><p className="font-display text-2xl font-bold">{v}</p></button>)}
      </div>
      <h2 className="font-bold">Latest bookings</h2>
      {orders.slice(0, 5).map((x) => <OrderLine key={x.id} o={x} />)}
      {!orders.length && <p className="text-muted-foreground">No bookings yet.</p>}
    </div>
  );
}
function OrderLine({ o }: { o: Order }) {
  return <div className={`${card} flex flex-wrap justify-between gap-2 text-sm`}><span><b className="text-primary">{o.order_ref}</b> · {o.product_name}</span><span>{o.customer_name} · {formatINR(o.booking_amount)} · {PAYMENT_STATUS_LABEL[o.payment_status]}</span></div>;
}

// ---------- products ----------
type PForm = { id?: string; name: string; slug: string; category_id: string; short_description: string; description: string; specs: string; brand: string; model: string; quality: string; warranty: string; price: string; mrp: string; booking_amount: string; stock_quantity: string; images: string[]; is_active: boolean; is_featured: boolean };
const emptyP: PForm = { name: "", slug: "", category_id: "", short_description: "", description: "", specs: "", brand: "", model: "", quality: "", warranty: "", price: "", mrp: "", booking_amount: "", stock_quantity: "0", images: [], is_active: true, is_featured: false };
function toForm(p: Product): PForm {
  return { id: p.id, name: p.name, slug: p.slug, category_id: p.category_id ?? "", short_description: p.short_description ?? "", description: p.description ?? "", specs: parseSpecs(p.specifications).map((s) => `${s.label}: ${s.value}`).join("\n"), brand: p.brand ?? "", model: p.model ?? "", quality: p.quality ?? "", warranty: p.warranty ?? "", price: String(p.price), mrp: p.mrp != null ? String(p.mrp) : "", booking_amount: p.booking_amount != null ? String(p.booking_amount) : "", stock_quantity: String(p.stock_quantity), images: p.images, is_active: p.is_active, is_featured: p.is_featured };
}

function Products() {
  const p = useProducts(); const c = useCategories(); const refresh = useAll();
  const [editing, setEditing] = useState<PForm | null>(null); const [q, setQ] = useState("");
  const list = (p.data ?? []).filter((x) => x.name.toLowerCase().includes(q.toLowerCase()));
  async function patch(id: string, v: Partial<Product>, msg = "Saved") { const { error } = await supabase.from("products").update(v).eq("id", id); if (error) return err(error); toast.success(msg); refresh(); }
  async function del(x: Product) { if (!confirm(`Delete "${x.name}"? Existing bookings are kept.`)) return; const { error } = await supabase.from("products").delete().eq("id", x.id); if (error) return err(error); toast.success("Product deleted"); refresh(); }
  if (editing) return <ProductForm initial={editing} categories={c.data ?? []} onClose={() => { setEditing(null); refresh(); }} />;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2"><Button onClick={() => setEditing({ ...emptyP })}>+ Add product</Button><Input className="max-w-xs" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {p.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {list.map((x) => <StockRow key={x.id} p={x} onEdit={() => setEditing(toForm(x))} onPatch={(v, m) => patch(x.id, v, m)} onDelete={() => del(x)} />)}
    </div>
  );
}
function StockRow({ p, onEdit, onPatch, onDelete }: { p: Product; onEdit: () => void; onPatch: (v: Partial<Product>, m?: string) => void; onDelete: () => void }) {
  const [stock, setStock] = useState(String(p.stock_quantity));
  return (
    <div className={`${card} flex flex-wrap items-center gap-3 text-sm`}>
      {p.images[0] ? <img src={p.images[0]} alt="" className="size-14 rounded-lg object-contain" /> : <div className="size-14 rounded-lg bg-muted" />}
      <div className="min-w-0 flex-1"><p className="font-semibold">{p.name}</p><p className="text-muted-foreground">{formatINR(p.price)} · Booking {p.booking_amount != null ? formatINR(p.booking_amount) : "default"} · <span className={p.is_active ? "text-success" : "text-destructive"}>{p.is_active ? "Published" : "Hidden"}</span>{p.is_featured ? " · Featured" : ""}</p></div>
      <div className="flex items-center gap-1"><Input aria-label={`Stock for ${p.name}`} className="w-20" type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} /><Button size="sm" variant="outline" onClick={() => { const n = parseInt(stock, 10); if (!(n >= 0)) return err(new Error("Stock must be 0 or more")); onPatch({ stock_quantity: n }, "Stock updated"); }}>Set stock</Button></div>
      <div className="flex flex-wrap gap-1">
        <Button size="sm" onClick={onEdit}>Edit</Button>
        <Button size="sm" variant="outline" onClick={() => onPatch({ is_active: !p.is_active }, p.is_active ? "Unpublished" : "Published")}>{p.is_active ? "Unpublish" : "Publish"}</Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>Delete</Button>
      </div>
    </div>
  );
}
function ProductForm({ initial, categories, onClose }: { initial: PForm; categories: Category[]; onClose: () => void }) {
  const [f, setF] = useState(initial); const [busy, setBusy] = useState(false);
  const set = (k: keyof PForm, v: unknown) => setF((s) => ({ ...s, [k]: v }));
  async function save() {
    const price = Number(f.price), stock = parseInt(f.stock_quantity, 10);
    const mrp = f.mrp === "" ? null : Number(f.mrp), booking = f.booking_amount === "" ? null : Number(f.booking_amount);
    const slug = slugify(f.slug || f.name);
    if (f.name.trim().length < 2) return err(new Error("Product name is required"));
    if (!slug) return err(new Error("Enter a valid name"));
    if (!(price >= 0) || f.price === "") return err(new Error("Enter a valid price"));
    if (!(stock >= 0)) return err(new Error("Enter a valid stock quantity"));
    if ((mrp != null && !(mrp >= 0)) || (booking != null && !(booking >= 0))) return err(new Error("Enter valid MRP / booking amount"));
    const specifications = f.specs.split("\n").map((l) => l.split(":")).filter((a) => a.length >= 2 && a[0]!.trim()).map((a) => ({ label: a[0]!.trim(), value: a.slice(1).join(":").trim() }));
    const row = { name: f.name.trim(), slug, category_id: f.category_id || null, short_description: f.short_description || null, description: f.description || null, specifications, brand: f.brand || null, model: f.model || null, quality: f.quality || null, warranty: f.warranty || null, price, mrp, booking_amount: booking, stock_quantity: stock, images: f.images, is_active: f.is_active, is_featured: f.is_featured };
    setBusy(true);
    const { error } = f.id ? await supabase.from("products").update(row).eq("id", f.id) : await supabase.from("products").insert(row);
    setBusy(false);
    if (error) return err(error.code === "23505" ? new Error("Another product already uses this web address (slug).") : error);
    toast.success(f.id ? "Product updated — live on website" : "Product added — live on website"); onClose();
  }
  const t = (k: keyof PForm, label: string, type = "text") => <Field label={label}><Input type={type} value={f[k] as string} onChange={(e) => set(k, e.target.value)} /></Field>;
  return (
    <div className={`${card} space-y-4`}>
      <div className="flex justify-between"><h2 className="text-lg font-bold">{f.id ? "Edit product" : "Add product"}</h2><Button variant="ghost" onClick={onClose}>Cancel</Button></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {t("name", "Product name *")}{t("slug", "Web address (auto from name)")}
        <Field label="Category"><select className={`${sel} w-full`} value={f.category_id} onChange={(e) => set("category_id", e.target.value)}><option value="">— None —</option>{categories.filter((c) => !c.parent_id).map((c) => [<option key={c.id} value={c.id}>{c.name}</option>, ...categories.filter((s) => s.parent_id === c.id).map((s) => <option key={s.id} value={s.id}>— {s.name}</option>)])}</select></Field>
        {t("brand", "Brand")}{t("model", "Model")}{t("quality", "Quality")}{t("warranty", "Warranty")}
        {t("price", "Price (₹) *", "number")}{t("mrp", "MRP (₹, for discount)", "number")}{t("booking_amount", "Booking amount (₹, blank = default)", "number")}{t("stock_quantity", "Stock quantity *", "number")}
      </div>
      <Field label="Short description"><Input value={f.short_description} maxLength={300} onChange={(e) => set("short_description", e.target.value)} /></Field>
      <Field label="Detailed description"><Textarea rows={5} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
      <Field label="Specifications (one per line, Label: Value)"><Textarea rows={4} value={f.specs} placeholder={"Display: 6.7 inch\nRAM: 8 GB"} onChange={(e) => set("specs", e.target.value)} /></Field>
      <div className="space-y-2"><p className="text-sm font-medium">Photos</p>
        <div className="flex flex-wrap gap-2">{f.images.map((u, i) => <div key={u} className="relative"><img src={u} alt="" className="size-20 rounded-lg border border-border object-contain" />{i === 0 && <span className="absolute left-1 top-1 rounded bg-primary px-1 text-[10px] text-primary-foreground">Main</span>}<button className="absolute -right-1 -top-1 rounded-full bg-destructive px-1.5 text-xs text-destructive-foreground" onClick={() => set("images", f.images.filter((x) => x !== u))} aria-label="Remove photo">×</button></div>)}</div>
        <UploadButton label="Upload photos" folder="products" multiple onDone={(urls) => set("images", [...f.images, ...urls])} />
      </div>
      <div className="flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Published (visible on website)</label><label className="flex items-center gap-2"><input type="checkbox" checked={f.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured on homepage</label></div>
      <Button size="lg" className="w-full" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save product"}</Button>
    </div>
  );
}

// ---------- categories ----------
function Categories() {
  const c = useCategories(); const refresh = useAll();
  const [n, setN] = useState({ name: "", parent_id: "", description: "" });
  const cats = c.data ?? [];
  async function add() {
    if (n.name.trim().length < 1) return err(new Error("Enter a category name"));
    const { error } = await supabase.from("categories").insert({ name: n.name.trim(), slug: slugify(n.name), parent_id: n.parent_id || null, description: n.description || null, sort_order: cats.length + 1 });
    if (error) return err(error.code === "23505" ? new Error("A category with this name already exists") : error);
    toast.success("Category added"); setN({ name: "", parent_id: "", description: "" }); refresh();
  }
  async function patch(id: string, v: Partial<Category>, m = "Saved") { const { error } = await supabase.from("categories").update(v).eq("id", id); if (error) return err(error); toast.success(m); refresh(); }
  async function del(x: Category) { if (!confirm(`Delete "${x.name}"? Products stay but become uncategorised.`)) return; const { error } = await supabase.from("categories").delete().eq("id", x.id); if (error) return err(error); toast.success("Category deleted"); refresh(); }
  return (
    <div className="space-y-4">
      <div className={`${card} grid gap-2 sm:grid-cols-[1fr_1fr_auto]`}>
        <Input placeholder="New category name" value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} />
        <select className={sel} value={n.parent_id} onChange={(e) => setN({ ...n, parent_id: e.target.value })}><option value="">Main category</option>{cats.filter((x) => !x.parent_id).map((x) => <option key={x.id} value={x.id}>Subcategory of {x.name}</option>)}</select>
        <Button onClick={add}>Add category</Button>
      </div>
      {cats.filter((x) => !x.parent_id).map((top) => (
        <div key={top.id} className={`${card} space-y-2`}>
          <CatRow c={top} onPatch={patch} onDelete={del} />
          <div className="space-y-2 border-l-2 border-primary-soft pl-3">{cats.filter((s) => s.parent_id === top.id).map((s) => <CatRow key={s.id} c={s} onPatch={patch} onDelete={del} />)}</div>
        </div>
      ))}
    </div>
  );
}
function CatRow({ c, onPatch, onDelete }: { c: Category; onPatch: (id: string, v: Partial<Category>, m?: string) => void; onDelete: (c: Category) => void }) {
  const [name, setName] = useState(c.name);
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Input className="max-w-xs" value={name} onChange={(e) => setName(e.target.value)} aria-label="Category name" />
      <Button size="sm" variant="outline" disabled={name === c.name || !name.trim()} onClick={() => onPatch(c.id, { name: name.trim() }, "Renamed")}>Save</Button>
      <Button size="sm" variant="outline" onClick={() => onPatch(c.id, { is_active: !c.is_active }, c.is_active ? "Hidden" : "Shown")}>{c.is_active ? "Hide" : "Show"}</Button>
      <Button size="sm" variant="destructive" onClick={() => onDelete(c)}>Delete</Button>
      {!c.is_active && <span className="text-destructive">Hidden</span>}
    </div>
  );
}

// ---------- orders ----------
function Orders() {
  const o = useOrders(); const refresh = useAll();
  const [q, setQ] = useState(""); const [st, setSt] = useState("");
  const list = (o.data ?? []).filter((x) => (!st || x.order_status === st) && (!q || `${x.order_ref} ${x.customer_name} ${x.customer_phone} ${x.product_name}`.toLowerCase().includes(q.toLowerCase())));
  async function upd(id: string, v: Partial<Order>) { const { error } = await supabase.from("orders").update(v).eq("id", id); if (error) return err(error); toast.success("Order updated"); refresh(); }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2"><Input className="max-w-xs" placeholder="Search ref, name, phone, product" value={q} onChange={(e) => setQ(e.target.value)} /><select className={sel} value={st} onChange={(e) => setSt(e.target.value)}><option value="">All statuses</option>{Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      {o.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {list.map((x) => <OrderCard key={x.id} o={x} onUpdate={(v) => upd(x.id, v)} />)}
      {!o.isLoading && !list.length && <p className="text-muted-foreground">No bookings found.</p>}
    </div>
  );
}
function OrderCard({ o, onUpdate }: { o: Order; onUpdate: (v: Partial<Order>) => void }) {
  const [notes, setNotes] = useState(o.admin_notes ?? "");
  return (
    <div className={`${card} space-y-2 text-sm`}>
      <div className="flex flex-wrap justify-between gap-2"><b className="text-primary">{o.order_ref}</b><span className="text-muted-foreground">{formatDateTime(o.created_at)}</span></div>
      <p><b>{o.product_name}</b> · Price {formatINR(o.product_price)} · Booking {formatINR(o.booking_amount)}</p>
      <p>{o.customer_name} · <a className="text-primary" href={`tel:${o.customer_phone}`}>{o.customer_phone}</a>{o.customer_email ? ` · ${o.customer_email}` : ""}</p>
      {o.customer_address && <p className="text-muted-foreground">{o.customer_address}</p>}
      <p className="text-muted-foreground">{PAYMENT_METHOD_LABEL[o.payment_method]} · <b>{PAYMENT_STATUS_LABEL[o.payment_status]}</b>{o.qr_transaction_ref ? ` · UTR ${o.qr_transaction_ref}` : ""}{o.razorpay_payment_id ? ` · ${o.razorpay_payment_id}` : ""}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Field label="Order status"><select className={sel} value={o.order_status} onChange={(e) => onUpdate({ order_status: e.target.value as OrderStatus })}>{Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      </div>
      <div className="flex gap-2"><Input placeholder="Internal note" value={notes} onChange={(e) => setNotes(e.target.value)} /><Button size="sm" variant="outline" className="h-10" onClick={() => onUpdate({ admin_notes: notes || null })}>Save note</Button></div>
    </div>
  );
}

// ---------- payments ----------
function Payments() {
  const o = useOrders(); const refresh = useAll();
  const pending = (o.data ?? []).filter((x) => x.payment_method === "qr" && (x.payment_status === "awaiting_verification" || x.payment_status === "pending"));
  const done = (o.data ?? []).filter((x) => x.payment_status === "paid" || x.payment_status === "failed" || x.payment_status === "refunded").slice(0, 30);
  async function verify(x: Order, ok: boolean) {
    if (ok && !confirm(`Confirm you received ${formatINR(x.booking_amount)} for ${x.order_ref}${x.qr_transaction_ref ? ` (UTR ${x.qr_transaction_ref})` : ""}?`)) return;
    const v: Partial<Order> = ok ? { payment_status: "paid", order_status: x.order_status === "new" ? "confirmed" : x.order_status } : { payment_status: "failed" };
    const { error } = await supabase.from("orders").update(v).eq("id", x.id); if (error) return err(error);
    toast.success(ok ? "Payment verified — marked paid" : "Payment rejected"); refresh();
  }
  async function refund(x: Order) { if (!confirm("Mark this payment as refunded?")) return; const { error } = await supabase.from("orders").update({ payment_status: "refunded" }).eq("id", x.id); if (error) return err(error); toast.success("Marked refunded"); refresh(); }
  return (
    <div className="space-y-6">
      <QrSettings />
      <section className="space-y-2"><h2 className="font-bold">QR payments to verify ({pending.length})</h2>
        <p className="text-sm text-muted-foreground">Check your bank/UPI app for the amount and UTR before marking paid. Online (Razorpay) payments are verified automatically and cannot be marked paid by hand.</p>
        {pending.map((x) => <div key={x.id} className={`${card} flex flex-wrap items-center justify-between gap-2 text-sm`}><span><b className="text-primary">{x.order_ref}</b> · {x.customer_name} · {formatINR(x.booking_amount)} · {x.qr_transaction_ref ? `UTR ${x.qr_transaction_ref}` : "No UTR given"} · {PAYMENT_STATUS_LABEL[x.payment_status]}</span><span className="flex gap-2"><Button size="sm" onClick={() => verify(x, true)}>Verify & mark paid</Button><Button size="sm" variant="destructive" onClick={() => verify(x, false)}>Reject</Button></span></div>)}
        {!pending.length && <p className="text-sm text-muted-foreground">Nothing to verify.</p>}
      </section>
      <section className="space-y-2"><h2 className="font-bold">Recent payment results</h2>
        {done.map((x) => <div key={x.id} className={`${card} flex flex-wrap items-center justify-between gap-2 text-sm`}><span><b>{x.order_ref}</b> · {PAYMENT_METHOD_LABEL[x.payment_method]} · {formatINR(x.paid_amount ?? x.booking_amount)} · {PAYMENT_STATUS_LABEL[x.payment_status]}{x.paid_at ? ` · ${formatDateTime(x.paid_at)}` : ""}</span>{x.payment_status === "paid" && <Button size="sm" variant="outline" onClick={() => refund(x)}>Mark refunded</Button>}</div>)}
      </section>
    </div>
  );
}

// ---------- settings forms (shared) ----------
function SettingsEditor({ fields, extra, title }: { fields: [keyof StoreSettings, string, ("text" | "area" | "number")?][]; extra?: (f: StoreSettings, set: (k: keyof StoreSettings, v: unknown) => void) => ReactNode; title?: string }) {
  const s = useSettings();
  if (!s.data || s.isFetching) return <p className="text-muted-foreground">Loading…</p>;
  return <SettingsInner key={s.data.updated_at} initial={s.data} fields={fields} extra={extra} title={title} />;
}
function SettingsInner({ initial, fields, extra, title }: { initial: StoreSettings; fields: [keyof StoreSettings, string, ("text" | "area" | "number")?][]; extra?: ((f: StoreSettings, set: (k: keyof StoreSettings, v: unknown) => void) => ReactNode) | undefined; title?: string | undefined }) {
  const refresh = useAll(); const [f, setF] = useState(initial); const [busy, setBusy] = useState(false);
  const set = (k: keyof StoreSettings, v: unknown) => setF((s) => ({ ...s, [k]: v }));
  async function save() {
    const patch: Record<string, unknown> = {};
    for (const [k] of fields) patch[k] = f[k] === "" ? null : f[k];
    for (const k of ["qr_image_url", "logo_url", "hero_image_url", "qr_payments_enabled", "online_payments_enabled"] as const) if (f[k] !== initial[k]) patch[k] = f[k];
    if ("whatsapp_number" in patch && patch["whatsapp_number"]) {
      const wa = String(patch["whatsapp_number"]).replace(/\D/g, "");
      if (!/^[0-9]{10,15}$/.test(wa)) return err(new Error("WhatsApp number: 10–15 digits incl. country code, e.g. 919876543210"));
      patch["whatsapp_number"] = wa.length === 10 ? `91${wa}` : wa;
    }
    if ("default_booking_amount" in patch) { const n = Number(patch["default_booking_amount"]); if (!(n >= 0)) return err(new Error("Enter a valid booking amount")); patch["default_booking_amount"] = n; }
    if ("store_name" in patch && !patch["store_name"]) return err(new Error("Store name is required"));
    setBusy(true); const { error } = await supabase.from("store_settings").update(patch as Partial<StoreSettings>).eq("id", 1); setBusy(false);
    if (error) return err(error); toast.success("Saved — live on the website"); refresh();
  }
  return (
    <div className={`${card} space-y-3`}>
      {title && <h2 className="font-bold">{title}</h2>}
      {fields.map(([k, label, type]) => <Field key={k} label={label}>{type === "area" ? <Textarea rows={k.startsWith("policy_") ? 12 : 3} value={(f[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} /> : <Input type={type === "number" ? "number" : "text"} value={String(f[k] ?? "")} onChange={(e) => set(k, e.target.value)} />}</Field>)}
      {extra?.(f, set)}
      <Button onClick={save} disabled={busy} className="w-full">{busy ? "Saving…" : "Save changes"}</Button>
    </div>
  );
}
function ImageSetting({ url, label, onChange }: { url: string | null; label: string; onChange: (u: string | null) => void }) {
  return <div className="space-y-2"><p className="text-sm font-medium">{label}</p>{url && <img src={url} alt="" className="max-h-40 rounded-lg border border-border object-contain" />}<div className="flex gap-2"><UploadButton label={url ? "Replace image" : "Upload image"} folder="store" onDone={(u) => onChange(u[0] ?? null)} />{url && <Button variant="outline" className="h-10" onClick={() => onChange(null)}>Remove</Button>}</div></div>;
}
function QrSettings() {
  return <SettingsEditor title="QR code & payment instructions" fields={[["upi_id", "UPI ID (shown under QR)"], ["payment_instructions", "Payment instructions", "area"], ["qr_promo_message", "Promotional message below QR", "area"], ["default_booking_amount", "Default booking amount (₹)", "number"]]}
    extra={(f, set) => <>
      <ImageSetting url={f.qr_image_url} label="Payment QR image" onChange={(u) => set("qr_image_url", u)} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.qr_payments_enabled} onChange={(e) => set("qr_payments_enabled", e.target.checked)} /> Accept UPI QR payments</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.online_payments_enabled} onChange={(e) => set("online_payments_enabled", e.target.checked)} /> Accept online payments (needs Razorpay keys)</label>
    </>} />;
}

// ---------- offers ----------
function Offers() {
  const o = useOffers(); const refresh = useAll();
  const [editing, setEditing] = useState<Partial<Offer> | null>(null);
  async function save() {
    if (!editing?.title || editing.title.trim().length < 2) return err(new Error("Offer title is required"));
    if (editing.link_url && !/^\/[A-Za-z0-9/_\-?=&]*$/.test(editing.link_url)) return err(new Error("Link must be a website path like /category/electronics"));
    const row = { title: editing.title.trim(), description: editing.description || null, badge: editing.badge || null, link_url: editing.link_url || null, image_url: editing.image_url || null, is_active: editing.is_active ?? true, sort_order: editing.sort_order ?? (o.data?.length ?? 0) + 1 };
    const { error } = editing.id ? await supabase.from("offers").update(row).eq("id", editing.id) : await supabase.from("offers").insert(row);
    if (error) return err(error); toast.success("Offer saved — live on homepage"); setEditing(null); refresh();
  }
  async function patch(id: string, v: Partial<Offer>) { const { error } = await supabase.from("offers").update(v).eq("id", id); if (error) return err(error); toast.success("Saved"); refresh(); }
  async function del(id: string) { if (!confirm("Delete this offer?")) return; const { error } = await supabase.from("offers").delete().eq("id", id); if (error) return err(error); toast.success("Offer deleted"); refresh(); }
  if (editing) return (
    <div className={`${card} space-y-3`}>
      <Field label="Title *"><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
      <Field label="Description / discount details"><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
      <Field label="Badge (e.g. 20% OFF)"><Input maxLength={30} value={editing.badge ?? ""} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} /></Field>
      <Field label="Link (optional, e.g. /category/electronics)"><Input value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} /></Field>
      <ImageSetting url={editing.image_url ?? null} label="Banner image (optional)" onChange={(u) => setEditing({ ...editing, image_url: u })} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active</label>
      <div className="flex gap-2"><Button onClick={save}>Save offer</Button><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div>
    </div>
  );
  return (
    <div className="space-y-3">
      <Button onClick={() => setEditing({ is_active: true })}>+ Add offer</Button>
      {(o.data ?? []).map((x) => <div key={x.id} className={`${card} flex flex-wrap items-center justify-between gap-2 text-sm`}><span><b>{x.title}</b>{x.badge ? ` · ${x.badge}` : ""} · <span className={x.is_active ? "text-success" : "text-muted-foreground"}>{x.is_active ? "Active" : "Inactive"}</span></span><span className="flex gap-1"><Button size="sm" onClick={() => setEditing(x)}>Edit</Button><Button size="sm" variant="outline" onClick={() => patch(x.id, { is_active: !x.is_active })}>{x.is_active ? "Deactivate" : "Activate"}</Button><Button size="sm" variant="destructive" onClick={() => del(x.id)}>Delete</Button></span></div>)}
    </div>
  );
}

// ---------- customers ----------
function Customers() {
  const o = useOrders(); const [q, setQ] = useState(""); const [open, setOpen] = useState<string | null>(null);
  const customers = useMemo(() => {
    const m = new Map<string, { phone: string; name: string; email: string | null; orders: Order[] }>();
    for (const x of o.data ?? []) { const c = m.get(x.customer_phone) ?? { phone: x.customer_phone, name: x.customer_name, email: x.customer_email, orders: [] }; c.orders.push(x); if (!c.email && x.customer_email) c.email = x.customer_email; m.set(x.customer_phone, c); }
    return [...m.values()];
  }, [o.data]);
  const list = customers.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3">
      <Input className="max-w-xs" placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.map((c) => (
        <div key={c.phone} className={`${card} space-y-2 text-sm`}>
          <button className="flex w-full flex-wrap justify-between gap-2 text-left" onClick={() => setOpen(open === c.phone ? null : c.phone)}><span><b>{c.name}</b> · {c.phone}{c.email ? ` · ${c.email}` : ""}</span><span className="text-primary">{c.orders.length} booking(s) · {formatINR(c.orders.filter((x) => x.payment_status === "paid").reduce((s, x) => s + Number(x.paid_amount ?? x.booking_amount), 0))} paid</span></button>
          {open === c.phone && c.orders.map((x) => <OrderLine key={x.id} o={x} />)}
        </div>
      ))}
      {!o.isLoading && !list.length && <p className="text-muted-foreground">No customers yet — customers appear after their first booking.</p>}
    </div>
  );
}

// ---------- enquiries ----------
function Enquiries() {
  const e = useEnquiries(); const s = useSettings(); const refresh = useAll();
  async function upd(id: string, v: { status?: EnquiryStatus; admin_notes?: string | null }) { const { error } = await supabase.from("enquiries").update(v).eq("id", id); if (error) return err(error); toast.success("Enquiry updated"); refresh(); }
  async function del(id: string) { if (!confirm("Delete this enquiry?")) return; const { error } = await supabase.from("enquiries").delete().eq("id", id); if (error) return err(error); refresh(); }
  return (
    <div className="space-y-3">
      {(e.data ?? []).map((x) => {
        const wa = buildWhatsAppUrl(x.phone, {});
        return (
          <div key={x.id} className={`${card} space-y-2 text-sm`}>
            <div className="flex flex-wrap justify-between gap-2"><b>{x.name} · <a className="text-primary" href={`tel:${x.phone}`}>{x.phone}</a>{x.email ? ` · ${x.email}` : ""}</b><span className="text-muted-foreground">{formatDateTime(x.created_at)}</span></div>
            {x.product_name && <p className="text-muted-foreground">Product: {x.product_name}{x.order_ref ? ` · ${x.order_ref}` : ""}</p>}
            <p className="whitespace-pre-line">{x.message}</p>
            <div className="flex flex-wrap gap-2">
              <select className={sel} value={x.status} onChange={(ev) => upd(x.id, { status: ev.target.value as EnquiryStatus })} aria-label="Enquiry status"><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select>
              {wa && s.data && <Button asChild size="sm" variant="whatsapp" className="h-10"><a href={wa} target="_blank" rel="noreferrer">Reply on WhatsApp</a></Button>}
              <Button size="sm" variant="destructive" className="h-10" onClick={() => del(x.id)}>Delete</Button>
            </div>
          </div>
        );
      })}
      {!e.isLoading && !e.data?.length && <p className="text-muted-foreground">No enquiries yet.</p>}
    </div>
  );
}

// ---------- design / whatsapp / policies / settings ----------
function Design() {
  const p = useProducts(); const refresh = useAll();
  async function feat(x: Product) { const { error } = await supabase.from("products").update({ is_featured: !x.is_featured }).eq("id", x.id); if (error) return err(error); toast.success("Homepage updated"); refresh(); }
  return (
    <div className="space-y-4">
      <SettingsEditor title="Homepage banner & content" fields={[["hero_title", "Homepage headline"], ["hero_subtitle", "Homepage sub-headline", "area"], ["tagline", "Tagline (footer)"], ["announcement", "Top announcement bar"]]}
        extra={(f, set) => <><ImageSetting url={f.logo_url} label="Logo" onChange={(u) => set("logo_url", u)} /><ImageSetting url={f.hero_image_url} label="Homepage banner image" onChange={(u) => set("hero_image_url", u)} /></>} />
      <div className={`${card} space-y-2`}><h2 className="font-bold">Featured products on homepage</h2>
        {(p.data ?? []).map((x) => <label key={x.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={x.is_featured} onChange={() => feat(x)} /> {x.name}{!x.is_active ? " (hidden)" : ""}</label>)}
      </div>
    </div>
  );
}
function WhatsApp() {
  return <SettingsEditor title="WhatsApp support" fields={[["whatsapp_number", "WhatsApp number with country code (e.g. 919876543210)"], ["whatsapp_message", "Greeting at start of customer messages (e.g. Hello KTL PRIVATE LIMITED,)", "area"]]} />;
}
function Policies() {
  return <SettingsEditor title="Leave a policy empty to show the default text" fields={[["policy_privacy", "Privacy policy", "area"], ["policy_terms", "Terms & conditions", "area"], ["policy_shipping", "Shipping policy", "area"], ["policy_refund", "Refund & return policy", "area"]]} />;
}
function SettingsSection() {
  return <SettingsEditor title="Store information" fields={[["store_name", "Store name"], ["support_phone", "Support phone"], ["support_email", "Support email"], ["address", "Address", "area"], ["business_hours", "Business hours"], ["default_booking_amount", "Default booking amount (₹)", "number"]]} />;
}

// ---------- security ----------
function Security() {
  const [f, setF] = useState({ current: "", next: "", confirm: "" }); const [busy, setBusy] = useState(false);
  async function change() {
    if (f.next.length < 8) return err(new Error("New password must be at least 8 characters"));
    if (f.next !== f.confirm) return err(new Error("New passwords do not match"));
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const email = u.user?.email;
    // Re-check the current password before changing it.
    const check = email ? await supabase.auth.signInWithPassword({ email, password: f.current }) : { error: new Error("Not signed in") };
    if (check.error) { setBusy(false); return err(new Error("Current password is incorrect")); }
    const { error } = await supabase.auth.updateUser({ password: f.next, current_password: f.current } as { password: string });
    setBusy(false);
    if (error) return err(error);
    toast.success("Password changed"); setF({ current: "", next: "", confirm: "" });
  }
  return (
    <div className={`${card} max-w-md space-y-3`}>
      <h2 className="font-bold">Change Master Admin password</h2>
      <Field label="Current password"><Input type="password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></Field>
      <Field label="New password"><Input type="password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></Field>
      <Field label="Confirm new password"><Input type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></Field>
      <Button onClick={change} disabled={busy} className="w-full">{busy ? "Updating…" : "Change password"}</Button>
      <p className="text-xs text-muted-foreground">Every admin action is checked by the database: only the Master Admin account can read customer data or change the store.</p>
    </div>
  );
}
