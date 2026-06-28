import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Store, Package, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatLKR, categories } from "@/lib/data";
import { TrustBadge } from "@/components/site/TrustBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/my-shop")({
  component: MyShopPage,
  head: () => ({ meta: [{ title: "Seller dashboard — ShopCity LK" }] }),
});

function MyShopPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const shopQ = useQuery({
    queryKey: ["my-shop", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const productsQ = useQuery({
    queryKey: ["my-products", shopQ.data?.id],
    enabled: !!shopQ.data?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("shop_id", shopQ.data!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const ordersQ = useQuery({
    queryKey: ["shop-orders", shopQ.data?.id],
    enabled: !!shopQ.data?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, quantity, total, status, created_at, products(title)")
        .eq("shop_id", shopQ.data!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (shopQ.isLoading) {
    return <div className="mx-auto max-w-3xl px-6 py-24 text-center text-sm text-muted-foreground">Loading your shop…</div>;
  }

  if (!shopQ.data) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cream">
          <Store className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">You don't have a shop yet</h1>
        <p className="mt-2 text-muted-foreground">Apply now and open your storefront in the city center.</p>
        <Link to="/seller" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground">
          Become a seller
        </Link>
      </div>
    );
  }

  const shop = shopQ.data;
  const totalSales = (ordersQ.data ?? []).reduce((a: number, o: any) => a + Number(o.total), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Seller dashboard</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">{shop.name}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <TrustBadge type={shop.seller_type as any} />
            <StatusPill status={shop.status} />
          </div>
        </div>
        {shop.status === "approved" && (
          <Link to="/shop/$slug" params={{ slug: shop.slug }} className="text-sm underline">
            View public storefront →
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <Stat label="Orders" value={ordersQ.data?.length ?? 0} />
        <Stat label="Products" value={productsQ.data?.length ?? 0} />
        <Stat label="Sales" value={formatLKR(totalSales)} />
        <Stat label="Rating" value={Number(shop.rating).toFixed(1)} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Products */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <Package className="h-5 w-5" /> Products
            </h2>
            {shop.status === "approved" ? (
              <span className="text-xs text-muted-foreground">{productsQ.data?.length ?? 0} listed</span>
            ) : (
              <span className="text-xs text-muted-foreground">Approval required before listing</span>
            )}
          </div>

          {shop.status === "approved" && <NewProductForm shopId={shop.id} onCreated={() => qc.invalidateQueries({ queryKey: ["my-products"] })} />}

          <div className="mt-5 divide-y divide-border">
            {(productsQ.data ?? []).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.category} · {p.stock} in stock</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-display text-sm font-semibold">{formatLKR(Number(p.price))}</div>
                  <button
                    onClick={async () => {
                      await supabase.from("products").delete().eq("id", p.id);
                      qc.invalidateQueries({ queryKey: ["my-products"] });
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {(productsQ.data?.length ?? 0) === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No products yet.</p>
            )}
          </div>
        </div>

        {/* Orders */}
        <div className="h-fit rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-semibold">Recent orders</h2>
          <div className="mt-4 space-y-3">
            {(ordersQ.data ?? []).slice(0, 8).map((o: any) => (
              <div key={o.id} className="rounded-xl border border-border p-3 text-sm">
                <div className="font-medium">{o.products?.title}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(o.created_at).toLocaleDateString()}</span>
                  <span>{formatLKR(Number(o.total))}</span>
                </div>
              </div>
            ))}
            {(ordersQ.data?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg =
    status === "approved"
      ? { Icon: CheckCircle2, cls: "bg-trust/10 text-trust border-trust/20", label: "Approved" }
      : status === "rejected"
        ? { Icon: Trash2, cls: "bg-destructive/10 text-destructive border-destructive/20", label: "Rejected" }
        : { Icon: Clock, cls: "bg-gold/15 text-foreground border-gold/40", label: "Pending review" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.cls}`}>
      <cfg.Icon className="h-3.5 w-3.5" /> {cfg.label}
    </span>
  );
}

function NewProductForm({ shopId, onCreated }: { shopId: string; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0].name);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
    const { error } = await supabase.from("products").insert({
      shop_id: shopId,
      slug,
      title,
      category,
      price: Number(price),
      stock: Number(stock),
      image_hue: Math.floor(Math.random() * 360),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTitle("");
    setPrice("");
    toast.success("Product added");
    onCreated();
  };

  return (
    <form onSubmit={submit} className="mt-4 grid gap-2 rounded-xl border border-dashed border-border bg-background p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="Product title"
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
      >
        {categories.map((c) => (
          <option key={c.slug}>{c.name}</option>
        ))}
      </select>
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
        type="number"
        placeholder="Price LKR"
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
      />
      <input
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        type="number"
        placeholder="Stock"
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
      />
      <button disabled={busy} className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
        <Plus className="h-4 w-4" /> Add
      </button>
    </form>
  );
}
