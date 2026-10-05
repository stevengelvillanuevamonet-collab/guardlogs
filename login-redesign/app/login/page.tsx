import Image from "next/image";
import { ClipboardCheck, FileText, IdCard } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { LogoMark } from "@/components/logo-mark";

const highlights = [
  {
    icon: IdCard,
    title: "Fast check-in",
    body: "Capture visitor details and surrendered IDs in seconds.",
  },
  {
    icon: ClipboardCheck,
    title: "Live visitor board",
    body: "See who is on site right now and check them out cleanly.",
  },
  {
    icon: FileText,
    title: "Daily reports",
    body: "Export the day's log to Excel or Word when your shift ends.",
  },
];

function Brand({ className }: { className?: string }) {
  return (
    <div className={className}>
      <LogoMark className="h-9 w-9 sm:h-10 sm:w-10 drop-shadow-[0_0_14px_hsl(var(--accent)/0.5)]" />
      <div className="leading-none">
        <p className="font-serif text-xl font-semibold tracking-tight">EGardMo</p>
        <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-primary-foreground/60">
          FSUU Security System Logs
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-primary text-primary-foreground">
      {/* Campus photo, slowly drifting */}
      <div aria-hidden="true" className="absolute inset-0 -z-30 overflow-hidden">
        <Image
          src="/login-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="anim-kenburns object-cover"
        />
      </div>
      {/* Navy wash: heavy on the left for legibility, lighter on the right */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-gradient-to-r from-primary/75 via-primary/60 to-primary/50 lg:from-primary/95 lg:via-primary/75 lg:to-primary/55"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-gradient-to-t from-primary/70 via-transparent to-primary/40"
      />
      <div
        aria-hidden="true"
        className="ledger-field-dark absolute inset-0 -z-10 opacity-60"
      />
      <div
        aria-hidden="true"
        className="anim-drift pointer-events-none absolute -left-24 -top-24 -z-10 h-[34rem] w-[34rem] rounded-full bg-accent/[0.18] blur-[120px]"
      />

      <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
        {/* Brand column */}
        <aside className="hidden flex-col justify-between p-14 lg:flex xl:p-20">
          <Brand className="anim-fade-up flex items-center gap-3.5" />

          <div className="max-w-lg space-y-10">
            <div className="space-y-5">
              <div className="brass-rule anim-rule h-[2px] w-14" />
              <h1
                className="anim-fade-up font-serif text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl"
                style={{ "--d": "150ms" } as React.CSSProperties}
              >
                Every visitor,
                <br />
                <span className="text-accent">accounted for.</span>
              </h1>
              <p
                className="anim-fade-up max-w-md text-[15px] leading-relaxed text-primary-foreground/70"
                style={{ "--d": "280ms" } as React.CSSProperties}
              >
                The digital logbook for your guardhouse. Check visitors in,
                track surrendered IDs, and keep a clean record of every entry.
              </p>
            </div>

            <ul className="space-y-5">
              {highlights.map(({ icon: Icon, title, body }, i) => (
                <li
                  key={title}
                  className="anim-fade-up flex items-start gap-4"
                  style={{ "--d": `${420 + i * 120}ms` } as React.CSSProperties}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary-foreground/15 bg-primary-foreground/[0.07] text-accent backdrop-blur-sm">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-sm text-primary-foreground/65">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p
            className="anim-fade-up text-xs text-primary-foreground/45"
            style={{ "--d": "800ms" } as React.CSSProperties}
          >
            © {new Date().getFullYear()} EGardMo · FSUU Security System Logs
          </p>
        </aside>

        {/* Form column */}
        <section className="flex items-center justify-center px-4 py-5 sm:px-8 sm:py-12">
          <div className="w-full max-w-[26rem] space-y-4 sm:space-y-8">
            <Brand className="anim-fade-up flex items-center justify-center gap-3.5 lg:hidden" />
            <div
              className="anim-fade-up"
              style={{ "--d": "200ms" } as React.CSSProperties}
            >
              <LoginForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
