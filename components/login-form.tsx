"use client";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const fieldClass =
  "h-11 sm:h-12 border-border/70 bg-secondary/40 pl-10 text-[15px] shadow-[inset_0_1px_2px_hsl(222_46%_11%/0.04)] transition-colors placeholder:text-muted-foreground/60 hover:bg-secondary/70 focus-visible:border-accent/60 focus-visible:bg-background focus-visible:ring-accent/30 focus-visible:ring-offset-0";

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      toast.error("Sign-in failed", { description: authError.message });
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Card className="relative w-full overflow-hidden border border-border/60 bg-card/90 text-card-foreground shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_40px_90px_-30px_hsl(222_46%_11%/0.7)] backdrop-blur-xl">
      {/* Brass hairline across the top edge */}
      <div aria-hidden="true" className="brass-rule absolute inset-x-0 top-0 h-[2px]" />

      <CardHeader className="space-y-1.5 px-6 pb-1 pt-6 sm:space-y-2 sm:px-8 sm:pb-2 sm:pt-9">
        <div className="mb-1 hidden h-10 w-10 items-center sm:inline-flex justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <CardTitle className="font-serif text-2xl leading-tight tracking-tight sm:text-[28px]">
          Welcome back
        </CardTitle>
        <CardDescription className="text-sm">
          Sign in to open the guardhouse logbook.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-1 pt-4 sm:px-8 sm:pb-2 sm:pt-5">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <div className="grid gap-1">
                <AlertTitle>Unable to sign in</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-[13px] font-medium">
              Email address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="guard@example.com"
                required
                disabled={isSubmitting}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password" className="text-[13px] font-medium">
              Password
            </Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                disabled={isSubmitting}
                className={`${fieldClass} pr-11`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            variant="accent"
            size="lg"
            disabled={isSubmitting}
            className="btn-sheen h-11 w-full sm:h-12 text-[15px] font-semibold shadow-[0_8px_20px_-8px_hsl(38_62%_44%/0.7),0_1px_0_hsl(0_0%_100%/0.25)_inset] transition-all hover:-translate-y-px hover:shadow-[0_12px_24px_-8px_hsl(38_62%_44%/0.8),0_1px_0_hsl(0_0%_100%/0.25)_inset] active:translate-y-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-3 px-6 pb-5 pt-4 sm:gap-4 sm:px-8 sm:pb-8 sm:pt-6">
        <div className="flex w-full items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          Restricted access
          <span className="h-px flex-1 bg-border" />
        </div>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Accounts are issued by your administrator.
          <span className="hidden sm:inline">
            {" "}
            Contact them if you need access or a password reset.
          </span>
        </p>
      </CardFooter>
    </Card>
  );
}
