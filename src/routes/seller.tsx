import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Store, Sparkles, Check } from "lucide-react";
import { categories, cities } from "@/lib/data";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/seller")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: SellerPage,
  head: () => ({
    meta: [
      { title: "Become a seller — ShopCity LK" },
      {
        name: "description",
        content: "Open a verified storefront on ShopCity LK and reach customers across Sri Lanka.",
      },
    ],
  }),
});

const types = [
  {
    id: "physical",
    icon: ShieldCheck,
    title: "Physical store owner",
    desc: "You run a real shop in Sri Lanka with a physical address. Highest trust badge.",
    badge: "Verified Physical Store",
    tone: "trust",
  },
  {
    id: "online",
    icon: Store,
    title: "Existing online seller",
    desc: "You already sell on WhatsApp, Facebook or Instagram. Time for a proper storefront.",
    badge: "Verified Online Seller",
    tone: "gold",
  },
  {
    id: "new",
    icon: Sparkles,
    title: "New entrepreneur",
    desc: "Just starting out? We'll verify your identity and get you live, safely.",
    badge: "New Seller Approved",
    tone: "muted",
  },
];

function SellerPage() {
  const [type, setType] = useState("physical");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-trust/10 text-trust">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">Application received</h1>
        <p className="mt-3 text-muted-foreground">
          Our verification team will review your documents within 2 business days. You'll get an email
          once your shop is approved.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Open your shop</p>
      <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">
        Join Sri Lanka's online city center.
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Every shop is verified before going live — that's how customers know they can trust you.
      </p>

      <div className="mt-10 grid gap-3 md:grid-cols-3">
        {types.map((t) => {
          const Icon = t.icon;
          const active = type === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`rounded-2xl border p-5 text-left transition ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-foreground/30"
              }`}
            >
              <Icon className="h-5 w-5" />
              <h3 className="mt-3 font-semibold">{t.title}</h3>
              <p className={`mt-1.5 text-xs ${active ? "text-background/70" : "text-muted-foreground"}`}>
                {t.desc}
              </p>
              <p className={`mt-3 text-[11px] font-medium uppercase tracking-wider ${active ? "text-gold" : "text-muted-foreground"}`}>
                Badge: {t.badge}
              </p>
            </button>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          toast.success("Application submitted");
        }}
        className="mt-10 grid gap-6 rounded-2xl border border-border bg-card p-6 md:p-8"
      >
        <Fieldset title="Personal details">
          <Input label="Full name" required />
          <Input label="NIC number" required />
          <Input label="Phone" type="tel" placeholder="+94 ..." required />
          <Input label="Email" type="email" required />
        </Fieldset>

        <Fieldset title="Business details">
          <Input label="Shop name" required />
          <Select label="Category" options={categories.map((c) => c.name)} />
          <Textarea label="Shop description" />
        </Fieldset>

        <Fieldset title="Address">
          <Select label="City" options={cities} />
          <Input label="District" />
          <Input label="Full address" className="md:col-span-2" required={type === "physical"} />
        </Fieldset>

        <Fieldset title="Verification documents">
          <FileField label={type === "physical" ? "Business registration / shop photo" : "ID front"} />
          <FileField label="Shop logo" />
        </Fieldset>

        <button className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground">
          Submit for verification
        </button>
      </form>
    </div>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  );
}

function Input({
  label,
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        {...rest}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-foreground"
      />
    </label>
  );
}

function Textarea({ label }: { label: string }) {
  return (
    <label className="block md:col-span-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <textarea
        rows={3}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-foreground"
      />
    </label>
  );
}

function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-foreground">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function FileField({ label }: { label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-background px-3.5 py-3 text-sm hover:border-foreground/30">
      <span className="text-muted-foreground">{label}</span>
      <span className="rounded-full bg-cream px-3 py-1 text-xs font-medium">Upload</span>
      <input type="file" className="hidden" />
    </label>
  );
}
