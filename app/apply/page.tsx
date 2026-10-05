import Link from "next/link";
import { ApplyForm } from "@/components/apply-form";
import { LogoMark } from "@/components/logo-mark";

export const metadata = { title: "Apply as a security guard — EGardMo" };

export default function ApplyPage() {
  return (
    <main className="min-h-dvh bg-primary px-4 py-8 text-primary-foreground sm:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-3.5">
          <LogoMark className="h-10 w-10" />
          <div className="leading-none">
            <p className="font-serif text-xl font-semibold tracking-tight">EGardMo</p>
            <p className="mt-1.5 text-xs text-primary-foreground/60">FSUU Security System Logs</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-primary-foreground/10 bg-card p-5 text-card-foreground shadow-2xl sm:p-9">
          <div aria-hidden="true" className="brass-rule absolute inset-x-0 top-0 h-[2px]" />
          <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Apply as a security guard</h1>
          <p className="mb-6 mt-2 max-w-lg text-sm text-muted-foreground">
            Tell us a little about yourself. An administrator reviews every application before any guard account
            is created.
          </p>
          <ApplyForm />
        </div>

        <p className="mt-5 text-center text-sm text-primary-foreground/60">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
