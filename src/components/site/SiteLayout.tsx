import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/booking";
import { siteQuery } from "@/lib/store.queries";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function SiteLayout({ children, hideFloatingWhatsApp = false }: { children: ReactNode; hideFloatingWhatsApp?: boolean }) {
  const { data } = useQuery(siteQuery());
  const settings = data?.settings ?? null;
  const categories = data?.categories ?? [];
  const wa = buildWhatsAppUrl(settings?.whatsapp_number, { greeting: settings?.whatsapp_message });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader settings={settings} categories={categories} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} categories={categories} />
      {wa && !hideFloatingWhatsApp && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-elevated transition hover:scale-105"
        >
          <MessageCircle className="size-6" />
        </a>
      )}
    </div>
  );
}
