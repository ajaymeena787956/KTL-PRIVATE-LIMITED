import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ProductGrid } from "@/components/site/ProductCard";
import { SiteLayout } from "@/components/site/SiteLayout";
import { productsQuery, siteQuery } from "@/lib/store.queries";

export const Route = createFileRoute("/products")({
  validateSearch: z.object({ q: z.string().max(80).optional() }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: async ({ context, deps }) => {
    await Promise.all([context.queryClient.ensureQueryData(siteQuery()), context.queryClient.ensureQueryData(productsQuery({ q: deps.q }))]);
  },
  head: () => ({ meta: [
    { title: "All Products — KTL PRIVATE LIMITED" },
    { name: "description", content: "Browse electronics, appliances, furniture and office equipment from KTL PRIVATE LIMITED." },
    { property: "og:title", content: "All Products — KTL PRIVATE LIMITED" },
    { property: "og:description", content: "Browse and book products online." },
  ] }),
  component: ProductsPage,
});

function ProductsPage() {
  const { q } = Route.useSearch();
  const { data: site } = useSuspenseQuery(siteQuery());
  const { data } = useSuspenseQuery(productsQuery({ q }));
  return (
    <SiteLayout>
      <div className="container-page py-10">
        <h1 className="mb-6 text-3xl font-bold">{q ? `Results for “${q}”` : "All products"}</h1>
        {data.products.length ? <ProductGrid products={data.products} defaultBooking={Number(site.settings?.default_booking_amount ?? 0)} /> : <p className="text-muted-foreground">No products found.</p>}
      </div>
    </SiteLayout>
  );
}
