import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart, updateQty, removeFromCart, clearCart } from "@/lib/cart";
import { formatLKR } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({ meta: [{ title: "Your cart — ShopCity LK" }] }),
});

function CartPage() {
  const items = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);

  const slugs = items.map((i) => i.productSlug);

  const productsQ = useQuery({
    queryKey: ["cart-products", slugs.join(",")],
    enabled: slugs.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, shops(*)")
        .in("slug", slugs);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = items
    .map((i) => {
      const product = (productsQ.data ?? []).find(
        (p: any) => p.slug === i.productSlug && p.shops?.slug === i.shopSlug,
      );
      if (!product || !product.shops) return null;
      return { ...i, product, shop: product.shops };
    })
    .filter(Boolean) as Array<{
    productSlug: string;
    shopSlug: string;
    qty: number;
    product: any;
    shop: any;
  }>;

  const subtotal = rows.reduce((acc, r) => acc + Number(r.product.price) * r.qty, 0);
  const delivery = rows.length === 0 ? 0 : method === "pickup" ? 0 : 450;
  const total = subtotal + delivery;

  const placeOrder = async () => {
    if (!user) {
      toast.error("Please login to place an order");
      navigate({ to: "/login" });
      return;
    }

    if (rows.length === 0) return;

    setPlacing(true);
    try {
      const items = rows.map((r) => ({
        product_id: r.product.id,
        shop_id: r.shop.id,
        quantity: r.qty,
        unit_price: Number(r.product.price),
      }));

      const { error } = await supabase.rpc("place_order", {
        p_customer_id: user.id,
        p_items: items,
        p_delivery_method: method === "pickup" ? "pickup" : "delivery",
        p_payment_method: method,
      });

      if (error) {
        // The function raises a clear message like: Only 3 left in stock for "..."
        toast.error(error.message);
        setPlacing(false);
        return;
      }

      toast.success("Order placed! Sellers have been notified.");
      clearCart();
      navigate({ to: "/orders" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cream">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Discover shops, compare prices, and pick the best deal.</p>
        <Link
          to="/compare"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
        >
          Start comparing
        </Link>
      </div>
    );
  }

  if (productsQ.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center text-sm text-muted-foreground">
        Loading your cart…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold md:text-5xl">Your cart</h1>
      <p className="mt-2 text-muted-foreground">
        {rows.length} {rows.length === 1 ? "item" : "items"} from {new Set(rows.map((r) => r.shopSlug)).size}{" "}
        shop(s)
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.productSlug + r.shopSlug}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              {r.product.image_url ? (
                <img
                  src={r.product.image_url}
                  alt={r.product.title}
                  className="h-20 w-20 shrink-0 rounded-xl border object-cover"
                />
              ) : (
                <div
                  className="grid h-20 w-20 shrink-0 place-items-center rounded-xl text-xs font-semibold uppercase tracking-wider"
                  style={{
                    background: `oklch(0.92 0.06 ${r.product.image_hue ?? 200})`,
                    color: `oklch(0.4 0.13 ${r.product.image_hue ?? 200})`,
                  }}
                >
                  {r.product.category}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{r.product.title}</h3>
                <Link to="/shop/$slug" params={{ slug: r.shopSlug }} className="text-xs text-muted-foreground hover:underline">
                  sold by {r.shop.name} · {r.shop.city}
                </Link>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-background p-1">
                  <button
                    onClick={() => updateQty(r.productSlug, r.shopSlug, r.qty - 1)}
                    className="grid h-7 w-7 place-items-center rounded-full hover:bg-muted"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-6 text-center text-sm font-medium">{r.qty}</span>
                  <button
                    onClick={() => {
                      if (r.qty >= r.product.stock) {
                        toast.error(`Only ${r.product.stock} in stock`);
                        return;
                      }
                      updateQty(r.productSlug, r.shopSlug, r.qty + 1);
                    }}
                    disabled={r.qty >= r.product.stock}
                    className="grid h-7 w-7 place-items-center rounded-full hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {r.product.stock} in stock
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-semibold">
                  {formatLKR(Number(r.product.price) * r.qty)}
                </div>
                <div className="text-xs text-muted-foreground">{formatLKR(Number(r.product.price))} each</div>
                <button
                  onClick={() => removeFromCart(r.productSlug, r.shopSlug)}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            </div>
          ))}
          <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-destructive">
            Clear cart
          </button>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-xl font-semibold">Order summary</h3>

          <div className="mt-4 space-y-2 text-sm">
            <Row k="Subtotal" v={formatLKR(subtotal)} />
            <Row k="Delivery" v={method === "pickup" ? "Free pickup" : formatLKR(delivery)} />
            <div className="my-3 h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="font-display text-2xl font-semibold">{formatLKR(total)}</span>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              {[
                { id: "cod", label: "Cash on delivery" },
                { id: "card", label: "Card payment" },
                { id: "bank", label: "Bank transfer" },
                { id: "pickup", label: "Pickup from store" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                    method === m.id ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground/30"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={placeOrder}
            disabled={placing || rows.length === 0}
            className="mt-5 w-full rounded-full bg-gold py-3 text-sm font-semibold text-gold-foreground transition hover:opacity-95 disabled:opacity-50"
          >
            {placing ? "Placing order..." : `Place order · ${formatLKR(total)}`}
          </button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            By placing your order you agree to ShopCity LK's buyer protection terms.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span>{v}</span>
    </div>
  );
}
