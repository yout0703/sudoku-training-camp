/**
 * 0703 Studio · 题型专属高颜值矢量工坊图标
 * 涵盖全部 23 种变体数独，采用微渐变/Duotone 与圆角工坊设计语言
 */
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { getPuzzleType } from "../../../shared/puzzle-types";

const SW = 2;

type Props = {
  code: string;
  className?: string;
  color?: string;
  withBg?: boolean;
  size?: number;
};

function SvgShell({
  className,
  color,
  children,
  size = 24,
}: {
  className?: string;
  color?: string;
  children: ReactNode;
  size?: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={SW}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** 标准数独 */
function IconStandard({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" fillOpacity="0.1" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </SvgShell>
  );
}

/** 对角线数独 */
function IconDiagonal({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" fillOpacity="0.08" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" opacity="0.3" strokeWidth="1.5" />
      <path d="m4.5 4.5 15 15M19.5 4.5l-15 15" strokeWidth="2.4" />
    </SvgShell>
  );
}

/** 奇偶数独 */
function IconOddEven({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" fillOpacity="0.06" />
      <circle cx="8" cy="12" r="3.2" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
      <rect x="13" y="8.8" width="6.4" height="6.4" rx="1.5" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
    </SvgShell>
  );
}

/** 杀手数独 */
function IconKiller({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" strokeDasharray="3 2" />
      <path d="M7 7.5h3.5" strokeWidth="2.2" />
      <rect x="11.5" y="11.5" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.2" />
    </SvgShell>
  );
}

/** 加减数独 */
function IconAddSub({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" strokeDasharray="3 2" />
      <path d="M7.5 9h4M9.5 7v4" strokeWidth="2.2" />
      <path d="M13.5 15h4" strokeWidth="2.2" />
    </SvgShell>
  );
}

/** 大小数数独 */
function IconBigSmall({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M12 3v18" strokeWidth="1.5" />
      <path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6V3Z" fill="currentColor" fillOpacity="0.3" stroke="none" />
      <circle cx="7.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="12" r="2.5" fill="currentColor" stroke="none" />
    </SvgShell>
  );
}

/** 不等号数独 */
function IconGreaterThan({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3" y="5" width="7" height="14" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="14" y="5" width="7" height="14" rx="2" fill="currentColor" fillOpacity="0.1" />
      <path d="m9 9 3.5 3-3.5 3" strokeWidth="2.2" />
    </SvgShell>
  );
}

/** 温度计数独 */
function IconThermo({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <circle cx="7" cy="16.5" r="3.5" fill="currentColor" fillOpacity="0.3" />
      <path d="M8.5 13.5V6a2 2 0 1 1 4 0v4.5l3.5 3.5" strokeWidth="2.2" />
    </SvgShell>
  );
}

/** 不规则数独 */
function IconIrregular({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <path d="M4 8.5 9 4h6.5l4.5 4.5v6.5l-4.5 4.5H9L4 15V8.5Z" fill="currentColor" fillOpacity="0.12" />
      <path d="M9 4v11h10.5" strokeWidth="2.2" />
    </SvgShell>
  );
}

/** 连续数独 */
function IconConsecutive({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3" y="5" width="8" height="14" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="13" y="5" width="8" height="14" rx="2" fill="currentColor" fillOpacity="0.1" />
      <path d="M10 12h4" strokeWidth="4" />
    </SvgShell>
  );
}

/** 五六数独 */
function IconSum56({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3" y="5" width="8" height="14" rx="2" fill="currentColor" fillOpacity="0.08" />
      <rect x="13" y="5" width="8" height="14" rx="2" fill="currentColor" fillOpacity="0.08" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" strokeWidth="1.5" />
      <path d="M10.5 12h3" stroke="#fff" strokeWidth="1.5" />
    </SvgShell>
  );
}

/** 堡垒数独 */
function IconFortress({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <rect x="8" y="8" width="8" height="8" rx="1.5" fill="currentColor" fillOpacity="0.3" strokeWidth="2" />
      <path d="M5 3v2M12 3v2M19 3v2" strokeWidth="2" />
    </SvgShell>
  );
}

/** 比例数独 */
function IconRatio({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3" y="5" width="8" height="14" rx="2" fill="currentColor" fillOpacity="0.08" />
      <rect x="13" y="5" width="8" height="14" rx="2" fill="currentColor" fillOpacity="0.08" />
      <circle cx="12" cy="9.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14.5" r="1.5" fill="currentColor" stroke="none" />
    </SvgShell>
  );
}

/** 无马数独 */
function IconAntiKnight({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <path d="M7 20h10M9 20v-3l-3-4.5 2-4.5h3.5l2 2h3.5v4l-2.5 3v3" fill="currentColor" fillOpacity="0.15" />
      <circle cx="12.5" cy="8" r="1.2" fill="currentColor" stroke="none" />
      <path d="M16 14l2.5 2.5" strokeWidth="2" />
    </SvgShell>
  );
}

function IconFallback({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
    </SvgShell>
  );
}

const BY_VARIANT: Record<
  string,
  (p: { color?: string; className?: string; size?: number }) => ReactElement
> = {
  standard: IconStandard,
  diagonal: IconDiagonal,
  odd_even: IconOddEven,
  killer: IconKiller,
  add_sub: IconAddSub,
  big_small: IconBigSmall,
  greater_than: IconGreaterThan,
  thermometer: IconThermo,
  irregular: IconIrregular,
  consecutive: IconConsecutive,
  sum_56: IconSum56,
  fortress: IconFortress,
  ratio: IconRatio,
  anti_knight: IconAntiKnight,
};

export function PuzzleTypeIcon({ code, className = "", color, withBg = false, size = 22 }: Props) {
  const def = getPuzzleType(code);
  const c = color ?? def?.color ?? "#FF772A";
  const Icon = (def ? BY_VARIANT[def.variantType] : undefined) ?? IconFallback;

  if (withBg) {
    const style: CSSProperties = {
      backgroundColor: `${c}16`,
      color: c,
      width: size + 16,
      height: size + 16,
    };
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-2xl border-1.5 border-ink/20 shadow-[1px_1px_0_var(--color-ink)] ${className}`}
        style={style}
        title={def?.name}
      >
        <Icon color={c} size={size} />
      </span>
    );
  }

  return <Icon color={c} className={className} size={size} />;
}
