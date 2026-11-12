import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function SearchBar({
  initial = "",
  className,
  size = "default",
}: {
  initial?: string;
  className?: string;
  size?: "default" | "lg";
}) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();
  return (
    <form
      role="search"
      className={cn("relative w-full", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim().slice(0, 80);
        navigate({ to: "/products", search: term ? { q: term } : {} });
      }}
    >
      <Search
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground",
          size === "lg" ? "size-5" : "size-4",
        )}
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        maxLength={80}
        placeholder="Search mobiles, laptops, sofas, printers…"
        aria-label="Search products"
        className={cn(
          "w-full rounded-xl border border-input bg-card pl-11 pr-24 text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20",
          size === "lg" ? "h-14 text-base" : "h-11 text-sm",
        )}
      />
      <button
        type="submit"
        className={cn(
          "absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition hover:bg-primary-deep",
          size === "lg" ? "h-11 text-sm" : "h-8 text-xs",
        )}
      >
        Search
      </button>
    </form>
  );
}
