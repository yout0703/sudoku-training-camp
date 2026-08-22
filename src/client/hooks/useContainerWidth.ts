/**
 * 监听容器宽度与视口尺寸，用于盘面在手机 / 平板 / PC 等设备下的自适应计算
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
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
      window.removeEventListener("resize", measure);
    };
  }, [ref]);

  return width;
}

/**
 * 根据盘面阶数与可用容器尺寸，动态计算最佳格子边长
 * 兼顾小屏手机（320px~390px）、iPad 与桌面大屏
 */
export function computeCellSize(gridSize: number, availableWidth: number): number {
  const usable = Math.max(availableWidth - 8, 120);
  const rawByWidth = Math.floor(usable / gridSize);

  // 手机与平板自适应界限
  const isWide = typeof window !== "undefined" && window.innerWidth >= 768;
  const isLandscape = typeof window !== "undefined" && window.innerWidth > window.innerHeight && window.innerHeight < 550;

  // 移动端根据视口高度做自适应上限，防止手机单屏被挤出
  let maxCellHeight = 999;
  if (typeof window !== "undefined" && !isWide) {
    const vh = window.innerHeight;
    if (isLandscape) {
      maxCellHeight = Math.floor((vh - 120) / gridSize);
    } else {
      // 竖屏手机：顶部栏(约90px) + 规则(约70px) + 键盘(约200px) + 边距(约40px) = 约 400px
      // 剩余高度分配给盘面
      const spaceForGrid = Math.max(260, vh - 380);
      maxCellHeight = Math.floor(spaceForGrid / gridSize);
    }
  }

  const min = gridSize <= 4 ? 42 : gridSize <= 6 ? 34 : 28;
  const max = isWide
    ? gridSize <= 4
      ? 96
      : gridSize <= 6
      ? 76
      : 56
    : gridSize <= 4
    ? 76
    : gridSize <= 6
    ? 56
    : 42;

  const boundedByWidth = Math.max(min, Math.min(max, rawByWidth));
  const finalSize = Math.max(min, Math.min(boundedByWidth, maxCellHeight));

  return finalSize;
}
