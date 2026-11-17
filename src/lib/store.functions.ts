import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { Category, Offer, ProductWithCategory, StoreSettings } from "./types";

// Public, read-only store data. Uses the publishable key so RLS applies (only active rows are visible).
function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Store backend is not configured.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const PRODUCT_SELECT = "*, category:categories(id, name, slug, parent_id)";

function visibleProducts(products: ProductWithCategory[], activeCategoryIds: Set<string>) {
  return products.filter((p) => !p.category_id || activeCategoryIds.has(p.category_id));
}

async function loadCategories(sb: ReturnType<typeof publicClient>): Promise<Category[]> {
  const { data, error } = await sb
    .from("categories")
    .select("*")
    .order("sort_order")
    .order("name");
  if (error) throw new Error(error.message);

  const all = data ?? [];
  const activeIds = new Set(all.filter((c) => c.is_active).map((c) => c.id));
  return all.filter((c) => {
    if (!c.is_active) return false;
    return !c.parent_id || activeIds.has(c.parent_id);
  });
}

async function loadSettings(sb: ReturnType<typeof publicClient>): Promise<StoreSettings | null> {
  const { data, error } = await sb.from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export const getSiteData = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [settings, categories] = await Promise.all([loadSettings(sb), loadCategories(sb)]);
  return { settings, categories };
});

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [categories, offersRes, featuredRes, latestRes] = await Promise.all([
    loadCategories(sb),
    sb.from("offers").select("*").eq("is_active", true).order("sort_order"),
    sb
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("updated_at", { ascending: false })
      .limit(12),
    sb
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  for (const r of [offersRes, featuredRes, latestRes]) if (r.error) throw new Error(r.error.message);
  const ids = new Set(categories.map((c) => c.id));
  return {
    offers: (offersRes.data ?? []) as Offer[],
    featured: visibleProducts((featuredRes.data ?? []) as ProductWithCategory[], ids),
    latest: visibleProducts((latestRes.data ?? []) as ProductWithCategory[], ids),
  };
});

const listSchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/)
    .optional(),
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input: z.input<typeof listSchema>) => listSchema.parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const categories = await loadCategories(sb);
    const activeIds = new Set(categories.map((c) => c.id));

    let category: Category | null = null;
    let query = sb.from("products").select(PRODUCT_SELECT).eq("is_active", true);

    if (data.category) {
      category = categories.find((c) => c.slug === data.category) ?? null;
      if (!category) return { category: null, products: [] as ProductWithCategory[], notFound: true };
      const ids = [category.id, ...categories.filter((c) => c.parent_id === category!.id).map((c) => c.id)];
      query = query.in("category_id", ids);
    }

    // Strip characters with special meaning in filter syntax before using the search text.
    const q = (data.q ?? "").replace(/[%,()*\\:."']/g, " ").trim();
    if (q) {
      const like = `%${q}%`;
      query = query.or(`name.ilike.${like},brand.ilike.${like},model.ilike.${like},short_description.ilike.${like}`);
    }

    const { data: rows, error } = await query.order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(60);
    if (error) throw new Error(error.message);
    return { category, products: visibleProducts((rows ?? []) as ProductWithCategory[], activeIds), notFound: false };
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) =>
    z.object({ slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/) }).parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const categories = await loadCategories(sb);
    const activeIds = new Set(categories.map((c) => c.id));
    const { data: product, error } = await sb
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const p = product as ProductWithCategory | null;
    if (!p || (p.category_id && !activeIds.has(p.category_id))) return { product: null, related: [] };

    let related: ProductWithCategory[] = [];
    if (p.category_id) {
      const { data: rel } = await sb
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .eq("category_id", p.category_id)
        .neq("id", p.id)
        .limit(4);
      related = (rel ?? []) as ProductWithCategory[];
    }
    const parent = p.category?.parent_id ? (categories.find((c) => c.id === p.category!.parent_id) ?? null) : null;
    return { product: p, related, parentCategory: parent };
  });
