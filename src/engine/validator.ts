/**
 * 盘面验证器：检查行/列/宫是否有冲突
 */
import type { GridStructure } from "./grid";

/**
 * 检查盘面是否有冲突（已填数字在同行/列/宫中重复）
 * 不要求填满，只检查已有数字不冲突
 */
export function isValid(grid: Int8Array, struct: GridStructure): boolean {
  const size = struct.size;

  for (let i = 0; i < struct.total; i++) {
    if (grid[i] === 0) continue;
    const v = grid[i];
    if (v < 1 || v > size) return false;

    // 检查 peers 中是否有相同值
    for (const p of struct.peers[i]) {
      if (grid[p] === v) return false;
    }
  }
  return true;
}

/**
 * 检查盘面是否完全填满且无冲突（即已正确解出）
 */
export function isSolved(grid: Int8Array, struct: GridStructure): boolean {
  for (let i = 0; i < struct.total; i++) {
    if (grid[i] === 0) return false;
  }
  return isValid(grid, struct);
}

/**
 * 找出所有冲突的格子对
 */
export function findConflicts(grid: Int8Array, struct: GridStructure): [number, number][] {
  const conflicts: [number, number][] = [];
  const seen = new Set<string>();

  for (let i = 0; i < struct.total; i++) {
    if (grid[i] === 0) continue;
    for (const p of struct.peers[i]) {
      if (grid[p] === grid[i]) {
        const key = i < p ? `${i}-${p}` : `${p}-${i}`;
        if (!seen.has(key)) {
          seen.add(key);
          conflicts.push([Math.min(i, p), Math.max(i, p)]);
        }
      }
    }
  }
  return conflicts;
}
