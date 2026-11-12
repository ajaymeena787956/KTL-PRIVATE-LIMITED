import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Razorpay webhook: Dashboard → Settings → Webhooks → URL https://<your-domain>/api/public/razorpay-webhook
// Events: payment.captured, payment.failed, order.paid. Secret must match RAZORPAY_WEBHOOK_SECRET.
export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
        if (!secret) return new Response("Webhook not configured", { status: 503 });

        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const raw = await request.text();
        if (!signature || !(await verifyWebhookSignature(raw, signature, secret))) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: { event?: string; payload?: { payment?: { entity?: Record<string, unknown> } } };
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const entity = event.payload?.payment?.entity;
        if (!entity || !["payment.captured", "payment.failed", "order.paid"].includes(event.event ?? "")) {
          return Response.json({ ignored: true });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { syncPaymentToOrder } = await import("@/lib/payment-sync.server");
        const result = await syncPaymentToOrder(supabaseAdmin, {
          id: String(entity["id"] ?? ""),
          order_id: (entity["order_id"] as string | null) ?? null,
          amount: Number(entity["amount"] ?? 0),
          currency: String(entity["currency"] ?? ""),
          status: String(entity["status"] ?? ""),
        });
        return Response.json({ received: true, ok: result.ok });
      },
    },
  },
});
