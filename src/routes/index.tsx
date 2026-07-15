import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Search,
  ShieldCheck,
  Scale,
  Store,
  MapPin,
  Star,
} from "lucide-react";
import { categories, cities, formatLKR } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { ShopCard } from "@/components/site/ShopCard";
import { TrustBadge } from "@/components/site/TrustBadge";
import hero from "@/assets/hero-city.jpg";
import { ProductThumb } from "@/components/site/ProductThumb";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ShopCity LK — Sri Lanka's Online City Center" },
      {
        name: "description",
        content:
          "Visit verified Sri Lankan shops, compare product prices instantly and buy safely from Colombo, Kandy, Galle and Jaffna.",
      },
    ],
  }),
});

function Index() {
  const [q, setQ] = useState("");

  const { data: shops = [] } = useQuery({
    queryKey: ["homepage-shops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("status", "approved")
        .order("rating", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["homepage-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, shops(name, city)")
        .order("price", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const trusted = shops.filter((s: any) => s.seller_type !== "new").slice(0, 4);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={hero}
            alt="Sri Lankan city market"
            width={1920}
            height={1080}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/40" />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 md:pb-28 md:pt-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Sri Lanka's verified multi-vendor marketplace
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              Welcome to Sri Lanka's <span className="text-gold">online city center</span>.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Visit real Pettah, Kandy and Galle shops online. Compare the same product across
              verified sellers, see the cheapest price instantly, and buy safely.
            </p>

            <form
              className="mt-8 flex w-full max-w-xl items-center gap-2 rounded-full border border-border bg-card p-1.5 pl-5 shadow-[var(--shadow-soft)]"
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = "/compare?q=" + encodeURIComponent(q);
              }}
            >
              <Search className="h-4.5 w-4.5 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search any product — e.g. iPhone 15 charger"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
              >
                Compare
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <Link
                to="/shops"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 backdrop-blur hover:border-foreground/40"
              >
                <Store className="h-4 w-4" /> Browse shops
              </Link>
              <Link
                to="/compare"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 backdrop-blur hover:border-foreground/40"
              >
                <Scale className="h-4 w-4" /> Compare products
              </Link>
              <Link
                to="/seller"
                className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 font-medium text-gold-foreground hover:opacity-95"
              >
                Become a seller
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-6 text-sm">
              <Trust k="850+" v="verified shops" />
              <Trust k="9" v="cities islandwide" />
              <Trust k="100%" v="seller verification" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <Section eyebrow="Top categories" title="Shop everything, from a real shop">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          {categories.map((c) => (
            <button
              key={c.slug}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition hover:-translate-y-0.5 hover:border-gold hover:shadow-[var(--shadow-soft)]"
            >
              <span
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{
                  background: `oklch(0.94 0.06 ${(c.slug.length * 37) % 360})`,
                  color: `oklch(0.35 0.13 ${(c.slug.length * 37) % 360})`,
                }}
              >
                <span className="text-base font-semibold">{c.name[0]}</span>
              </span>
              <span className="text-xs font-medium">{c.name}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Featured shops */}
      <Section
        eyebrow="Featured shops"
        title="Walk into trusted Sri Lankan storefronts"
        action={<SectionLink to="/shops">All shops</SectionLink>}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shops.slice(0, 6).map((s: any) => (
            <ShopCard key={s.slug} shop={s} />
          ))}
        </div>
      </Section>

      {/* Cheapest deals */}
      <Section
        eyebrow="Cheapest deals today"
        title="Same product, compared across shops"
        action={<SectionLink to="/compare">Compare more</SectionLink>}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((p: any) => (
            <Link
              key={p.id}
              to="/product/$slug"
              params={{ slug: p.slug }}
              className="group block overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
            >
              <ProductThumb
  hue={p.image_hue ?? 200}
  imageUrl={p.image_url}
  label={p.category}
  className="aspect-[4/3] w-full"
/>
              <div className="p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</p>
                <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{p.title}</h3>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <div className="font-display text-lg font-semibold">{formatLKR(Number(p.price))}</div>
                    <div className="text-xs text-muted-foreground">from {p.shops?.name}</div>
                  </div>
                  <span className="rounded-full bg-trust/10 px-2 py-1 text-xs font-medium text-trust">
                    Compare
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Trust */}
      <Section eyebrow="Trust & verification" title="Three badges. Zero guesswork.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: "physical" as const,
              title: "Real shops, real addresses",
              body: "Owners of physical stores in Pettah, Kandy, Galle and beyond. Visit them in person any time.",
            },
            {
              t: "online" as const,
              title: "Verified online sellers",
              body: "Trusted sellers from WhatsApp, Facebook and Instagram, now with proper storefronts on ShopCity LK.",
            },
            {
              t: "new" as const,
              title: "New entrepreneurs, approved",
              body: "Up-and-coming local makers, vetted by our team before they ever list a product.",
            },
          ].map((card) => (
            <div key={card.t} className="rounded-2xl border border-border bg-card p-6">
              <TrustBadge type={card.t} />
              <h3 className="mt-4 font-display text-xl font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Trusted sellers */}
      <Section
        eyebrow="Trusted sellers"
        title="Highest-rated shops this month"
        action={<SectionLink to="/shops">All shops</SectionLink>}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {trusted.map((s: any) => (
            <Link
              key={s.slug}
              to="/shop/$slug"
              params={{ slug: s.slug }}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/30"
            >
              <div
                className="grid h-14 w-14 shrink-0 place-items-center rounded-xl font-display text-lg font-semibold"
                style={{
                  background: `oklch(0.92 0.06 ${s.logo_hue ?? 200})`,
                  color: `oklch(0.35 0.13 ${s.logo_hue ?? 200})`,
                }}
              >
                {s.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-semibold">{s.name}</h3>
                  <span className="inline-flex items-center gap-1 text-sm">
                    <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                    {s.rating}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {s.city}
                  </span>
                  <span>·</span>
                  <span>{s.reviews_count} reviews</span>
                </div>
                <div className="mt-2">
                  <TrustBadge type={s.seller_type} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Cities */}
      <Section eyebrow="Popular cities" title="Discover shops by city">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cities.slice(0, 4).map((city, i) => (
            <Link
              key={city}
              to="/shops"
              className="group relative overflow-hidden rounded-2xl border border-border p-6 transition hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, oklch(0.94 0.05 ${(i * 90) % 360}), oklch(0.99 0.01 ${(i * 90 + 40) % 360}))`,
              }}
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {shops.filter((s: any) => s.city === city).length} shops
              </p>
              <h3 className="mt-2 font-display text-3xl font-semibold">{city}</h3>
              <ArrowRight className="absolute right-5 top-6 h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-foreground to-foreground/90 px-8 py-14 text-background md:px-14">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-xs font-medium text-gold">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified sellers only
              </span>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-5xl">
                Open your shop in the digital city center.
              </h2>
              <p className="mt-3 max-w-md text-background/70">
                Whether you run a shop in Pettah, sell on WhatsApp, or you are just starting out — we will
                help you reach customers across Sri Lanka, safely.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link
                to="/seller"
                className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-gold-foreground"
              >
                Become a seller <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/shops"
                className="inline-flex items-center gap-2 rounded-full border border-background/30 px-5 py-3 text-sm font-medium"
              >
                Tour the city
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Trust({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-semibold">{k}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{v}</div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">{eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SectionLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="hidden items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
    >
      {children} <ArrowRight className="h-4 w-4" />
    </Link>
  );
}