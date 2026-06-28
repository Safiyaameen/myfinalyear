import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ShoppingBag, Scale, MapPin, Star } from "lucide-react";
import { findProduct, findShop, formatLKR } from "@/lib/data";
import { ProductThumb } from "@/components/site/ProductThumb";
import { TrustBadge } from "@/components/site/TrustBadge";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const p = findProduct(params.slug);
    if (!p) throw notFound();
    return p;
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold">Product not found</h1>
      <Link to="/" className="mt-6 inline-block text-sm underline">Back home</Link>
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Product"} — ShopCity LK` },
      { name: "description", content: loaderData?.description ?? "" },
    ],
  }),
});

function ProductPage() {
  const p = Route.useLoaderData();
  const sorted = [...p.offers].sort((a, b) => a.price - b.price);
  const cheapest = sorted[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link to="/compare" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to comparison
      </Link>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <ProductThumb hue={p.imageHue} label={p.category} className="aspect-square w-full rounded-3xl" />
        <div>
          <p className="text-xs uppercase tracking-wider text-gold">{p.category}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">{p.title}</h1>
          <p className="mt-3 text-muted-foreground">{p.description}</p>

          <div className="mt-6 rounded-2xl border border-gold/40 bg-gold/5 p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Cheapest right now</p>
            <div className="mt-1 flex items-end justify-between gap-4">
              <div className="font-display text-4xl font-semibold">{formatLKR(cheapest.price)}</div>
              <div className="text-right text-sm text-muted-foreground">
                from <span className="font-medium text-foreground">{findShop(cheapest.shopSlug)?.name}</span>
                <br />
                {cheapest.delivery}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  addToCart(p.slug, cheapest.shopSlug);
                  toast.success("Added to cart");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
              >
                <ShoppingBag className="h-4 w-4" /> Add to cart
              </button>
              <Link
                to="/compare"
                search={{ q: p.title }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium"
              >
                <Scale className="h-4 w-4" /> Compare all shops
              </Link>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Available at {sorted.length} {sorted.length === 1 ? "shop" : "shops"}
            </h2>
            {sorted.map((o, i) => {
              const shop = findShop(o.shopSlug)!;
              return (
                <div
                  key={o.shopSlug}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-sm font-semibold"
                      style={{
                        background: `oklch(0.93 0.06 ${shop.logoHue})`,
                        color: `oklch(0.35 0.13 ${shop.logoHue})`,
                      }}
                    >
                      {shop.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <Link to="/shop/$slug" params={{ slug: shop.slug }} className="block truncate text-sm font-semibold hover:underline">
                        {shop.name}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {shop.city}
                        <span>·</span>
                        <Star className="h-3 w-3 fill-gold text-gold" /> {shop.rating}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-semibold">{formatLKR(o.price)}</div>
                    <button
                      onClick={() => {
                        addToCart(p.slug, o.shopSlug);
                        toast.success("Added to cart");
                      }}
                      className="mt-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Add to cart →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
