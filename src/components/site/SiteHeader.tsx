import { Link } from "@tanstack/react-router";
import { Headset, Menu, PackageSearch, Phone } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Category, StoreSettings } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { SearchBar } from "./SearchBar";

export function BrandMark({ inverted = false, logoUrl }: { inverted?: boolean; logoUrl?: string | null | undefined }) {
  return (
    <span className="flex items-center gap-2.5">
      <img src={logoUrl || "/icon-192.png"} alt="" width={36} height={36} className="size-9 rounded-lg object-contain" />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-lg font-bold tracking-tight ${inverted ? "text-navy-foreground" : "text-primary-deep"}`}>
          KTL
        </span>
        <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${inverted ? "text-navy-foreground/70" : "text-muted-foreground"}`}>
          Private Limited
        </span>
      </span>
    </span>
  );
}

export function SiteHeader({ settings, categories }: { settings: StoreSettings | null; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const top = categories.filter((c) => !c.parent_id);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      {settings?.announcement && (
        <div className="bg-navy text-navy-foreground">
          <div className="container-page flex h-8 items-center justify-between gap-4 text-xs">
            <p className="truncate">{settings.announcement}</p>
            {settings.support_phone && (
              <a href={`tel:${settings.support_phone}`} className="hidden shrink-0 items-center gap-1.5 sm:flex">
                <Phone className="size-3" /> {settings.support_phone}
              </a>
            )}
          </div>
        </div>
      )}

      <div className="container-page flex h-16 items-center gap-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="-ml-2 rounded-lg p-2 text-foreground hover:bg-accent lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto p-0">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle asChild>
                <div>
                  <BrandMark logoUrl={settings?.logo_url} />
                </div>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col p-2" onClick={() => setOpen(false)}>
              <Link to="/products" className="rounded-lg px-3 py-3 font-medium hover:bg-accent">
                All products
              </Link>
              {top.map((c) => (
                <Link
                  key={c.id}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 font-medium hover:bg-accent"
                >
                  <CategoryIcon slug={c.slug} className="size-4 text-primary" /> {c.name}
                </Link>
              ))}
              <div className="my-2 border-t border-border" />
              <Link to="/track" className="rounded-lg px-3 py-3 font-medium hover:bg-accent">
                Track booking
              </Link>
              <Link to="/support" className="rounded-lg px-3 py-3 font-medium hover:bg-accent">
                Customer support
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" aria-label="KTL PRIVATE LIMITED home">
          <BrandMark logoUrl={settings?.logo_url} />
        </Link>

        <SearchBar className="mx-auto hidden max-w-xl md:block" />

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          <Link
            to="/track"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            <PackageSearch className="size-4 text-primary" /> Track booking
          </Link>
          <Link
            to="/support"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            <Headset className="size-4 text-primary" /> Support
          </Link>
        </nav>
        <Link to="/support" className="ml-auto rounded-lg p-2 text-primary hover:bg-accent lg:hidden" aria-label="Support">
          <Headset className="size-5" />
        </Link>
      </div>

      <div className="container-page pb-3 md:hidden">
        <SearchBar />
      </div>

      <div className="hidden border-t border-border lg:block">
        <nav className="container-page flex h-11 items-center gap-1 overflow-x-auto text-sm">
          <Link
            to="/products"
            className="rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            activeProps={{ className: "bg-accent !text-accent-foreground" }}
          >
            All products
          </Link>
          {top.map((c) => (
            <Link
              key={c.id}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "bg-accent !text-accent-foreground" }}
            >
              <CategoryIcon slug={c.slug} className="size-4" /> {c.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
