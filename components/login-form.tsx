"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getRole, homeFor } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Inputs sit on a dark glass panel: translucent fill, hairline border, brass focus.
const fieldClass =
  "login-field h-12 rounded-lg border-white/15 bg-white/[0.06] pl-11 text-[15px] text-white ring-offset-0 transition-colors placeholder:text-white/35 hover:border-white/25 hover:bg-white/[0.09] focus-visible:border-accent/70 focus-visible:bg-white/[0.09] focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-0";

const iconClass =
  "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-accent";

export function LoginForm({ notice }: { notice?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    notice === "disabled" ? "This account has been deactivated. Contact your administrator." : null
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    if (!email || !password) {
      setError("Enter your email and password.");
      toast.error("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { data: signedIn, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      toast.error("Sign-in failed", { description: authError.message });
      return;
    }

    // Admins land on the admin dashboard, guards on the guard desk.
    router.push(homeFor(getRole(signedIn.user)));
    router.refresh();
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.14] bg-[hsl(222_46%_8%/0.78)] text-white shadow-[0_1px_0_hsl(0_0%_100%/0.18)_inset,0_50px_100px_-30px_hsl(222_60%_3%/0.9),0_0_0_1px_hsl(222_46%_8%/0.4)] backdrop-blur-2xl">
      {/* Brass edge light along the top, and a warm glow in the corner */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.10] via-white/[0.02] to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent/20 blur-[70px]" />

      <div className="relative px-6 pb-6 pt-7 sm:px-9 sm:pb-9 sm:pt-10">
        <div className="mb-5 hidden h-12 w-12 items-center justify-center rounded-full border border-accent/40 bg-gradient-to-b from-accent/25 to-accent/5 text-accent shadow-[0_0_24px_-4px_hsl(var(--accent)/0.55)] sm:inline-flex">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-[26px] font-semibold leading-tight tracking-tight sm:text-[32px]">
          Welcome back
        </h2>
        <p className="mt-1.5 text-sm text-white/60">Sign in to open the guardhouse logbook.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-8 sm:space-y-5" noValidate>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-100"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
              <div className="grid gap-1">
                <p className="font-medium leading-none">Unable to sign in</p>
                <p className="text-[13px] text-red-100/80">{error}</p>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-[13px] font-medium text-white/80">
              Email address
            </Label>
            <div className="group relative">
              <Mail className={iconClass} />
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="you@example.com"
                required
                disabled={isSubmitting}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password" className="text-[13px] font-medium text-white/80">
              Password
            </Label>
            <div className="group relative">
              <LockKeyhole className={iconClass} />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                disabled={isSubmitting}
                className={`${fieldClass} pr-12`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 text-white/45 hover:bg-white/10 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-sheen inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[hsl(41_72%_62%)] to-[hsl(37_64%_46%)] text-[15px] font-semibold text-primary shadow-[0_10px_24px_-8px_hsl(38_70%_40%/0.75),0_1px_0_hsl(0_0%_100%/0.45)_inset] transition-all hover:-translate-y-px hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="mt-7 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-white/40">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20" />
          Restricted access
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20" />
        </div>
        <p className="mt-4 text-center text-xs leading-relaxed text-white/50">
          Accounts are issued by your administrator.
          <br />
          Want to join the security team?{" "}
          <Link
            href="/apply"
            className="font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Apply as a guard
          </Link>
        </p>
      </div>
    </div>
  );
}
