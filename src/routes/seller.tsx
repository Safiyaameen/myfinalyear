import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { ShieldCheck, Store, Sparkles, Check, Upload } from "lucide-react";
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
  const [busy, setBusy] = useState(false);

  // Form field refs
  const fullNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const shopNameRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const cityRef = useRef<HTMLSelectElement>(null);
  const districtRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  // Shop logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setLogoFile(f);
    if (f) setLogoPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login first");
        setBusy(false);
        return;
      }

      const shopName = shopNameRef.current?.value ?? "";
      const city = cityRef.current?.value ?? "Colombo";

      if (!shopName.trim()) {
        toast.error("Please enter your shop name");
        setBusy(false);
        return;
      }

      // Upload shop logo if provided
      let logoUrl = "";
      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const fileName = `shops/${session.user.id}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, logoFile, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          toast.error("Logo upload failed: " + uploadError.message);
          setBusy(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);
        logoUrl = urlData.publicUrl;
      }

      // Create slug from shop name
      const slug = shopName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const { error } = await supabase.from("shops").insert({
        owner_id: session.user.id,
        slug: slug + "-" + Date.now(),
        name: shopName,
        category: categoryRef.current?.value ?? "Electronics",
        description: descriptionRef.current?.value ?? "",
        city: city,
        district: districtRef.current?.value ?? city,
        address: addressRef.current?.value ?? "",
        phone: phoneRef.current?.value ?? "",
        email: emailRef.current?.value ?? session.user.email ?? "",
        seller_type: type as "physical" | "online" | "new",
        status: "pending",
        logo_hue: Math.floor(Math.random() * 360),
        logo_url: logoUrl,
        rating: 0,
        reviews_count: 0,
      });

      if (error) {
        toast.error(error.message);
        setBusy(false);
        return;
      }

      // Also update user role to seller
      await supabase.from("user_roles").insert({
        user_id: session.user.id,
        role: "seller",
      });

      setSubmitted(true);
      toast.success("Application submitted successfully!");

    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-trust/10 text-trust">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">Application received</h1>
        <p className="mt-3 text-muted-foreground">
          Our verification team will review your documents within 2 business days. You will get an email
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
              type="button"
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
        onSubmit={handleSubmit}
        className="mt-10 grid gap-6 rounded-2xl border border-border bg-card p-6 md:p-8"
      >
        <Fieldset title="Personal details">
          <Input label="Full name" ref={fullNameRef} required />
          <Input label="NIC number" required />
          <Input label="Phone" type="tel" placeholder="+94 ..." ref={phoneRef} required />
          <Input label="Email" type="email" ref={emailRef} required />
        </Fieldset>

        <Fieldset title="Business details">
          <Input label="Shop name" ref={shopNameRef} required />
          <SelectRef label="Category" options={categories.map((c) => c.name)} ref={categoryRef} />
          <TextareaRef label="Shop description" ref={descriptionRef} />
        </Fieldset>

        <Fieldset title="Address">
          <SelectRef label="City" options={cities} ref={cityRef} />
          <Input label="District" ref={districtRef} />
          <Input label="Full address" className="md:col-span-2" ref={addressRef} required={type === "physical"} />
        </Fieldset>

        <Fieldset title="Verification documents">
          <FileField label={type === "physical" ? "Business registration / shop photo" : "ID front"} />

          <div className="rounded-xl border border-dashed border-border bg-background p-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-3 py-3 text-sm text-muted-foreground hover:border-foreground/40">
              <Upload className="h-4 w-4" />
              {logoFile ? logoFile.name : "Upload shop logo"}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="mx-auto mt-2 h-24 w-24 rounded-lg border object-cover"
              />
            )}
          </div>
        </Fieldset>

        <button
          type="submit"
          disabled={busy}
          className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground disabled:opacity-50"
        >
          {busy ? "Submitting..." : "Submit for verification"}
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

const Input = ({
  label,
  className = "",
  ref,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; ref?: React.Ref<HTMLInputElement> }) => {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        ref={ref}
        {...rest}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-foreground"
      />
    </label>
  );
};

const TextareaRef = ({
  label,
  ref,
}: { label: string; ref?: React.Ref<HTMLTextAreaElement> }) => {
  return (
    <label className="block md:col-span-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <textarea
        ref={ref}
        rows={3}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-foreground"
      />
    </label>
  );
};

const SelectRef = ({
  label,
  options,
  ref,
}: { label: string; options: string[]; ref?: React.Ref<HTMLSelectElement> }) => {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        ref={ref}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-foreground"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
};

function FileField({ label }: { label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-background px-3.5 py-3 text-sm hover:border-foreground/30">
      <span className="text-muted-foreground">{label}</span>
      <span className="rounded-full bg-cream px-3 py-1 text-xs font-medium">Upload</span>
      <input type="file" className="hidden" />
    </label>
  );
}
