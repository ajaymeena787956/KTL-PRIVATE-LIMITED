import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "./SiteLayout";
import { siteQuery } from "@/lib/store.queries";
import type { StoreSettings } from "@/lib/types";

export function PolicyPage({ title, field, fallback }: { title: string; field: keyof StoreSettings; fallback: string }) {
  const { data } = useQuery(siteQuery());
  const text = (data?.settings?.[field] as string | null) || fallback;
  return <SiteLayout><article className="container-page max-w-3xl space-y-4 py-12"><h1 className="text-3xl font-bold">{title}</h1><div className="whitespace-pre-line leading-relaxed text-muted-foreground">{text}</div></article></SiteLayout>;
}
