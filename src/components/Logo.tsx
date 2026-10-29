import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden="true">
      <rect x="3" y="6" width="26" height="23" rx="6" className="fill-primary" />
      <rect x="3" y="6" width="26" height="7" rx="3" className="fill-success" />
      <rect x="9" y="2.5" width="3" height="7" rx="1.5" className="fill-primary" />
      <rect x="20" y="2.5" width="3" height="7" rx="1.5" className="fill-primary" />
      <path d="M10.5 20.5l3.6 3.6 7.4-7.6" fill="none" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary-foreground" />
    </svg>
  );
}

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className={cn("text-lg font-extrabold tracking-tight", inverted ? "text-sidebar-accent-foreground" : "text-primary")}>
        Vence<span className="text-success">Hoje</span>
      </span>
    </span>
  );
}
