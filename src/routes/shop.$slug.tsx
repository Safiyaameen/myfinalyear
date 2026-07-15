import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Star, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrustBadge } from "@/components/site/TrustBadge";
import { ProductCard } from "@/components/site/ProductCard";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("slug", params.slug)
      .eq("status", "approved")
      .maybeSingle();
    if (error || !data) throw notFound();
    return data;
  },
  component: ShopPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold">Shop not found</h1>
      <p className="mt-2 text-muted-foreground">This storefront is not in the city center.</p>
      <Link to="/shops" className="mt-6 inline-block text-sm underline">
        Back to all shops
      </Link>
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Shop"} — ShopCity LK` },
      { name: "description", content: loaderData?.description ?? "" },
    ],
  }),
});

function ShopPage() {
  const shop = Route.useLoaderData();

  const { data: shopProducts = [] } = useQuery({
    queryKey: ["shop-products", shop.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const hue = shop.logo_hue ?? 200;

  return (
    <div>
      <div
        className="h-56 w-full md:h-72"
        style={{
          background: `linear-gradient(135deg, oklch(0.85 0.1 ${hue}), oklch(0.95 0.04 ${(hue + 60) % 360}))`,
        }}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="-mt-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-5">
            <div
              className="grid h-28 w-28 shrink-0 place-items-center rounded-2xl border border-border bg-background font-display text-3xl font-semibold shadow-[var(--shadow-lift)]"
              style={{ color: `oklch(0.35 0.13 ${hue})` }}
            >
              {shop.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("")}
            </div>
            <div className="pb-2">
              <TrustBadge type={shop.seller_type ?? "new"} />
              <h1 className="mt-3 font-display text-4xl font-semibold leading-tight md:text-5xl">
                {shop.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {shop.city}, {shop.district}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {shop.rating} ({shop.reviews_count} reviews)
                </span>
                <span>·</span>
                <span>{shop.category}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pb-2">
            <a
              href={`tel:${shop.phone}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-foreground/30"
            >
              <Phone className="h-4 w-4" /> Call shop
            </a>
            <a
              href={`mailto:${shop.email}`}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90"
            >
              <Mail className="h-4 w-4" /> Contact seller
            </a>
          </div>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <aside className="space-y-5 md:col-span-1">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold">About the shop</h3>
              <p className="mt-2 text-sm text-muted-foreground">{shop.description}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold">Visit in person</h3>
              <p className="mt-2 text-sm text-muted-foreground">{shop.address}</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {shop.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {shop.email}
                </div>
              </div>
            </div>
            <ReportButton shopId={shop.id} shopName={shop.name} />
          </aside>

          <div className="md:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">All products</h2>
              <span className="text-sm text-muted-foreground">{shopProducts.length} items</span>
            </div>
            {shopProducts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                This shop has not listed products yet.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {shopProducts.map((p: any) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <Link
            to="/shops"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to all shops
          </Link>
        </div>
      </div>
    </div>
  );
  function ReportButton({ shopId, shopName }: { shopId: string; shopName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const submit = async () => {
    if (!reason.trim()) return toast.error("Please select a reason");
    if (!user) return toast.error("Please login to report a seller");
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      shop_id: shopId,
      customer_id: user.id,
      reason,
      description,
      status: "pending",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Report submitted. Our team will review it.");
    setOpen(false);
    setReason("");
    setDescription("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-border bg-card p-4 text-left text-xs text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
      >
        Report this seller
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl">
            <h3 className="font-display text-lg font-semibold">Report {shopName}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Our admin team will review this report within 24 hours.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                >
                  <option value="">Select a reason</option>
                  <option value="Fake products">Fake or counterfeit products</option>
                  <option value="Poor quality">Poor product quality</option>
                  <option value="No delivery">Order not delivered</option>
                  <option value="Rude behaviour">Rude or unprofessional behaviour</option>
                  <option value="Wrong item">Wrong item sent</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Additional details (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what happened..."
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-border py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
}
