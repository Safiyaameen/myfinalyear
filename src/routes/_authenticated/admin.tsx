import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, X, Check, Users, Store, Package, AlertTriangle, Clock, Flag } from "lucide-react";
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

  // Run the automated final-badge check every time the admin panel loads
  useEffect(() => {
    if (roles.includes("admin")) {
      supabase.rpc("finalize_shop_verifications").then(({ error }) => {
        if (!error) {
          qc.invalidateQueries({ queryKey: ["admin-shops"] });
        }
      });
    }
  }, [roles]);

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

  const reports = useQuery({
    queryKey: ["admin-reports"],
    enabled: roles.includes("admin"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, shops(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const allOrders = useQuery({
    queryKey: ["admin-all-orders"],
    enabled: roles.includes("admin"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, shop_id, status");
      if (error) throw error;
      return data ?? [];
    },
  });

  const counts = useQuery({
    queryKey: ["admin-counts"],
    enabled: roles.includes("admin"),
    queryFn: async () => {
      const [u, s, p, o, r] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("shops").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        users: u.count ?? 0,
        shops: s.count ?? 0,
        products: p.count ?? 0,
        orders: o.count ?? 0,
        reports: r.count ?? 0,
      };
    },
  });

  if (loading) return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center text-sm text-muted-foreground">
      Loading…
    </div>
  );

  if (!roles.includes("admin")) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cream">
          <ShieldCheck className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">Admins only</h1>
        <p className="mt-2 text-muted-foreground">
          You need the admin role to access this page.
        </p>
      </div>
    );
  }

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.rpc("admin_set_shop_status", {
      p_shop_id: id,
      p_status: status,
    });
    if (error) return toast.error(error.message);
    toast.success(`Shop ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-shops"] });
    qc.invalidateQueries({ queryKey: ["admin-counts"] });
  };

  const resolveReport = async (id: string) => {
    const { error } = await supabase.rpc("admin_resolve_report", {
      p_report_id: id,
    });
    if (error) return toast.error(error.message);
    toast.success("Report resolved");
    qc.invalidateQueries({ queryKey: ["admin-reports"] });
    qc.invalidateQueries({ queryKey: ["admin-counts"] });
  };

  const pending = (shops.data ?? []).filter((s: any) => s.status === "pending");
  const approved = (shops.data ?? []).filter((s: any) => s.status === "approved");
  const rejected = (shops.data ?? []).filter((s: any) => s.status === "rejected");
  const pendingReports = (reports.data ?? []).filter((r: any) => r.status === "pending");

  // Live report count per shop, computed from the actual reports table
  // rather than the shops.report_count column (which is never kept in sync).
  const reportCountByShop = (reports.data ?? []).reduce((acc: Record<string, number>, r: any) => {
    if (r.shop_id) acc[r.shop_id] = (acc[r.shop_id] ?? 0) + 1;
    return acc;
  }, {});

  // Live order/return counts per shop, computed from the actual orders table
  // rather than the shops.order_count / return_count columns (also never synced).
  const orderStatsByShop = (allOrders.data ?? []).reduce(
    (acc: Record<string, { total: number; returned: number }>, o: any) => {
      if (!o.shop_id) return acc;
      if (!acc[o.shop_id]) acc[o.shop_id] = { total: 0, returned: 0 };
      acc[o.shop_id].total += 1;
      if (o.status === "returned") acc[o.shop_id].returned += 1;
      return acc;
    },
    {},
  );

  // Helper to get monitoring status
  const getMonitoringStatus = (shop: any) => {
    if (!shop.monitoring_end_date) return null;
    const end = new Date(shop.monitoring_end_date);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return { label: "Monitoring complete", color: "text-trust", done: true };
    return { label: `${daysLeft} days left in monitoring`, color: "text-gold", done: false };
  };

  // Helper for return rate — computed live from real orders, not stale columns
  const getReturnRate = (shop: any) => {
    const stats = orderStatsByShop[shop.id];
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.returned / stats.total) * 100);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Admin</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">City control panel</h1>

      {/* Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-5">
        <Metric icon={Users} label="Users" value={counts.data?.users ?? "…"} />
        <Metric icon={Store} label="Approved shops" value={counts.data?.shops ?? "…"} />
        <Metric icon={Package} label="Products" value={counts.data?.products ?? "…"} />
        <Metric icon={ShieldCheck} label="Orders" value={counts.data?.orders ?? "…"} />
        <Metric icon={Flag} label="Pending reports" value={counts.data?.reports ?? "…"} color="text-destructive" />
      </div>

      {/* Pending Approvals */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">
          Pending approvals ({pending.length})
        </h2>
        <div className="mt-4 space-y-3">
          {pending.map((s: any) => (
            <ShopRow
              key={s.id}
              shop={s}
              monitoringStatus={getMonitoringStatus(s)}
              returnRate={getReturnRate(s)}
              reportCount={reportCountByShop[s.id] ?? 0}
              onApprove={() => setStatus(s.id, "approved")}
              onReject={() => setStatus(s.id, "rejected")}
            />
          ))}
          {pending.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No shops awaiting review.
            </p>
          )}
        </div>
      </section>

      {/* Customer Reports */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">
          Customer Reports ({pendingReports.length})
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Reports submitted by customers against shops. Review and resolve each one.
        </p>
        <div className="mt-4 space-y-3">
          {pendingReports.map((r: any) => (
            <div
              key={r.id}
              className="flex flex-col gap-4 rounded-2xl border border-destructive/20 bg-card p-4 sm:flex-row sm:items-center"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-destructive" />
                  <span className="font-semibold">{r.shops?.name ?? "Unknown shop"}</span>
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                    {r.status}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Reason: {r.reason}
                </div>
                {r.description && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Details: {r.description}
                  </div>
                )}
                <div className="mt-1 text-xs text-muted-foreground">
                  Reported: {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => resolveReport(r.id)}
                className="inline-flex items-center gap-1 rounded-full bg-trust px-3.5 py-2 text-xs font-medium text-trust-foreground"
              >
                <Check className="h-3.5 w-3.5" /> Mark Resolved
              </button>
            </div>
          ))}
          {pendingReports.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No pending reports.
            </p>
          )}
        </div>
      </section>

      {/* Approved Shops with Monitoring */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">
          All shops ({approved.length})
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitoring period: Physical and Online sellers — 3 months. New sellers — 6 months.
          Shops with zero reports and a 10% or lower return rate are automatically upgraded
          to a final verification badge once their monitoring period ends.
        </p>
        <div className="mt-4 space-y-3">
          {approved.map((s: any) => (
            <ShopRow
              key={s.id}
              shop={s}
              monitoringStatus={getMonitoringStatus(s)}
              returnRate={getReturnRate(s)}
              reportCount={reportCountByShop[s.id] ?? 0}
              onApprove={() => setStatus(s.id, "approved")}
              onReject={() => setStatus(s.id, "rejected")}
            />
          ))}
        </div>
      </section>

      {/* Rejected Shops */}
      {rejected.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">
            Rejected shops ({rejected.length})
          </h2>
          <div className="mt-4 space-y-3">
            {rejected.map((s: any) => (
              <ShopRow
                key={s.id}
                shop={s}
                monitoringStatus={null}
                returnRate={0}
                reportCount={0}
                onApprove={() => setStatus(s.id, "approved")}
                onReject={() => setStatus(s.id, "rejected")}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-semibold ${color ?? ""}`}>{value}</div>
    </div>
  );
}

function ShopRow({
  shop,
  monitoringStatus,
  returnRate,
  reportCount,
  onApprove,
  onReject,
}: {
  shop: any;
  monitoringStatus: any;
  returnRate: number;
  reportCount: number;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-start">
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
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="truncate font-semibold">{shop.name}</h3>
          <TrustBadge type={shop.seller_type} />
          <span className={`text-xs rounded-full px-2 py-0.5 ${
            shop.status === "approved"
              ? "bg-trust/10 text-trust"
              : shop.status === "rejected"
              ? "bg-destructive/10 text-destructive"
              : "bg-gold/10 text-gold"
          }`}>
            {shop.status}
          </span>
          {shop.is_verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-trust/15 px-2 py-0.5 text-xs font-medium text-trust">
              <ShieldCheck className="h-3 w-3" /> Final badge earned
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {shop.category} · {shop.city}, {shop.district} · {shop.email || "no email"}
        </div>
        {shop.address && (
          <div className="mt-0.5 text-xs text-muted-foreground">{shop.address}</div>
        )}

        {/* Monitoring Info */}
        <div className="mt-3 flex flex-wrap gap-3">
          {monitoringStatus && (
            <div className={`flex items-center gap-1 text-xs ${monitoringStatus.color}`}>
              <Clock className="h-3.5 w-3.5" />
              {monitoringStatus.label}
            </div>
          )}
          <div className={`flex items-center gap-1 text-xs ${returnRate > 10 ? "text-destructive" : "text-trust"}`}>
            <Package className="h-3.5 w-3.5" />
            Return rate: {returnRate}%
            {returnRate > 10 && <AlertTriangle className="h-3 w-3" />}
          </div>
          <div className={`flex items-center gap-1 text-xs ${reportCount > 0 ? "text-destructive" : "text-muted-foreground"}`}>
            <Flag className="h-3.5 w-3.5" />
            Reports: {reportCount}
            {reportCount > 0 && <AlertTriangle className="h-3 w-3" />}
          </div>
          {!shop.is_verified && monitoringStatus?.done && returnRate <= 10 && reportCount === 0 && (
            <div className="flex items-center gap-1 text-xs text-trust font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              Ready for verification badge!
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
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
