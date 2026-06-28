import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Star, MapPin, ShoppingBag, ShieldCheck } from "lucide-react";
import { products, findShop, formatLKR } from "@/lib/data";
import { TrustBadge } from "@/components/site/TrustBadge";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";

type SearchParams = { q?: string };

export const Route = createFileRoute("/compare")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: ComparePage,
  head: () => ({
    meta: [
      { title: "Compare products — ShopCity LK" },
      {
        name: "description",
        content: "Compare the same product across verified Sri Lankan shops. See the cheapest price instantly.",
      },
    ],
  }),
});

function ComparePage() {
  const { q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ ?? "");
  const [sort, setSort] = useState<"price" | "rating" | "delivery">("price");

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(
      (p) => p.title.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle),
    );
  }, [q]);

  const focus = matches[0];
  const offers = focus
    ? [...focus.offers].sort((a, b) => {
        if (sort === "price") return a.price - b.price;
        if (sort === "rating")
          return (findShop(b.shopSlug)?.rating ?? 0) - (findShop(a.shopSlug)?.rating ?? 0);
        return a.delivery.localeCompare(b.delivery);
      })
    : [];

  const cheapestPrice = offers[0]?.price;
  const bestRating = offers.length
    ? Math.max(...offers.map((o) => findShop(o.shopSlug)?.rating ?? 0))
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Compare</p>
      <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">
        One product. Every shop. Side by side.
      </h1>

      <div className="mt-6 flex w-full max-w-2xl items-center gap-2 rounded-full border border-border bg-card p-1.5 pl-5 shadow-[var(--shadow-soft)]">
        <Search className="h-4.5 w-4.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try: iPhone 15 charger, coconut oil, Galaxy A55…"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
        />
      </div>

      {matches.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Suggestions:</span>
          {matches.slice(0, 5).map((m) => (
            <button
              key={m.slug}
              onClick={() => setQ(m.title)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                focus?.slug === m.slug
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-foreground/30"
              }`}
            >
              {m.title}
            </button>
          ))}
        </div>
      )}

      {!focus ? (
        <p className="mt-16 text-center text-muted-foreground">No products match your search.</p>
      ) : (
        <div className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Comparing</p>
              <h2 className="mt-1 font-display text-2xl font-semibold md:text-3xl">{focus.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {offers.length} verified {offers.length === 1 ? "shop" : "shops"} found
              </p>
            </div>
            <div className="flex gap-1 rounded-full border border-border bg-card p-1 text-sm">
              {(["price", "rating", "delivery"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition ${
                    sort === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "price" ? "Lowest price" : s === "rating" ? "Highest rated" : "Fast delivery"}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison table */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="hidden grid-cols-12 gap-4 border-b border-border bg-cream px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid">
              <div className="col-span-4">Shop</div>
              <div className="col-span-2">City</div>
              <div className="col-span-2">Delivery</div>
              <div className="col-span-1">Stock</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-1" />
            </div>
            {offers.map((o) => {
              const shop = findShop(o.shopSlug)!;
              const isCheapest = o.price === cheapestPrice;
              const isBestRated = (shop.rating ?? 0) === bestRating;
              return (
                <div
                  key={o.shopSlug}
                  className="grid grid-cols-1 gap-3 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-12 md:items-center md:gap-4"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-sm font-semibold"
                      style={{
                        background: `oklch(0.93 0.06 ${shop.logoHue})`,
                        color: `oklch(0.35 0.13 ${shop.logoHue})`,
                      }}
                    >
                      {shop.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <Link to="/shop/$slug" params={{ slug: shop.slug }} className="block truncate font-semibold hover:underline">
                        {shop.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <TrustBadge type={shop.sellerType} />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {shop.city}
                    <span className="ml-auto inline-flex items-center gap-1 md:ml-0">
                      <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {shop.rating}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">{o.delivery}</div>
                  <div className="col-span-1 text-sm">
                    {o.stock > 0 ? (
                      <span className="text-trust">{o.stock} in stock</span>
                    ) : (
                      <span className="text-destructive">Out</span>
                    )}
                  </div>
                  <div className="col-span-2 md:text-right">
                    <div className="font-display text-xl font-semibold">{formatLKR(o.price)}</div>
                    <div className="mt-0.5 flex flex-wrap gap-1.5 md:justify-end">
                      {isCheapest && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                          <ShieldCheck className="h-3 w-3" /> Cheapest
                        </span>
                      )}
                      {isBestRated && !isCheapest && (
                        <span className="rounded-full bg-trust/15 px-2 py-0.5 text-[11px] font-semibold text-trust">
                          Best rated
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-1 flex md:justify-end">
                    <button
                      onClick={() => {
                        addToCart(focus.slug, o.shopSlug);
                        toast.success(`Added from ${shop.name}`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-medium text-background hover:opacity-90"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" /> Buy
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
