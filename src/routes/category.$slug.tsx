import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ProductGrid } from "@/components/site/ProductCard";
import { SiteLayout } from "@/components/site/SiteLayout";
import { productsQuery, siteQuery } from "@/lib/store.queries";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ context, params }) => {
    await Promise.all([context.queryClient.ensureQueryData(siteQuery()), context.queryClient.ensureQueryData(productsQuery({ category: params.slug }))]);
  },
  head: ({ params }) => ({ meta: [
    { title: `${params.slug.replace(/-/g, " ")} — KTL PRIVATE LIMITED` },
    { name: "description", content: `Shop ${params.slug.replace(/-/g, " ")} at KTL PRIVATE LIMITED.` },
    { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — KTL` },
    { property: "og:description", content: "Browse and book products online." },
  ] }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: site } = useSuspenseQuery(siteQuery());
  const { data } = useSuspenseQuery(productsQuery({ category: slug }));
  const subs = data.category ? site.categories.filter((c) => c.parent_id === data.category!.id) : [];
  return (
    <SiteLayout>
      <div className="container-page py-10">
        <h1 className="text-3xl font-bold">{data.category?.name ?? "Category not found"}</h1>
        {data.category?.description && <p className="mt-2 text-muted-foreground">{data.category.description}</p>}
        <div className="my-6 flex flex-wrap gap-2">
          {subs.map((s) => <Link key={s.id} to="/category/$slug" params={{ slug: s.slug }} className="rounded-full border border-border bg-card px-3 py-1 text-sm hover:border-primary hover:text-primary">{s.name}</Link>)}
        </div>
        {data.products.length ? <ProductGrid products={data.products} defaultBooking={Number(site.settings?.default_booking_amount ?? 0)} /> : <p className="text-muted-foreground">No products in this category yet.</p>}
      </div>
    </SiteLayout>
  );
}
