import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export type Category = Tables["categories"]["Row"];
export type Product = Tables["products"]["Row"];
export type StoreSettings = Tables["store_settings"]["Row"];
export type Offer = Tables["offers"]["Row"];
export type Order = Tables["orders"]["Row"];
export type Enquiry = Tables["enquiries"]["Row"];

export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type EnquiryStatus = Database["public"]["Enums"]["enquiry_status"];

export interface Spec {
  label: string;
  value: string;
}

export type ProductWithCategory = Product & {
  category: Pick<Category, "id" | "name" | "slug" | "parent_id"> | null;
};

export function parseSpecs(value: unknown): Spec[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (s): s is Spec =>
        !!s && typeof s === "object" && typeof (s as Spec).label === "string" && typeof (s as Spec).value === "string",
    )
    .map((s) => ({ label: s.label, value: s.value }));
}
