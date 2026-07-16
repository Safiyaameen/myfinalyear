import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import {
  Plus,
  Trash2,
  Store,
  Package,
  Clock,
  CheckCircle2,
  Flag,
  AlertTriangle,
  ShieldCheck,
  Upload,
} from "lucide-react";
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
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        toast.error(`Failed to load shop: ${error.message}`);
        throw error;
      }
      return data;
    },
  });

  const productsQ = useQuery({
    queryKey: ["my-products", shopQ.data?.id],
    enabled: !!shopQ.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("shop_id", shopQ.data!.id)
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(`Failed to load products: ${error.message}`);
        throw error;
      }
      return data ?? [];
    },
  });

  const ordersQ = useQuery({
    queryKey: ["shop-orders", shopQ.data?.id],
    enabled: !!shopQ.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, quantity, total, status, created_at, products(title, image_url)")
        .eq("shop_id", shopQ.data!.id)
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(`Failed to load orders: ${error.message}`);
        throw error;
      }
      return data ?? [];
    },
  });

  const reportsQ = useQuery({
    queryKey: ["my-reports", shopQ.data?.id],
    enabled: !!shopQ.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("shop_id", shopQ.data!.id)
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(`Failed to load reports: ${error.message}`);
        throw error;
      }
      return data ?? [];
    },
  });

  if (shopQ.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-sm text-muted-foreground">
        Loading your shop…
      </div>
    );
  }

  if (shopQ.isError) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold">Couldn't load your shop</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {(shopQ.error as any)?.message ?? "Something went wrong talking to the server."}
        </p>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["my-shop"] })}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!shopQ.data) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cream">
          <Store className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">You don't have a shop yet</h1>
        <p className="mt-2 text-muted-foreground">Apply now and open your storefront in the city center.</p>
        <Link
          to="/seller"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground"
        >
          Become a seller
        </Link>
      </div>
    );
  }

  const shop = shopQ.data;
  const totalSales = (ordersQ.data ?? []).reduce((a: number, o: any) => a + Number(o.total), 0);
  const orderCount = (ordersQ.data ?? []).length;
  const returnCount = (ordersQ.data ?? []).filter((o: any) => o.status === "returned").length;
  const returnRate = orderCount > 0 ? Math.round((returnCount / orderCount) * 100) : 0;
  const reportCount = (reportsQ.data ?? []).length;

  // Monitoring period
  const getMonitoringInfo = () => {
    if (!shop.monitoring_end_date) return null;
    const end = new Date(shop.monitoring_end_date);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = shop.seller_type === "new" ? 180 : 90;
    const daysElapsed = totalDays - daysLeft;
    const progress = Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100);
    if (daysLeft <= 0) return { daysLeft: 0, progress: 100, done: true, label: "Monitoring complete!" };
    return { daysLeft, progress, done: false, label: `${daysLeft} days remaining` };
  };

  const monitoring = getMonitoringInfo();
  const isReadyForBadge = monitoring?.done && returnRate <= 10 && reportCount === 0;

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
          <div className="mt-3">
            <ShopLogoUpload
              shop={shop}
              onChanged={() => qc.invalidateQueries({ queryKey: ["my-shop"] })}
            />
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

      {/* Monitoring Section */}
      {shop.status === "approved" && monitoring && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-gold" /> Verification Monitoring Period
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {shop.seller_type === "new"
              ? "New sellers are monitored for 6 months before receiving their final verification badge."
              : "Sellers are monitored for 3 months before receiving their final verification badge."}
          </p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Monitoring progress</span>
              <span>{monitoring.label}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-border">
              <div
                className="h-2 rounded-full bg-gold transition-all"
                style={{ width: `${monitoring.progress}%` }}
              />
            </div>
          </div>

          {/* Performance metrics */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className={`rounded-xl border p-4 ${returnRate > 10 ? "border-destructive/30 bg-destructive/5" : "border-border bg-background"}`}>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Return Rate</div>
              <div className={`mt-1 font-display text-2xl font-semibold ${returnRate > 10 ? "text-destructive" : "text-trust"}`}>
                {returnRate}%
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {returnRate > 10
                  ? "⚠️ High return rate — may affect badge"
                  : "✅ Within acceptable range (below 10%)"}
              </div>
            </div>

            <div className={`rounded-xl border p-4 ${reportCount > 0 ? "border-destructive/30 bg-destructive/5" : "border-border bg-background"}`}>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Customer Reports</div>
              <div className={`mt-1 font-display text-2xl font-semibold ${reportCount > 0 ? "text-destructive" : "text-trust"}`}>
                {reportCount}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {reportCount > 0
                  ? "⚠️ You have reports — admin is reviewing"
                  : "✅ No reports received"}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Shop Rating</div>
              <div className="mt-1 font-display text-2xl font-semibold text-gold">
                {Number(shop.rating).toFixed(1)} ⭐
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Based on {shop.reviews_count} customer reviews
              </div>
            </div>
          </div>

          {/* Badge readiness */}
          {isReadyForBadge ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-trust/10 border border-trust/20 p-4">
              <ShieldCheck className="h-5 w-5 text-trust" />
              <div>
                <div className="text-sm font-semibold text-trust">Ready for verification badge!</div>
                <div className="text-xs text-muted-foreground">
                  You have completed the monitoring period with excellent performance. Contact admin for your badge.
                </div>
              </div>
            </div>
          ) : monitoring.done ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <div className="text-sm font-semibold text-destructive">Monitoring complete — badge pending review</div>
                <div className="text-xs text-muted-foreground">
                  Please resolve any reports and reduce your return rate below 10% to qualify.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Reports received */}
      {(reportsQ.data ?? []).length > 0 && (
        <div className="mt-6 rounded-2xl border border-destructive/20 bg-card p-6">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2 text-destructive">
            <Flag className="h-5 w-5" /> Customer Reports ({reportsQ.data?.length})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These reports have been submitted by customers and are being reviewed by our admin team.
          </p>
          <div className="mt-4 space-y-3">
            {(reportsQ.data ?? []).map((r: any) => (
              <div key={r.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-destructive">{r.reason}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 ${
                    r.status === "resolved"
                      ? "bg-trust/10 text-trust"
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {r.status}
                  </span>
                </div>
                {r.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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

          {shop.status === "approved" && (
            <NewProductForm
              shopId={shop.id}
              onCreated={() => qc.invalidateQueries({ queryKey: ["my-products"] })}
            />
          )}

          <div className="mt-5 divide-y divide-border">
            {(productsQ.data ?? []).map((p: any) => (
              <ProductRow
                key={p.id}
                product={p}
                onChanged={() => qc.invalidateQueries({ queryKey: ["my-products"] })}
              />
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
              <OrderStatusRow
                key={o.id}
                order={o}
                onChanged={() => qc.invalidateQueries({ queryKey: ["shop-orders"] })}
              />
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

const orderStatuses = ["pending", "confirmed", "shipped", "delivered", "returned", "cancelled"] as const;

const orderStatusStyle: Record<string, string> = {
  pending: "bg-gold/15 text-foreground border-gold/40",
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  shipped: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  delivered: "bg-trust/10 text-trust border-trust/20",
  returned: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

function OrderStatusRow({
  order,
  onChanged,
}: {
  order: any;
  onChanged: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus as any })
        .eq("id", order.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Order marked as ${newStatus}`);
      onChanged();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="rounded-xl border border-border p-3 text-sm">
      <div className="flex items-center gap-2">
        {order.products?.image_url ? (
          <img
            src={order.products.image_url}
            alt={order.products?.title}
            className="h-9 w-9 shrink-0 rounded-lg border object-cover"
          />
        ) : (
          <div className="h-9 w-9 shrink-0 rounded-lg bg-cream" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{order.products?.title}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString()} · {formatLKR(Number(order.total))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
            orderStatusStyle[order.status ?? "pending"]
          }`}
        >
          {order.status ?? "pending"}
        </span>

        <select
          value={order.status ?? "pending"}
          onChange={handleStatusChange}
          disabled={updating}
          className="rounded-lg border border-border bg-background px-2 py-1 text-xs capitalize outline-none disabled:opacity-50"
        >
          {orderStatuses.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ShopLogoUpload({ shop, onChanged }: { shop: any; onChanged: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `shops/${shop.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("shops")
        .update({ logo_url: data.publicUrl })
        .eq("id", shop.id);

      if (updateError) throw updateError;

      toast.success("Shop logo updated");
      onChanged();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      {shop.logo_url ? (
        <img
          src={shop.logo_url}
          alt={shop.name}
          className="h-14 w-14 rounded-xl border object-cover"
        />
      ) : (
        <div className="h-14 w-14 rounded-xl bg-cream" />
      )}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-xs text-muted-foreground underline hover:text-foreground disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Change shop logo"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoChange}
        className="hidden"
      />
    </div>
  );
}

function ProductRow({
  product,
  onChanged,
}: {
  product: any;
  onChanged: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [restockAmount, setRestockAmount] = useState("");
  const [restocking, setRestocking] = useState(false);

  const handleRestock = async () => {
    const amount = Number(restockAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    setRestocking(true);
    try {
      const { error, data } = await supabase
        .from("products")
        .update({ stock: product.stock + amount })
        .eq("id", product.id)
        .select();

      if (error) {
        toast.error(`Restock failed: ${error.message}`);
        return;
      }
      if (!data || data.length === 0) {
        toast.error("Restock was blocked (RLS) — you may not own this product.");
        return;
      }

      toast.success(`Restocked +${amount} units`);
      setRestockAmount("");
      onChanged();
    } catch (err: any) {
      toast.error(err.message ?? "Restock failed");
    } finally {
      setRestocking(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `products/${product.shop_id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("products")
        .update({ image_url: data.publicUrl })
        .eq("id", product.id);

      if (updateError) throw updateError;

      toast.success("Image updated");
      onChanged();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${product.title}"? This can't be undone.`)) return;

    setDeleting(true);
    try {
      const { error, data } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id)
        .select();

      if (error) {
        toast.error(`Couldn't delete: ${error.message}`);
        return;
      }

      // If RLS silently blocks a delete, Supabase returns success with an empty
      // array instead of an error — catch that case explicitly.
      if (!data || data.length === 0) {
        toast.error("Delete was blocked (no matching row you own). Try logging out and back in.");
        return;
      }

      toast.success("Product deleted");
      onChanged();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

<div className="min-w-0">
  <div className="truncate text-sm font-semibold">{product.title}</div>
  <div className="text-xs text-muted-foreground">
    {product.category} · {product.stock} in stock
  </div>
  <div className="mt-1 flex items-center gap-1">
    <input
      type="number"
      min="1"
      value={restockAmount}
      onChange={(e) => setRestockAmount(e.target.value)}
      placeholder="Qty"
      className="w-16 rounded-md border border-border bg-card px-2 py-0.5 text-xs"
    />
    <button
      onClick={handleRestock}
      disabled={restocking}
      className="rounded-md bg-trust/10 px-2 py-0.5 text-xs font-medium text-trust hover:bg-trust/20 disabled:opacity-50"
    >
      {restocking ? "..." : "Restock"}
    </button>
  </div>
</div>

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-12 w-12 shrink-0 rounded-lg object-cover border"
          />
        ) : (
          <div className="h-12 w-12 shrink-0 rounded-lg bg-cream" />
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{product.title}</div>
          <div className="text-xs text-muted-foreground">
            {product.category} · {product.stock} in stock
          </div>
          <div className="mt-1 flex items-center gap-1">
            <input
              type="number"
              min="1"
              value={restockAmount}
              onChange={(e) => setRestockAmount(e.target.value)}
              placeholder="Qty"
              className="w-16 rounded-md border border-border bg-card px-2 py-0.5 text-xs"
            />
            <button
              onClick={handleRestock}
              disabled={restocking}
              className="rounded-md bg-trust/10 px-2 py-0.5 text-xs font-medium text-trust hover:bg-trust/20 disabled:opacity-50"
            >
              {restocking ? "..." : "Restock"}
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="font-display text-sm font-semibold">{formatLKR(Number(product.price))}</div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs text-muted-foreground underline hover:text-foreground disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Change image"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
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

function NewProductForm({
  shopId,
  onCreated,
}: {
  shopId: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0].name);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      setPreviewUrl(URL.createObjectURL(f));
      setImageUrl(""); // clear pasted URL if a file is chosen
    }
  };

  const uploadImage = async (fileToUpload: File) => {
    const ext = fileToUpload.name.split(".").pop();
    const fileName = `products/${shopId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    try {
      let finalImageUrl = imageUrl;

      if (file) {
        finalImageUrl = await uploadImage(file);
      }

      if (!finalImageUrl) {
        toast.error("Please add an image (upload or paste a URL)");
        setBusy(false);
        return;
      }

      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") +
        "-" +
        Math.random().toString(36).slice(2, 6);

      const { error } = await supabase.from("products").insert({
        shop_id: shopId,
        slug,
        title,
        category,
        price: Number(price),
        stock: Number(stock),
        image_hue: Math.floor(Math.random() * 360),
        image_url: finalImageUrl,
      });

      if (error) {
        toast.error(error.message);
        setBusy(false);
        return;
      }

      setTitle("");
      setPrice("");
      setStock("10");
      setImageUrl("");
      setFile(null);
      setPreviewUrl("");

      toast.success("Product added");
      onCreated();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mt-4 grid gap-2 rounded-xl border border-dashed border-border bg-background p-3"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="Product title"
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
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
        placeholder="Price (LKR)"
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
      />

      <input
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        type="number"
        placeholder="Stock"
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
      />

      {/* Image: upload from device OR paste URL */}
      <div className="rounded-lg border border-border bg-card p-3">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-3 text-sm text-muted-foreground hover:border-foreground/40">
          <Upload className="h-4 w-4" />
          {file ? file.name : "Upload image from device"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <div className="mt-2 text-center text-xs text-muted-foreground">or</div>

        <input
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            if (e.target.value) {
              setFile(null);
              setPreviewUrl("");
            }
          }}
          type="url"
          placeholder="Paste product image URL"
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      {(previewUrl || imageUrl) && (
        <img
          src={previewUrl || imageUrl}
          alt="Preview"
          className="h-40 w-full rounded-lg object-cover border"
        />
      )}

      <button
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {busy ? "Adding..." : "Add Product"}
      </button>
    </form>
  );
}
