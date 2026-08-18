/**
 * 题型统一 SVG 图标
 * stroke 1.75、圆角语言与 Icons.tsx 一致；可用 color 上色
 */
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { getPuzzleType } from "../../../shared/puzzle-types";

const S = 1.75;

type Props = {
  code: string;
  className?: string;
  /** 覆盖颜色；默认用题型 color */
  color?: string;
  /** 外层方块底色（浅色 chip） */
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
      strokeWidth={S}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** 标准 n 宫：宫格线 */
function IconStandard({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9.5 3.5v17M14.5 3.5v17" />
    </SvgShell>
  );
}

function IconDiagonal({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9.5 3.5v17M14.5 3.5v17" opacity="0.35" />
      <path d="M5 5l14 14M19 5 5 19" />
    </SvgShell>
  );
}

function IconOddEven({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <circle cx="8.5" cy="12" r="4" />
      <rect x="13.5" y="8" width="7" height="8" rx="1.5" />
    </SvgShell>
  );
}

function IconAddSub({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="2.5 2" />
      <path d="M8 10h4M10 8v4M14 14h3" />
    </SvgShell>
  );
}

function IconKiller({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="2.5 2" />
      <path d="M7 8h3M7 11h5" strokeWidth="2" />
    </SvgShell>
  );
}

function IconBigSmall({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M12 3.5v17" />
      <path d="M6.5 14.5h3M15 9.5h3" strokeWidth="2.2" />
    </SvgShell>
  );
}

function IconGreaterThan({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <path d="M8 6l8 6-8 6" />
      <path d="M16 6l-8 6 8 6" opacity="0.35" />
    </SvgShell>
  );
}

function IconThermo({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <circle cx="8" cy="16" r="3.5" />
      <path d="M8 12.5V6.5a2.5 2.5 0 0 1 5 0v3" />
      <path d="M13 9.5h3.5a2 2 0 0 1 0 4H15" />
    </SvgShell>
  );
}

function IconIrregular({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <path d="M4 7.5 8 4h6l4 3.5v5L14 20H8L4 15.5z" />
      <path d="M8 4v16M14 4v16M4 10h16" opacity="0.4" />
    </SvgShell>
  );
}

function IconConsecutive({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M12 6v12" strokeWidth="3" />
      <path d="M6 12h12" strokeWidth="3" opacity="0.35" />
    </SvgShell>
  );
}

function IconSum56({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M9 12h6M12 9v6" />
    </SvgShell>
  );
}

function IconFortress({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <path d="M5 20V9l2-2h2l1 2h4l1-2h2l2 2v11z" />
      <path d="M9 20v-5h6v5" />
    </SvgShell>
  );
}

function IconRatio({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <circle cx="8" cy="8" r="2" />
      <circle cx="16" cy="16" r="2" />
      <path d="M7 17 17 7" />
    </SvgShell>
  );
}

function IconAntiKnight({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <path d="M7 19h10M9 19v-3l-3-5 2-4h3l2 2h3v4l-2 3v3" />
      <circle cx="12" cy="7" r="1.2" fill="currentColor" stroke="none" />
      <path d="M5 5l14 14" opacity="0.5" />
    </SvgShell>
  );
}

function IconFallback({ color, className, size }: { color?: string; className?: string; size?: number }) {
  return (
    <SvgShell color={color} className={className} size={size}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
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

const BY_CODE: Record<
  string,
  (p: { color?: string; className?: string; size?: number }) => ReactElement
> = {};

export function PuzzleTypeIcon({ code, className = "", color, withBg = false, size = 22 }: Props) {
  const def = getPuzzleType(code);
  const c = color ?? def?.color ?? "#0d9488";
  const Icon =
    BY_CODE[code] ??
    (def ? BY_VARIANT[def.variantType] : undefined) ??
    IconFallback;

  if (withBg) {
    const style: CSSProperties = {
      backgroundColor: `${c}18`,
      color: c,
      width: size + 16,
      height: size + 16,
    };
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-xl ${className}`}
        style={style}
        title={def?.name}
      >
        <Icon color={c} size={size} />
      </span>
    );
  }

  return <Icon color={c} className={className} size={size} />;
}
