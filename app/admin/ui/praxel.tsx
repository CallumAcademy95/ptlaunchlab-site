import Link from "next/link";
import { Inter } from "next/font/google";
import { ChevronLeft } from "lucide-react";

// The admin screens borrow Praxel's shape, because that is the shape that
// works: a light slate page, white cards with a hairline border and a soft
// shadow, Inter with tabular figures, and sections that are quiet until
// something is wrong.
//
// These are deliberate copies of albaco-lms/components/ui rather than an
// import — the two apps do not share a package, and a copy that is honest
// about being a copy beats a half-shared abstraction across repos. Names and
// class strings match the originals so a change there is easy to mirror.
//
// The rest of /admin is still on the dark marketing palette. Anything moved
// over should use these, not fresh class strings.

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const cn = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

/** The page shell: light slate, Inter, and the one place the width is set. */
export function AdminPage({
  children,
  width = "max-w-6xl",
}: {
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div
      className={cn(
        inter.variable,
        "min-h-screen bg-[#f6f8fb] text-slate-900 [font-family:var(--font-inter),ui-sans-serif,system-ui,sans-serif]",
      )}
    >
      <div className={cn("mx-auto px-4 py-8 sm:px-6 sm:py-10", width)}>{children}</div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  backHref,
  backLabel = "Back",
  badge,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div>
      {backHref && (
        <Link
          href={backHref}
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" /> {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm leading-snug text-slate-600 sm:text-[15px] sm:leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

/** Surface primitive. Pass `className="p-0"` when the content owns its padding. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}
      {...props}
    />
  );
}

/** A section heading, in the two weights Praxel uses. */
export function SectionTitle({
  children,
  hint,
  quiet = false,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
  quiet?: boolean;
}) {
  return (
    <div>
      <h2
        className={cn(
          "text-sm font-semibold",
          quiet ? "uppercase tracking-wide text-slate-500" : "text-slate-900",
        )}
      >
        {children}
      </h2>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export type Tone = "slate" | "blue" | "green" | "amber" | "violet" | "sky" | "rose";

const CHIP: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  violet: "bg-violet-100 text-violet-700",
  sky: "bg-sky-100 text-sky-700",
  rose: "bg-rose-100 text-rose-600",
};

export function StatTile({
  icon,
  value,
  label,
  sublabel,
  href,
  tone = "slate",
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  sublabel?: string;
  href?: string;
  tone?: Tone;
}) {
  const inner = (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-200 sm:gap-4 sm:p-4",
        href && "hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 sm:h-12 sm:w-12",
          href && "group-hover:scale-105",
          CHIP[tone],
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xl font-semibold leading-none tracking-tight text-slate-900 [font-variant-numeric:tabular-nums] sm:text-2xl">
          {value}
        </p>
        <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-tight text-slate-700 sm:text-sm">
          {label}
        </p>
        {sublabel && <p className="truncate text-xs text-slate-500">{sublabel}</p>}
      </div>
    </div>
  );
  return href ? (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
    >
      {inner}
    </Link>
  ) : (
    inner
  );
}

export type BadgeTone = "neutral" | "blue" | "green" | "amber" | "orange" | "red" | "violet";

const BADGE: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  orange: "bg-orange-100 text-orange-700",
  red: "bg-rose-100 text-rose-700",
  violet: "bg-violet-100 text-violet-700",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        BADGE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-8 text-center">
      {icon && (
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

/** A tinted section, for the parts of a record that need attention. */
export function Notice({
  tone,
  title,
  children,
}: {
  tone: "amber" | "rose" | "blue";
  title?: string;
  children: React.ReactNode;
}) {
  const skin = {
    amber: "border-amber-200 bg-amber-50/60 text-amber-900",
    rose: "border-rose-200 bg-rose-50/50 text-rose-900",
    blue: "border-blue-200 bg-blue-50/60 text-blue-900",
  }[tone];
  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm sm:p-5", skin)}>
      {title && <p className="text-sm font-semibold">{title}</p>}
      <div className={cn("text-sm", title && "mt-1")}>{children}</div>
    </div>
  );
}

/** The two rows of a definition list, so every one lines up the same way. */
export function DefRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <dt className="shrink-0 text-sm text-slate-500">{k}</dt>
      <dd className="text-right text-sm font-medium text-slate-800">{v}</dd>
    </div>
  );
}

/** Table chrome, matching the applications and retention tables in Praxel. */
export function TableWrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export const THEAD =
  "border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500";
export const TBODY = "divide-y divide-slate-100";
export const TR = "transition-colors hover:bg-slate-50/70";
export const TD = "px-4 py-3 align-top";
export const TH = "px-4 py-3 font-medium";
