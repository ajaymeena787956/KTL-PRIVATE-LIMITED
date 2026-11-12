import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { effectiveBookingAmount } from "@/lib/booking";
import { discountPercent, formatINR } from "@/lib/format";
import type { ProductWithCategory } from "@/lib/types";

export function ProductImage({ src, alt, className }: { src?: string | null | undefined; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className ?? ""}`}>
        <Package className="size-10" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={`object-contain ${className ?? ""}`} />;
}

export function ProductCard({ product, defaultBooking }: { product: ProductWithCategory; defaultBooking?: number | null | undefined }) {
  const price = Number(product.price);
  const mrp = product.mrp != null ? Number(product.mrp) : null;
  const off = discountPercent(price, mrp);
  const booking = effectiveBookingAmount(price, product.booking_amount != null ? Number(product.booking_amount) : null, defaultBooking);
  const outOfStock = product.stock_quantity <= 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="relative block aspect-square bg-card p-4">
        <ProductImage src={product.images[0]} alt={product.name} className="h-full w-full transition duration-300 group-hover:scale-[1.03]" />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {off && (
            <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">{off}% OFF</span>
          )}
          {outOfStock && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Out of stock</span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 border-t border-border p-4">
        {product.category && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">{product.category.name}</span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-base">
          <Link to="/product/$slug" params={{ slug: product.slug }}>{product.name}</Link>
        </h3>
        {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          <span className="font-display text-lg font-bold text-foreground">{formatINR(price)}</span>
          {off && mrp && <span className="text-xs text-muted-foreground line-through">{formatINR(mrp)}</span>}
        </div>
        {booking > 0 && <p className="text-xs text-muted-foreground">Book for just <span className="font-semibold text-primary">{formatINR(booking)}</span></p>}
        <div className="mt-2 grid gap-2 lg:grid-cols-2">
          <Button asChild size="sm" className="h-9">
            <Link to="/product/$slug" params={{ slug: product.slug }}>View Product</Link>
          </Button>
          <Button asChild size="sm" variant="soft" className="h-9" disabled={outOfStock}>
            <Link to="/product/$slug" params={{ slug: product.slug }} hash="book">Book Now</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, defaultBooking }: { products: ProductWithCategory[]; defaultBooking?: number | null | undefined }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} defaultBooking={defaultBooking} />
      ))}
    </div>
  );
}
