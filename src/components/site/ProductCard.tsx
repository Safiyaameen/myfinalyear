import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/data";
import { formatLKR, findShop } from "@/lib/data";
import { ProductThumb } from "./ProductThumb";

export function ProductCard({ product }: { product: Product }) {
  const cheapest = product.offers.reduce((a, b) => (a.price < b.price ? a : b));
  const shop = findShop(cheapest.shopSlug);
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
    >
      <ProductThumb hue={product.imageHue} label={product.category} className="aspect-[4/3] w-full" />
      <div className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{product.category}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{product.title}</h3>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <div className="font-display text-lg font-semibold">{formatLKR(cheapest.price)}</div>
            <div className="text-xs text-muted-foreground">
              from {shop?.name} · {product.offers.length} {product.offers.length === 1 ? "shop" : "shops"}
            </div>
          </div>
          {product.offers.length > 1 && (
            <span className="rounded-full bg-trust/10 px-2 py-1 text-xs font-medium text-trust">
              Compare
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
