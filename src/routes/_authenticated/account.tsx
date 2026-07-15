import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Package, User as UserIcon, LogOut, Store, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/hooks/use-auth";
import { formatLKR } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
  head: () => ({ meta: [{ title: "Your account — ShopCity LK" }] }),
});

function AccountPage() {
  const { user, roles } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string; phone: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile({ full_name: data?.full_name ?? "", phone: data?.phone ?? "" }));
  }, [user]);

  const orders = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, quantity, unit_price, total, status, created_at, payment_method, shops(name, city), products(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name, phone: profile.phone })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Your account</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">Hi {profile?.full_name?.split(" ")[0] || "there"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-destructive/40 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      {/* role shortcuts */}
      <div className="mt-6 flex flex-wrap gap-2">
        {roles.includes("seller") && (
          <Link to="/my-shop" className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-gold-foreground">
            <Store className="h-4 w-4" /> Seller dashboard
          </Link>
        )}
        {roles.includes("admin") && (
          <Link to="/admin" className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
            <ShieldCheck className="h-4 w-4" /> Admin dashboard
          </Link>
        )}
        {!roles.includes("seller") && (
          <Link to="/seller" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-foreground/30">
            <Store className="h-4 w-4" /> Open a shop
          </Link>
        )}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_2fr]">
        {/* Profile card */}
        <form onSubmit={saveProfile} className="h-fit rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UserIcon className="h-4 w-4" /> Profile
          </div>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">Full name</span>
              <input
                value={profile?.full_name ?? ""}
                onChange={(e) => setProfile((p) => ({ ...(p ?? { full_name: "", phone: "" }), full_name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Phone</span>
              <input
                value={profile?.phone ?? ""}
                onChange={(e) => setProfile((p) => ({ ...(p ?? { full_name: "", phone: "" }), phone: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </label>
            <button
              disabled={saving}
              className="mt-2 w-full rounded-full bg-foreground py-2.5 text-sm font-medium text-background disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>

        {/* Orders */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4" /> Order history
          </div>
          {orders.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading orders…</p>
          ) : (orders.data?.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              You haven't placed any orders yet. <Link to="/compare" className="underline">Start comparing</Link>.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {orders.data!.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{o.products?.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.shops?.name} · {o.shops?.city} · {new Date(o.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-sm font-semibold">{formatLKR(Number(o.total))}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{o.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
