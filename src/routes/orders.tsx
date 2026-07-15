import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatLKR } from "@/lib/data";

export const Route = createFileRoute("/orders")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: OrdersPage,
  head: () => ({ meta: [{ title: "Your orders — ShopCity LK" }] }),
});

const statusConfig: Record<string, { icon: any; cls: string; label: string }> = {
  pending: { icon: Clock, cls: "bg-gold/15 text-foreground border-gold/40", label: "Pending" },
  confirmed: { icon: Package, cls: "bg-blue-500/10 text-blue-600 border-blue-500/30", label: "Confirmed" },
  shipped: { icon: Truck, cls: "bg-blue-500/10 text-blue-600 border-blue-500/30", label: "Shipped" },
  delivered: { icon: CheckCircle2, cls: "bg-trust/10 text-trust border-trust/20", label: "Delivered" },
  returned: { icon: XCircle, cls: "bg-orange-500/10 text-orange-600 border-orange-500/30", label: "Returned" },
  cancelled: { icon: XCircle, cls: "bg-destructive/10 text-destructive border-destructive/20", label: "Cancelled" },
};

function OrdersPage() {
  const { user } = useAuth();

  const ordersQ = useQuery({
    queryKey: ["buyer-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(title, image_url, slug), shops(name, slug)")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (ordersQ.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-sm text-muted-foreground">
        Loading your orders…
      </div>
    );
  }

  const orders = ordersQ.data ?? [];

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cream">
          <Package className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">No orders yet</h1>
        <p className="mt-2 text-muted-foreground">Once you place an order, it'll show up here.</p>
        <Link
          to="/shops"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
        >
          Browse shops
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold md:text-5xl">Your orders</h1>
      <p className="mt-2 text-muted-foreground">
        {orders.length} {orders.length === 1 ? "order" : "orders"}
      </p>

      <div className="mt-8 space-y-3">
        {orders.map((o: any) => {
          const cfg = statusConfig[o.status] ?? statusConfig.pending;
          const Icon = cfg.icon;
          return (
            <div
              key={o.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              {o.products?.image_url ? (
                <img
                  src={o.products.image_url}
                  alt={o.products.title}
                  className="h-16 w-16 shrink-0 rounded-xl border object-cover"
                />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-xl bg-cream" />
              )}

              <div className="min-w-0 flex-1">
                <Link
                  to="/product/$slug"
                  params={{ slug: o.products?.slug ?? "" }}
                  className="block truncate font-semibold hover:underline"
                >
                  {o.products?.title ?? "Product"}
                </Link>
                <div className="text-xs text-muted-foreground">
                  Qty {o.quantity} · from{" "}
                  <Link to="/shop/$slug" params={{ slug: o.shops?.slug ?? "" }} className="hover:underline">
                    {o.shops?.name}
                  </Link>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.cls}`}>
                  <Icon className="h-3.5 w-3.5" /> {cfg.label}
                </span>
                <div className="font-display text-sm font-semibold">{formatLKR(Number(o.total))}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
