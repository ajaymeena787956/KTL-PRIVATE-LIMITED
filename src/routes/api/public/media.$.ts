import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Serves product photos and the payment QR image from private storage.
// Only files inside the "media" bucket under known folders can be read; only images are served inline.
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? "";
        if (!/^(products|store|categories)\/[A-Za-z0-9_\-./]{1,200}$/.test(path) || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("media").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        const type = ALLOWED_TYPES.has(data.type) ? data.type : "application/octet-stream";
        return new Response(data, {
          headers: {
            "Content-Type": type,
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'none'",
          },
        });
      },
    },
  },
});
