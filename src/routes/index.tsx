import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, CreditCard, Headset, MessageCircle, ShieldCheck, Tag, Truck } from "lucide-react";
import heroImg from "@/assets/hero-showroom.jpg";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { ProductGrid } from "@/components/site/ProductCard";
import { SearchBar } from "@/components/site/SearchBar";
import { SiteLayout } from "@/components/site/SiteLayout";
import { buildWhatsAppUrl } from "@/lib/booking";
import { homeQuery, siteQuery } from "@/lib/store.queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KTL PRIVATE LIMITED — Electronics, Appliances, Furniture & Office Equipment" },
      {
        name: "description",
        content:
          "Shop mobiles, laptops, TVs, refrigerators, ACs, sofas, office chairs, printers and more from KTL PRIVATE LIMITED. Book with a small amount online.",
      },
      { property: "og:title", content: "KTL PRIVATE LIMITED — Shop & Book Online" },
      {
        property: "og:description",
        content: "Electronics, home appliances, furniture and office equipment. Book any product with a small booking amount.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteQuery()),
      context.queryClient.ensureQueryData(homeQuery()),
    ]);
  },
  component: Home,
});

const TRUST = [
  { icon: BadgeCheck, title: "Genuine products", text: "Brand-new stock with manufacturer warranty" },
  { icon: CreditCard, title: "Small booking amount", text: "Reserve now, pay the balance on delivery" },
  { icon: Truck, title: "Reliable delivery", text: "Careful delivery and installation support" },
  { icon: ShieldCheck, title: "Secure payments", text: "UPI QR and verified online payments" },
];

function Home() {
  const { data: site } = useSuspenseQuery(siteQuery());
  const { data: home } = useSuspenseQuery(homeQuery());
  const settings = site.settings;
  const top = site.categories.filter((c) => !c.parent_id);
  const subsOf = (id: string) => site.categories.filter((c) => c.parent_id === id);
  const wa = buildWhatsAppUrl(settings?.whatsapp_number, { greeting: settings?.whatsapp_message });
  const defaultBooking = settings ? Number(settings.default_booking_amount) : null;

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero text-primary-foreground">
        <div className="container-page grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div className="relative z-10 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="size-3.5" /> Trusted by homes & offices
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              {settings?.hero_title || "Everything for your home & office, in one place."}
            </h1>
            <p className="max-w-xl text-base text-primary-foreground/85 sm:text-lg">
              {settings?.hero_subtitle || settings?.tagline || "Electronics, home appliances, furniture and office equipment from KTL PRIVATE LIMITED."}
            </p>
            <SearchBar size="lg" className="max-w-xl" />
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/products">
                  Shop all products <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="heroOutline" size="lg">
                <Link to="/support">
                  <Headset /> Talk to us
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-primary-foreground/20 shadow-elevated">
              <img
                src={settings?.hero_image_url || heroImg}
                alt="Laptop, smartphone, smart TV, refrigerator and office chair in a bright showroom"
                width={1600}
                height={1008}
                className="aspect-[16/10] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-card">
        <div className="container-page grid grid-cols-2 gap-4 py-6 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <t.icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-14">
        <SectionHeading eyebrow="Browse" title="Shop by category" link={{ to: "/products", label: "View all" }} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {top.map((c) => (
            <div key={c.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card">
              <Link to="/category/$slug" params={{ slug: c.slug }} className="group flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-xl bg-hero text-primary-foreground">
                  <CategoryIcon slug={c.slug} className="size-6" />
                </span>
                <span className="font-display text-lg font-semibold text-foreground group-hover:text-primary">{c.name}</span>
              </Link>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {subsOf(c.id).map((s) => (
                  <Link
                    key={s.id}
                    to="/category/$slug"
                    params={{ slug: s.slug }}
                    className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground hover:border-primary hover:text-primary"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Offers */}
      {home.offers.length > 0 && (
        <section className="bg-soft py-14">
          <div className="container-page">
            <SectionHeading eyebrow="Offers" title="Current offers" />
            <div className="grid gap-4 md:grid-cols-3">
              {home.offers.map((o, i) => (
                <div
                  key={o.id}
                  className={`relative overflow-hidden rounded-2xl p-6 shadow-card ${i === 0 ? "bg-hero text-primary-foreground" : "border border-border bg-card"}`}
                >
                  {o.image_url && <img src={o.image_url} alt="" className="mb-4 aspect-[16/7] w-full rounded-xl object-cover" />}
                  {o.badge && (
                    <span className={`mb-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${i === 0 ? "bg-primary-foreground/20" : "bg-primary-soft text-primary"}`}>
                      <Tag className="size-3" /> {o.badge}
                    </span>
                  )}
                  <h3 className="text-xl font-bold">{o.title}</h3>
                  {o.description && (
                    <p className={`mt-2 text-sm ${i === 0 ? "text-primary-foreground/85" : "text-muted-foreground"}`}>{o.description}</p>
                  )}
                  {o.link_url && /^\/[A-Za-z0-9/_\-?=&]*$/.test(o.link_url) && (
                    <a href={o.link_url} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">
                      Explore <ArrowRight className="size-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured */}
      {home.featured.length > 0 && (
        <section className="container-page py-14">
          <SectionHeading eyebrow="Handpicked" title="Featured products" link={{ to: "/products", label: "Shop all" }} />
          <ProductGrid products={home.featured} defaultBooking={defaultBooking} />
        </section>
      )}

      {/* Support */}
      <section className="container-page">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-navy p-8 text-navy-foreground md:grid-cols-[1.4fr_1fr] md:p-12">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-navy-foreground/60">Customer support</p>
            <h2 className="text-3xl font-bold">Need help choosing the right product?</h2>
            <p className="text-navy-foreground/75">
              Our team will help you with product details, bulk office orders, delivery and booking questions.
              {settings?.business_hours ? ` We're available ${settings.business_hours}.` : ""}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            {wa && (
              <Button asChild variant="whatsapp" size="lg">
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <MessageCircle /> Chat on WhatsApp
                </a>
              </Button>
            )}
            <Button asChild variant="hero" size="lg">
              <Link to="/support">
                <Headset /> Send an enquiry
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function SectionHeading({
  eyebrow,
  title,
  link,
}: {
  eyebrow: string;
  title: string;
  link?: { to: "/products"; label: string };
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
      </div>
      {link && (
        <Link to={link.to} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
          {link.label} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
