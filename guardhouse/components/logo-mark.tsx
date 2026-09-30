import { cn } from "@/lib/utils";

/**
 * The EGardMo mark: a shield (the guardhouse) with a raised boom-gate arm
 * (a cleared checkpoint). Single-weight line art so it reads at favicon
 * size and scales cleanly to a masthead mark. Uses currentColor — set
 * text color on the wrapper to theme it for dark or light surfaces.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-accent", className)}
      aria-hidden="true"
    >
      <path
        d="M20 4 L33 9.5 V19 C33 27.5 27.5 33.5 20 36.5 C12.5 33.5 7 27.5 7 19 V9.5 Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      <path
        d="M14 30 V23.5 L26.5 13"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26.5" cy="13" r="1.9" fill="currentColor" />
    </svg>
  );
}
