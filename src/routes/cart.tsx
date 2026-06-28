import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart, updateQty, removeFromCart, clearCart } from "@/lib/cart";
import { findProduct, findShop, formatLKR } from "@/lib/data";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({ meta: [{ title: "Your cart — ShopCity LK" }] }),
});

function CartPage() {
  const items = useCart();
  const [method, setMethod] = useState("cod");

  const rows = items
    .map((i) => {
      const product = findProduct(i.productSlug);
      const shop = findShop(i.shopSlug);
      const offer = product?.offers.find((o) => o.shopSlug === i.shopSlug);
      if (!product || !shop || !offer) return null;
      return { ...i, product, shop, offer };
    })
    .filter(Boolean) as Array<{
    productSlug: string;
    shopSlug: string;
    qty: number;
    product: ReturnType<typeof findProduct> & object;
    shop: ReturnType<typeof findShop> & object;
    offer: { price: number; delivery: string; stock: number; shopSlug: string };
  }>;

  const subtotal = rows.reduce((acc, r) => acc + r.offer.price * r.qty, 0);
  const delivery = rows.length === 0 ? 0 : method === "pickup" ? 0 : 450;
  const total = subtotal + delivery;

  if (rows.length === 0) {
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
              <div
                className="grid h-20 w-20 shrink-0 place-items-center rounded-xl text-xs font-semibold uppercase tracking-wider"
                style={{
                  background: `oklch(0.92 0.06 ${(r.product as any).imageHue})`,
                  color: `oklch(0.4 0.13 ${(r.product as any).imageHue})`,
                }}
              >
                {(r.product as any).category}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{(r.product as any).title}</h3>
                <Link to="/shop/$slug" params={{ slug: r.shopSlug }} className="text-xs text-muted-foreground hover:underline">
                  sold by {(r.shop as any).name} · {(r.shop as any).city}
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
                    onClick={() => updateQty(r.productSlug, r.shopSlug, r.qty + 1)}
                    className="grid h-7 w-7 place-items-center rounded-full hover:bg-muted"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-semibold">{formatLKR(r.offer.price * r.qty)}</div>
                <div className="text-xs text-muted-foreground">{formatLKR(r.offer.price)} each</div>
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
            onClick={() => {
              toast.success("Order placed! Sellers have been notified.");
              clearCart();
            }}
            className="mt-5 w-full rounded-full bg-gold py-3 text-sm font-semibold text-gold-foreground transition hover:opacity-95"
          >
            Place order · {formatLKR(total)}
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
