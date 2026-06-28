import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, Store, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const items = useCart();
  const { user, roles } = useAuth();
  const count = items.reduce((a, b) => a + b.qty, 0);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-foreground text-background">
            <Store className="h-4.5 w-4.5" strokeWidth={2.2} />
          </span>
          <span className="font-display text-xl font-semibold leading-none">
            ShopCity <span className="text-gold">LK</span>
          </span>
        </Link>
        <nav className="ml-6 hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link to="/shops" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>Shops</Link>
          <Link to="/compare" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>Compare</Link>
          {roles.includes("seller") && (
            <Link to="/my-shop" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>My shop</Link>
          )}
          {roles.includes("admin") && (
            <Link to="/admin" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>Admin</Link>
          )}
          {!roles.includes("seller") && (
            <Link to="/seller" className="hover:text-foreground">Become a Seller</Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/compare" className="hidden h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground transition hover:border-gold hover:text-foreground sm:flex">
            <Search className="h-4 w-4" />
            <span>Search products across shops…</span>
          </Link>
          <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card transition hover:border-gold" aria-label="Cart">
            <ShoppingBag className="h-4.5 w-4.5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-semibold text-gold-foreground">{count}</span>
            )}
          </Link>
          {user ? (
            <Link to="/account" className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium hover:border-foreground/30">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </Link>
          ) : (
            <Link to="/login" className="inline-flex h-10 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background hover:opacity-90">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
