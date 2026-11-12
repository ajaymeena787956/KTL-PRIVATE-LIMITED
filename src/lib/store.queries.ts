import { queryOptions } from "@tanstack/react-query";
import { getHomeData, getProduct, getSiteData, listProducts } from "./store.functions";

export const siteQuery = () =>
  queryOptions({ queryKey: ["site"], queryFn: () => getSiteData(), staleTime: 30_000 });

export const homeQuery = () =>
  queryOptions({ queryKey: ["home"], queryFn: () => getHomeData(), staleTime: 30_000 });

export const productsQuery = (params: { q?: string | undefined; category?: string | undefined }) =>
  queryOptions({
    queryKey: ["products", params.q ?? "", params.category ?? ""],
    queryFn: () => listProducts({ data: params }),
    staleTime: 30_000,
  });

export const productQuery = (slug: string) =>
  queryOptions({ queryKey: ["product", slug], queryFn: () => getProduct({ data: { slug } }), staleTime: 15_000 });
