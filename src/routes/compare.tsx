import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Star, MapPin, ShoppingBag, ShieldCheck } from "lucide-react";
import { formatLKR } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { TrustBadge } from "@/components/site/TrustBadge";
import { toast } from "sonner";
import { addToCart } from "@/lib/cart";

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

  const { data: allProducts = [] } = useQuery({
    queryKey: ["compare-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, shops(*)")
        .order("price", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return allProducts;
    return allProducts.filter(
      (p: any) =>
        p.title.toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle),
    );
  }, [q, allProducts]);

  // Group products by title to find same product across shops
  const groupedByTitle = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const p of matches) {
      const key = p.title.toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return groups;
  }, [matches]);

  const uniqueTitles = Object.keys(groupedByTitle);
  const focusTitle = uniqueTitles[0] ?? "";
  const focusProducts = groupedByTitle[focusTitle] ?? [];

  const sorted = useMemo(() => {
    return [...focusProducts].sort((a: any, b: any) => {
      if (sort === "price") return Number(a.price) - Number(b.price);
      if (sort === "rating") return (b.shops?.rating ?? 0) - (a.shops?.rating ?? 0);
      return (a.delivery ?? "").localeCompare(b.delivery ?? "");
    });
  }, [focusProducts, sort]);

  const cheapestPrice = sorted[0] ? Number(sorted[0].price) : 0;
  const bestRating = sorted.length
    ? Math.max(...sorted.map((p: any) => p.shops?.rating ?? 0))
    : 0;

  const allTitles = [...new Set(allProducts.map((p: any) => p.title))];

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
          placeholder="Try: iPhone 15 charger, coconut oil, Samsung A55…"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
        />
      </div>

      {allTitles.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Suggestions:</span>
          {allTitles.slice(0, 5).map((title: any) => (
            <button
              key={title}
              onClick={() => setQ(title)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                focusTitle === title.toLowerCase()
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-foreground/30"
              }`}
            >
              {title}
            </button>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">
          {allProducts.length === 0 ? "Loading..." : "No products match your search."}
        </p>
      ) : (
        <div className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Comparing</p>
              <h2 className="mt-1 font-display text-2xl font-semibold md:text-3xl">
                {sorted[0]?.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {sorted.length} verified {sorted.length === 1 ? "shop" : "shops"} found
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

          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="hidden grid-cols-12 gap-4 border-b border-border bg-cream px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid">
              <div className="col-span-4">Shop</div>
              <div className="col-span-2">City</div>
              <div className="col-span-2">Delivery</div>
              <div className="col-span-1">Stock</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-1" />
            </div>
            {sorted.map((p: any) => {
              const shop = p.shops;
              const isCheapest = Number(p.price) === cheapestPrice;
              const isBestRated = (shop?.rating ?? 0) === bestRating;
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-1 gap-3 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-12 md:items-center md:gap-4"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-sm font-semibold"
                      style={{
                        background: `oklch(0.93 0.06 ${shop?.logo_hue ?? 200})`,
                        color: `oklch(0.35 0.13 ${shop?.logo_hue ?? 200})`,
                      }}
                    >
                      {shop?.name?.split(" ").slice(0, 2).map((w: string) => w[0]).join("") ?? "??"}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to="/shop/$slug"
                        params={{ slug: shop?.slug ?? "" }}
                        className="block truncate font-semibold hover:underline"
                      >
                        {shop?.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <TrustBadge type={shop?.seller_type} />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {shop?.city}
                    <span className="ml-auto inline-flex items-center gap-1 md:ml-0">
                      <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {shop?.rating}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">{p.delivery}</div>
                  <div className="col-span-1 text-sm">
                    {p.stock > 0 ? (
                      <span className="text-trust">{p.stock} in stock</span>
                    ) : (
                      <span className="text-destructive">Out</span>
                    )}
                  </div>
                  <div className="col-span-2 md:text-right">
                    <div className="font-display text-xl font-semibold">{formatLKR(Number(p.price))}</div>
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
      console.log("BUY CLICKED");
      console.log("Product:", p);
      console.log("Shop:", shop);

      addToCart(p.slug, shop.slug);

      toast.success(`Added from ${shop.name}`);
    }}
    className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-medium text-background hover:opacity-90"
  >
    <ShoppingBag className="h-3.5 w-3.5" />
    Buy
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