import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, User as UserIcon, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Search = { redirect?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — ShopCity LK" }] }),
});

function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });

  const goNext = () => navigate({ to: (redirect as any) ?? "/account" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created — welcome to ShopCity LK");
        goNext();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        goNext();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">
          {mode === "login" ? "Welcome back" : "Join ShopCity LK"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          {mode === "login" ? "Sign in to your account" : "Create your account"}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <>
              <Field icon={UserIcon} placeholder="Full name" value={fullName} onChange={setFullName} required />
              <Field icon={Phone} placeholder="Phone (+94 ...)" value={phone} onChange={setPhone} />
            </>
          )}
          <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} required />
          <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} required />
          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full rounded-full bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "login" ? "New to ShopCity LK?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-medium text-foreground underline"
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        By continuing you agree to ShopCity LK's terms and buyer protection policy.
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">← Back to home</Link>
      </p>
    </div>
  );
}

function Field({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
}: {
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 focus-within:border-foreground">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm outline-none"
      />
    </label>
  );
}