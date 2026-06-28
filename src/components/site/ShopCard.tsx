import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import type { Shop } from "@/lib/data";
import { TrustBadge } from "./TrustBadge";

export function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Link
      to="/shop/$slug"
      params={{ slug: shop.slug }}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
    >
      <div
        className="relative h-32 w-full"
        style={{
          background: `linear-gradient(135deg, oklch(0.88 0.09 ${shop.logoHue}), oklch(0.96 0.04 ${(shop.logoHue + 40) % 360}))`,
        }}
      >
        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between">
          <div
            className="grid h-12 w-12 place-items-center rounded-xl bg-background font-display text-lg font-semibold shadow-[var(--shadow-soft)]"
            style={{ color: `oklch(0.4 0.13 ${shop.logoHue})` }}
          >
            {shop.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
          </div>
          <TrustBadge type={shop.sellerType} />
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-tight group-hover:text-foreground">
            {shop.name}
          </h3>
          <span className="inline-flex items-center gap-1 text-sm">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            {shop.rating}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{shop.category}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {shop.city}, {shop.district}
        </div>
      </div>
    </Link>
  );
}
