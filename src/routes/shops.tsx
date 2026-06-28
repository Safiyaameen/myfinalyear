import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { shops, cities } from "@/lib/data";
import { ShopCard } from "@/components/site/ShopCard";

export const Route = createFileRoute("/shops")({
  component: ShopsPage,
  head: () => ({
    meta: [
      { title: "All shops — ShopCity LK" },
      { name: "description", content: "Browse all verified Sri Lankan shops on ShopCity LK." },
    ],
  }),
});

function ShopsPage() {
  const [city, setCity] = useState<string>("All");
  const [type, setType] = useState<string>("All");
  const filtered = shops.filter(
    (s) =>
      (city === "All" || s.city === city) &&
      (type === "All" ||
        (type === "physical" && s.sellerType === "physical") ||
        (type === "online" && s.sellerType === "online") ||
        (type === "new" && s.sellerType === "new")),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">The city directory</p>
      <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">All shops</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Every shop on ShopCity LK is verified by our team before going live.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Chip label="All cities" active={city === "All"} onClick={() => setCity("All")} />
        {cities.map((c) => (
          <Chip key={c} label={c} active={city === c} onClick={() => setCity(c)} />
        ))}
        <span className="mx-2 h-5 w-px bg-border" />
        <Chip label="All sellers" active={type === "All"} onClick={() => setType("All")} />
        <Chip label="Physical" active={type === "physical"} onClick={() => setType("physical")} />
        <Chip label="Online" active={type === "online"} onClick={() => setType("online")} />
        <Chip label="New" active={type === "new"} onClick={() => setType("new")} />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <ShopCard key={s.slug} shop={s} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-12 text-center text-sm text-muted-foreground">No shops match your filters.</p>
      )}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card hover:border-foreground/30"
      }`}
    >
      {label}
    </button>
  );
}
