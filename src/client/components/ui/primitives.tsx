/**
 * 通用 UI 原语 — 全站复用
 */
import type { ReactNode, ButtonHTMLAttributes } from "react";

export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`page ${className}`}>{children}</main>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="section-label">{children}</h2>;
}

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button type="button" className={`card-interactive ${className}`} onClick={onClick}>
        {children}
      </button>
    );
  }
  return <div className={`card ${className}`}>{children}</div>;
}

type BtnVariant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "primary",
  block,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  block?: boolean;
}) {
  const v =
    variant === "primary" ? "btn-primary" : variant === "secondary" ? "btn-secondary" : "btn-ghost";
  return (
    <button type="button" className={`btn ${v} ${block ? "btn-block" : ""} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function IconButton({
  children,
  className = "",
  label,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" className={`btn-icon ${className}`} aria-label={label} {...rest}>
      {children}
    </button>
  );
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`progress-track ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Chip({
  children,
  color,
  className = "",
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`chip ${className}`}
      style={
        color
          ? { backgroundColor: `${color}18`, color }
          : { backgroundColor: "var(--color-surface-sunken)", color: "var(--color-ink-muted)" }
      }
    >
      {children}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  /** 插画路径，优先于 icon */
  illustration?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card px-6 py-10 text-center">
      {illustration ? (
        <img
          src={illustration}
          alt=""
          className="mx-auto mb-4 h-32 w-32 rounded-2xl object-cover shadow-card ring-1 ring-ink/5"
          width={128}
          height={128}
        />
      ) : (
        icon && (
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
            {icon}
          </div>
        )
      )}
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function LoadingPage() {
  return (
    <main className="page">
      <Skeleton className="h-28 w-full rounded-3xl mb-6" />
      <Skeleton className="h-4 w-24 mb-3" />
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </main>
  );
}

export function ErrorPage({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4">
      <div className="text-center max-w-xs">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger text-xl font-bold">
          !
        </div>
        <p className="font-semibold text-ink mb-1">暂时连不上服务器</p>
        <p className="text-sm text-ink-muted mb-5">{message ?? "请检查网络后重试"}</p>
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            重试
          </Button>
        )}
      </div>
    </main>
  );
}

export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
