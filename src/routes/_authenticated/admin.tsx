import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, X, Check, Users, Store, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { TrustBadge } from "@/components/site/TrustBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — ShopCity LK" }] }),
});

function AdminPage() {
  const { roles, loading } = useAuth();
  const qc = useQueryClient();

  const shops = useQuery({
    queryKey: ["admin-shops"],
    enabled: roles.includes("admin"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const counts = useQuery({
    queryKey: ["admin-counts"],
    enabled: roles.includes("admin"),
    queryFn: async () => {
      const [u, s, p, o] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("shops").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
      ]);
      return { users: u.count ?? 0, shops: s.count ?? 0, products: p.count ?? 0, orders: o.count ?? 0 };
    },
  });

  if (loading) return <div className="mx-auto max-w-3xl px-6 py-24 text-center text-sm text-muted-foreground">Loading…</div>;

  if (!roles.includes("admin")) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cream">
          <ShieldCheck className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">Admins only</h1>
        <p className="mt-2 text-muted-foreground">
          You need the admin role to access this page. Ask the system administrator to grant you access.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Tip for first setup: insert a row into <code className="rounded bg-cream px-1.5 py-0.5">user_roles</code> with your user id and role <code className="rounded bg-cream px-1.5 py-0.5">admin</code>.
        </p>
      </div>
    );
  }

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("shops").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    // also grant seller role to owner
    if (status === "approved") {
      const shop = shops.data?.find((s: any) => s.id === id);
      if (shop) {
        await supabase.from("user_roles").insert({ user_id: shop.owner_id, role: "seller" }).select();
      }
    }
    toast.success(`Shop ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-shops"] });
  };

  const pending = (shops.data ?? []).filter((s: any) => s.status === "pending");
  const others = (shops.data ?? []).filter((s: any) => s.status !== "pending");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Admin</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">City control panel</h1>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <Metric icon={Users} label="Users" value={counts.data?.users ?? "…"} />
        <Metric icon={Store} label="Approved shops" value={counts.data?.shops ?? "…"} />
        <Metric icon={Package} label="Products" value={counts.data?.products ?? "…"} />
        <Metric icon={ShieldCheck} label="Orders" value={counts.data?.orders ?? "…"} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Pending approvals ({pending.length})</h2>
        <div className="mt-4 space-y-3">
          {pending.map((s: any) => (
            <ShopRow key={s.id} shop={s} onApprove={() => setStatus(s.id, "approved")} onReject={() => setStatus(s.id, "rejected")} />
          ))}
          {pending.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No shops awaiting review.
            </p>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">All shops ({others.length})</h2>
        <div className="mt-4 space-y-3">
          {others.map((s: any) => (
            <ShopRow key={s.id} shop={s} onApprove={() => setStatus(s.id, "approved")} onReject={() => setStatus(s.id, "rejected")} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ShopRow({ shop, onApprove, onReject }: { shop: any; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      <div
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display font-semibold"
        style={{
          background: `oklch(0.93 0.06 ${shop.logo_hue})`,
          color: `oklch(0.35 0.13 ${shop.logo_hue})`,
        }}
      >
        {shop.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("")}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold">{shop.name}</h3>
          <TrustBadge type={shop.seller_type} />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {shop.category} · {shop.city}, {shop.district} · {shop.email || "no email"}
        </div>
        {shop.address && <div className="mt-0.5 text-xs text-muted-foreground">{shop.address}</div>}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          className="inline-flex items-center gap-1 rounded-full bg-trust px-3.5 py-2 text-xs font-medium text-trust-foreground"
        >
          <Check className="h-3.5 w-3.5" /> Approve
        </button>
        <button
          onClick={onReject}
          className="inline-flex items-center gap-1 rounded-full border border-destructive/30 px-3.5 py-2 text-xs font-medium text-destructive"
        >
          <X className="h-3.5 w-3.5" /> Reject
        </button>
      </div>
    </div>
  );
}
