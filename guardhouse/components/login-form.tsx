"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    if (!email || !password) {
      toast.error("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (error) {
      toast.error("Sign-in failed", { description: error.message });
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Card className="w-full border-0 shadow-[0_24px_60px_-24px_hsl(222_46%_11%/0.45)]">
      <CardHeader className="pb-2 pt-8 text-center">
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription className="text-xs">
          Access provided by your administrator
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8 pt-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-1.5">
            <Label
              htmlFor="email"
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
            >
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="h-11 border-transparent bg-secondary/70 focus-visible:bg-background focus-visible:ring-offset-0"
            />
          </div>
          <div className="grid gap-1.5">
            <Label
              htmlFor="password"
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
            >
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-11 border-transparent bg-secondary/70 focus-visible:bg-background focus-visible:ring-offset-0"
            />
          </div>
          <Button
            type="submit"
            variant="accent"
            className="h-11 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
