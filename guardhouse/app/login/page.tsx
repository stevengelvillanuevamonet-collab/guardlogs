import { LoginForm } from "@/components/login-form";
import { LogoMark } from "@/components/logo-mark";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary px-4">
      {/* Soft brass glow — the one accent, standing in for texture or pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-accent/[0.14] blur-[110px]"
      />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <LogoMark className="h-9 w-9" />
          <p className="font-serif text-xl font-semibold tracking-tight text-primary-foreground">
            EGardMo
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
