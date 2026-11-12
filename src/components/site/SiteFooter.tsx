import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Category, StoreSettings } from "@/lib/types";
import { BrandMark } from "./SiteHeader";

export function SiteFooter({ settings, categories }: { settings: StoreSettings | null; categories: Category[] }) {
  const top = categories.filter((c) => !c.parent_id);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 bg-navy text-navy-foreground">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <BrandMark inverted logoUrl={settings?.logo_url} />
          <p className="text-sm text-navy-foreground/70">
            {settings?.tagline ?? "Electronics, appliances, furniture & office equipment you can trust."}
          </p>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Shop</h3>
          <ul className="space-y-2.5 text-sm text-navy-foreground/75">
            {top.map((c) => (
              <li key={c.id}>
                <Link to="/category/$slug" params={{ slug: c.slug }} className="hover:text-navy-foreground">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/products" className="hover:text-navy-foreground">
                All products
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Help</h3>
          <ul className="space-y-2.5 text-sm text-navy-foreground/75">
            <li><Link to="/support" className="hover:text-navy-foreground">Customer support</Link></li>
            <li><Link to="/track" className="hover:text-navy-foreground">Track your booking</Link></li>
            <li><Link to="/shipping-policy" className="hover:text-navy-foreground">Shipping policy</Link></li>
            <li><Link to="/refund-policy" className="hover:text-navy-foreground">Refund & return policy</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-navy-foreground">Privacy policy</Link></li>
            <li><Link to="/terms" className="hover:text-navy-foreground">Terms & conditions</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Contact</h3>
          <ul className="space-y-3 text-sm text-navy-foreground/75">
            {settings?.support_phone && (
              <li className="flex gap-2.5"><Phone className="mt-0.5 size-4 shrink-0" /><a href={`tel:${settings.support_phone}`}>{settings.support_phone}</a></li>
            )}
            {settings?.support_email && (
              <li className="flex gap-2.5"><Mail className="mt-0.5 size-4 shrink-0" /><a href={`mailto:${settings.support_email}`}>{settings.support_email}</a></li>
            )}
            {settings?.address && (
              <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0" /><span className="whitespace-pre-line">{settings.address}</span></li>
            )}
            {settings?.business_hours && (
              <li className="flex gap-2.5"><Clock className="mt-0.5 size-4 shrink-0" />{settings.business_hours}</li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-navy-foreground/60 sm:flex-row">
          <p>© {year} {settings?.store_name ?? "KTL PRIVATE LIMITED"}. All rights reserved.</p>
          <Link to="/admin" className="hover:text-navy-foreground">Admin login</Link>
        </div>
      </div>
    </footer>
  );
}
