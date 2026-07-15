import { ShieldCheck, BadgeCheck, Sparkles } from "lucide-react";
import type { SellerType } from "@/lib/data";
import { sellerBadge } from "@/lib/data";

export function TrustBadge({ type, className = "" }: { type: SellerType; className?: string }) {
  const b = sellerBadge(type);
  const Icon = type === "physical" ? ShieldCheck : type === "online" ? BadgeCheck : Sparkles;
  const tone =
    b.tone === "trust"
      ? "bg-trust/10 text-trust border-trust/20"
      : b.tone === "gold"
        ? "bg-gold/15 text-foreground border-gold/40"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tone} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {b.label}
    </span>
  );
}
