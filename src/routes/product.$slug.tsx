import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductImage } from "@/components/site/ProductCard";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppUrl, effectiveBookingAmount, isValidIndianMobile } from "@/lib/booking";
import { formatINR } from "@/lib/format";
import { loadRazorpay } from "@/lib/load-razorpay";
import { createRazorpayOrder, getPaymentConfig, verifyRazorpayPayment } from "@/lib/payments.functions";
import { productQuery, siteQuery } from "@/lib/store.queries";
import { parseSpecs } from "@/lib/types";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const [, d, pay] = await Promise.all([context.queryClient.ensureQueryData(siteQuery()), context.queryClient.ensureQueryData(productQuery(params.slug)), getPaymentConfig()]);
    if (!d.product) throw notFound();
    return { pay, product: d.product, name: d.product.name, desc: d.product.short_description ?? "" };
  },
  head: ({ loaderData, params }) => {
    const product = loaderData?.product;
    const productUrl = `https://ktl-private-limited.onrender.com/product/${params.slug}`;
    const imageUrl = product?.images?.[0] ?? "";
    return {
      links: [{ rel: "canonical", href: productUrl }],
      meta: [
        { title: `${loaderData?.name ?? "Product"} — KTL PRIVATE LIMITED` },
        { name: "description", content: loaderData?.desc ?? "Product details" },
        { property: "og:type", content: "product" },
        { property: "og:title", content: loaderData?.name ?? "Product" },
        { property: "og:description", content: loaderData?.desc ?? "Product details" },
        { property: "og:url", content: productUrl },
        ...(imageUrl ? [{ property: "og:image", content: imageUrl }, { property: "og:image:alt", content: loaderData?.name ?? "Product" }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: loaderData?.name ?? "Product" },
        { name: "twitter:description", content: loaderData?.desc ?? "Product details" },
        ...(imageUrl ? [{ name: "twitter:image", content: imageUrl }] : []),
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { pay } = Route.useLoaderData();
  const { data: site } = useSuspenseQuery(siteQuery());
  const { data } = useSuspenseQuery(productQuery(slug));
  const p = data.product!;
  const s = site.settings;
  const [img, setImg] = useState(0);
  const [method, setMethod] = useState<"qr" | "razorpay">("qr");
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false); const [ref, setRef] = useState<string | null>(null);
  const price = Number(p.price);
  const productUrl = `https://ktl-private-limited.onrender.com/product/${p.slug}`;
  const shareText = `${p.name}\nPrice: ${formatINR(price)}\n${productUrl}`;
  const booking = effectiveBookingAmount(price, p.booking_amount != null ? Number(p.booking_amount) : null, s ? Number(s.default_booking_amount) : 0);
  const onlineOk = pay.razorpayEnabled && s?.online_payments_enabled;
  const wa = buildWhatsAppUrl(s?.whatsapp_number, { greeting: s?.whatsapp_message, productName: p.name, price, bookingAmount: booking, orderRef: ref ?? undefined });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) { toast.error("Please enter your name."); return; }
    if (!isValidIndianMobile(phone)) { toast.error("Enter a valid 10-digit mobile number."); return; }
    setBusy(true);
    try {
      const { data: r, error } = await supabase.rpc("create_booking", { _product_id: p.id, _customer_name: name, _customer_phone: phone, _payment_method: method, ...(utr ? { _qr_transaction_ref: utr } : {}) });
      if (error) throw new Error(error.message);
      const orderRef = (r as { order_ref: string }).order_ref;
      if (method === "qr") { setRef(orderRef); toast.success("Booking submitted!"); return; }
      const o = await createRazorpayOrder({ data: { orderRef, phone } });
      if (!(await loadRazorpay()) || !window.Razorpay) throw new Error("Could not load payment window.");
      const rz = new window.Razorpay({ key: o.keyId, order_id: o.razorpayOrderId, amount: o.amount, currency: "INR", name: "KTL PRIVATE LIMITED", description: o.productName, prefill: { name: o.customerName, contact: o.customerPhone },
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try { const v = await verifyRazorpayPayment({ data: resp }); setRef(orderRef); toast.success(v.status === "paid" ? "Payment verified!" : "Payment processing — we'll confirm shortly."); }
          catch (err) { toast.error((err as Error).message); }
        } });
      rz.on("payment.failed", () => toast.error("Payment failed. You can retry from Track booking."));
      rz.open();
      setRef(orderRef);
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <SiteLayout>
      <div className="container-page grid gap-10 py-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square rounded-2xl border border-border bg-card p-6"><ProductImage src={p.images[img]} alt={p.name} className="h-full w-full" /></div>
          <div className="mt-3 flex gap-2">{p.images.map((u, i) => <button key={u} onClick={() => setImg(i)} className={`size-16 rounded-lg border bg-card p-1 ${i === img ? "border-primary" : "border-border"}`}><img src={u} alt="" className="h-full w-full object-contain" /></button>)}</div>
        </div>
        <div className="space-y-5">
          {p.category && <p className="text-xs font-semibold uppercase tracking-wider text-primary">{p.category.name}</p>}
          <h1 className="text-3xl font-bold">{p.name}</h1>
          <p className="font-display text-3xl font-bold">{formatINR(price)} {p.mrp && <span className="text-base text-muted-foreground line-through">{formatINR(Number(p.mrp))}</span>}</p>
          <p className="text-muted-foreground">{p.short_description}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="whatsapp">
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
                <Share2 className="mr-2 size-4" /> Share on WhatsApp
              </a>
            </Button>
            <Button type="button" variant="outline" onClick={async () => {
              try {
                await navigator.clipboard.writeText(productUrl);
                toast.success("Product link copied!");
              } catch {
                toast.error("Could not copy link. Please copy the URL from your browser.");
              }
            }}>
              <Copy className="mr-2 size-4" /> Copy Link
            </Button>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {[["Brand", p.brand], ["Model", p.model], ["Quality", p.quality], ["Warranty", p.warranty], ["Stock", p.stock_quantity > 0 ? `${p.stock_quantity} available` : "Out of stock"]].filter(([, v]) => v).map(([k, v]) => <div key={k} className="rounded-lg bg-secondary p-2"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
          </dl>
          <div id="book" className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex justify-between"><span>Booking amount</span><b className="text-primary">{formatINR(booking)}</b></div>
            {ref ? (
              <div className="space-y-3 rounded-xl bg-primary-soft p-4"><p className="font-semibold">Your order reference</p><p className="font-display text-2xl font-bold text-primary">{ref}</p><p className="text-sm text-muted-foreground">Save this to track your booking.</p></div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant={method === "qr" ? "default" : "outline"} onClick={() => setMethod("qr")}>UPI QR</Button>
                  <Button type="button" variant={method === "razorpay" ? "default" : "outline"} disabled={!onlineOk} onClick={() => setMethod("razorpay")}>Pay online</Button>
                </div>
                {method === "qr" && (
                  <div className="space-y-2 text-center">
                    {s?.qr_image_url ? <img src={s.qr_image_url} alt="Payment QR code" className="mx-auto size-56 rounded-lg border border-border object-contain" /> : <p className="rounded-lg bg-muted p-6 text-sm text-muted-foreground">Payment QR will be available soon.</p>}
                    {s?.upi_id && <p className="text-sm font-semibold">UPI ID: {s.upi_id}</p>}{s?.payment_instructions && <p className="whitespace-pre-line text-sm">{s.payment_instructions}</p>}{s?.qr_promo_message && <p className="text-sm text-muted-foreground">{s.qr_promo_message}</p>}
                    <Input placeholder="UPI transaction / UTR reference (optional)" value={utr} onChange={(e) => setUtr(e.target.value)} maxLength={30} />
                  </div>
                )}
                <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
                <Input placeholder="Mobile number" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} />
                <Button type="submit" className="w-full" size="lg" disabled={busy || p.stock_quantity <= 0}>{busy ? "Please wait…" : method === "qr" ? "Book Now" : `Pay ${formatINR(booking)} securely`}</Button>
              </form>
            )}
            {wa && <Button asChild variant="whatsapp" className="w-full"><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp support</a></Button>}
          </div>
          {p.description && <div><h2 className="mb-2 text-xl font-bold">Description</h2><p className="whitespace-pre-line text-muted-foreground">{p.description}</p></div>}
          {parseSpecs(p.specifications).length > 0 && <table className="w-full text-sm"><tbody>{parseSpecs(p.specifications).map((x) => <tr key={x.label} className="border-b border-border"><td className="py-2 text-muted-foreground">{x.label}</td><td className="py-2 font-medium">{x.value}</td></tr>)}</tbody></table>}
        </div>
      </div>
    </SiteLayout>
  );
}
