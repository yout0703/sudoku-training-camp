/**
 * 0703 Studio · 精致工坊风矢量图标库
 * 统一双色层次（Duotone）、2px 柔和圆角线条与纯正工坊设计语言
 */

const SW = 2;

export function IconHome({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m3 10.5 9-7.5 9 7.5v9a2 2 0 0 1-2 2h-4a1 1 0 0 1-1-1v-5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v5a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-9Z" />
      <path d="M9 3.5v2.5" opacity="0.4" />
    </svg>
  );
}

export function IconGrid({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" fill="currentColor" fillOpacity="0.12" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

export function IconUser({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="7.5" r="4" fill="currentColor" fillOpacity="0.15" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function IconBack({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function IconRefresh({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 12A8 8 0 1 1 17.65 6.35L20 8.5" />
      <path d="M20 3.5v5h-5" />
    </svg>
  );
}

export function IconUndo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

export function IconRedo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
  );
}

export function IconStar({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.1l-6 3.3 1.3-6.7-5-4.7 6.8-.8L12 2Z" />
    </svg>
  );
}

export function IconFlame({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2c1 3-1 5.5-2 7.5-1 2-1 4 0 5.5.5-1.5 1.5-2.5 3-3 0 4 3 6.5 3 9.5 0 1.5-.5 2.5-1.5 3.5 4.5-1 6.5-5 6.5-8.5 0-4-3-7.5-5-10-1-1.2-2-3-4-4.5Z" opacity="0.35" />
      <path d="M12 22c4.5 0 7-3.5 7-7.5 0-3.5-2-6-4-8-1 2-2 3.5-3.5 4.5-.5-2-1.5-4-3.5-6-1.5 3.5-4 6.5-4 10 0 4 3 7 8 7Z" fill="currentColor" />
    </svg>
  );
}

export function IconCheck({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function IconPencil({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 4.5l5.5 5.5" />
      <path d="M4 20l4-1 11.5-11.5a2.12 2.12 0 0 0-3-3L5 16l-1 4Z" fill="currentColor" fillOpacity="0.15" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

export function IconEraser({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m7 21-4.5-4.5a2.12 2.12 0 0 1 0-3L14 2l7 7-8.5 8.5" fill="currentColor" fillOpacity="0.12" />
      <path d="M2.5 21h19" />
      <path d="m8.5 7.5 7 7" />
    </svg>
  );
}

export function IconTrophy({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 4h10v6a5 5 0 0 1-10 0V4Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M7 6H4a2 2 0 0 0 2 4h1" />
      <path d="M17 6h3a2 2 0 0 1-2 4h-1" />
      <path d="M12 15v4M8 21h8" />
    </svg>
  );
}

export function IconPlay({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 4.5v15l12-7.5L7 4.5Z" />
    </svg>
  );
}

export function IconSparkle({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5" />
    </svg>
  );
}

/** 本地保存 / 存储图标 */
export function IconSave({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" fill="currentColor" fillOpacity="0.1" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

/** 云端同步图标 */
export function IconCloud({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="currentColor" fillOpacity="0.12" />
    </svg>
  );
}

/** 计时时钟图标 */
export function IconClock({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.08" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/** 靶心目标图标 */
export function IconTarget({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.15" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** 提示灯泡图标 */
export function IconLightbulb({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18h6M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A6 6 0 1 0 7.5 11.5c.76.76 1.23 1.52 1.41 2.5h6.18Z" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

/** 图表统计图标 */
export function IconChart({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

/** 规则说明信息 i 图标 */
export function IconInfo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.15" />
      <path d="M12 8h.01M11 12h1v4h1" strokeWidth={2.2} />
    </svg>
  );
}

/** 拼图图标 */
export function IconPuzzle({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19.5 12h-2.5a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2.5a1.5 1.5 0 0 0 1.5-1.5v-2A1.5 1.5 0 0 0 19.5 3h-2a1.5 1.5 0 0 0-1.5 1.5v2.5a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4.5A1.5 1.5 0 0 0 10.5 3h-2A1.5 1.5 0 0 0 7 4.5v2A1.5 1.5 0 0 0 8.5 8H11a2 2 0 0 1 2 2 2 2 0 0 1-2 2H8.5A1.5 1.5 0 0 0 7 13.5v2A1.5 1.5 0 0 0 8.5 17h2a1.5 1.5 0 0 0 1.5-1.5v-2.5a2 2 0 0 1 2-2 2 2 0 0 1 2 2v2.5a1.5 1.5 0 0 0 1.5 1.5h2a1.5 1.5 0 0 0 1.5-1.5v-2a1.5 1.5 0 0 0-1.5-1.5Z" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}
