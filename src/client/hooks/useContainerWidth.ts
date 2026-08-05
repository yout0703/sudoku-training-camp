/**
 * 监听容器宽度，用于盘面等流体布局
 */
import { useEffect, useState, type RefObject } from "react";

export function useContainerWidth(ref: RefObject<HTMLElement | null>, fallback = 320): number {
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setWidth(w);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, [ref]);

  return width;
}

/** 根据盘面阶数与可用宽度计算格子边长 */
export function computeCellSize(gridSize: number, availableWidth: number): number {
  // 外框约 6px
  const usable = Math.max(availableWidth - 8, 120);
  const raw = Math.floor(usable / gridSize);

  // 手机 / 平板不同上限，保证 9×9 也能点得着
  const isWide = typeof window !== "undefined" && window.innerWidth >= 768;
  const min = gridSize <= 4 ? 44 : gridSize <= 6 ? 36 : 30;
  const max = isWide
    ? gridSize <= 4
      ? 96
      : gridSize <= 6
        ? 78
        : 58
    : gridSize <= 4
      ? 76
      : gridSize <= 6
        ? 58
        : 42;

  return Math.max(min, Math.min(max, raw));
}
