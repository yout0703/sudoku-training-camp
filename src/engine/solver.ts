/**
 * 数独求解器
 * 约束传播（唯一数 + 隐性数）+ 回溯（MRV 启发式）
 * 支持自定义 unit（对角线、额外区域等）和额外约束回调（无马、堡垒等）
 */
import type { GridMetadata, SolveStep } from "./types";
import {
  type GridStructure,
  allMask,
  valBit,
  popcount,
  maskToValues,
  cloneGrid,
} from "./grid";

export interface ExtraConstraint {
  /** 给定当前盘面，返回 cell → 额外需排除的候选掩码（bitmask，与 cands 相同） */
  eliminations: (grid: Int8Array, struct: GridStructure) => ArrayLike<number> | null;
}

export interface SolveOptions {
  /** 最大解的数量（用于唯一性检查，默认 1） */
  maxSolutions?: number;
  /** 额外 unit（对角线等） */
  extraUnits?: number[][];
  /** 额外约束（无马、堡垒等） */
  extraConstraint?: ExtraConstraint;
  /** 是否记录解题步骤 */
  recordSteps?: boolean;
}

export interface SolverResult {
  solutions: Int8Array[];
  isUnique: boolean;
  steps: SolveStep[];
}

/** 初始化候选掩码数组 */
function initCandidates(grid: Int8Array, struct: GridStructure, size: number): Int32Array {
  const cands = new Int32Array(struct.total);
  const full = allMask(size);

  for (let i = 0; i < struct.total; i++) {
    cands[i] = grid[i] === 0 ? full : 0;
  }

  // 排除同行同列同宫已填的数字
  for (let i = 0; i < struct.total; i++) {
    if (grid[i] !== 0) continue;
    for (const p of struct.peers[i]) {
      if (grid[p] !== 0) {
        cands[i] &= ~valBit(grid[p]);
      }
    }
  }
  return cands;
}

/**
 * 单次约束传播，返回是否有变化
 * 包含：唯一数（naked single）+ 隐性数（hidden single）
 */
function propagate(
  grid: Int8Array,
  cands: Int32Array,
  struct: GridStructure,
  units: number[][],
  extra?: ExtraConstraint,
  steps?: SolveStep[],
): boolean {
  const size = struct.size;
  let changed = false;

  // ── 额外约束候选消除 ──
  if (extra) {
    const elim = extra.eliminations(grid, struct);
    if (elim) {
      for (let i = 0; i < struct.total; i++) {
        if (grid[i] !== 0) continue;
        const before = cands[i];
        cands[i] &= ~elim[i];
        if (cands[i] !== before) changed = true;
      }
    }
  }

  // ── 唯一数（naked single）──
  for (let i = 0; i < struct.total; i++) {
    if (grid[i] !== 0) continue;
    if (cands[i] === 0) continue; // 矛盾，稍后处理
    if (popcount(cands[i]) === 1) {
      const v = maskToValues(cands[i])[0];
      grid[i] = v;
      cands[i] = 0;
      eliminatePeers(grid, cands, struct, i, v);
      changed = true;
      steps?.push({
        technique: "唯一数",
        cell: i,
        value: v,
        description: `第${Math.floor(i / size) + 1}行第${(i % size) + 1}列只能填${v}`,
      });
    }
  }

  // ── 隐性数（hidden single）：一个 unit 内某数只能填一个位置 ──
  for (const unit of units) {
    for (let v = 1; v <= size; v++) {
      const bit = valBit(v);
      let count = 0;
      let pos = -1;
      let alreadyPlaced = false;
      for (const cell of unit) {
        if (grid[cell] === v) {
          alreadyPlaced = true;
          break;
        }
        if (grid[cell] === 0 && (cands[cell] & bit)) {
          count++;
          pos = cell;
        }
      }
      if (alreadyPlaced) continue;
      if (count === 1 && grid[pos] === 0) {
        grid[pos] = v;
        cands[pos] = 0;
        eliminatePeers(grid, cands, struct, pos, v);
        changed = true;
        steps?.push({
          technique: "隐性数",
          cell: pos,
          value: v,
          description: `第${Math.floor(pos / size) + 1}行第${(pos % size) + 1}列填${v}（隐性数）`,
        });
      }
    }
  }

  return changed;
}

/** 填入一个值后，从 peers 的候选中消除该值 */
function eliminatePeers(
  grid: Int8Array,
  cands: Int32Array,
  struct: GridStructure,
  cell: number,
  value: number,
): void {
  const bit = valBit(value);
  for (const p of struct.peers[cell]) {
    if (grid[p] === 0) {
      cands[p] &= ~bit;
    }
  }
}

/**
 * 深度优先搜索（MRV 启发式）
 */
function search(
  grid: Int8Array,
  cands: Int32Array,
  struct: GridStructure,
  units: number[][],
  maxSolutions: number,
  solutions: Int8Array[],
  extra?: ExtraConstraint,
  steps?: SolveStep[],
): void {
  if (solutions.length >= maxSolutions) return;

  // 约束传播直到稳定
  let changed = true;
  while (changed) {
    changed = propagate(grid, cands, struct, units, extra, steps);
  }

  // 检查矛盾：有空格但候选为 0
  for (let i = 0; i < struct.total; i++) {
    if (grid[i] === 0 && cands[i] === 0) return; // 死路
  }

  // 检查是否已解完
  let solved = true;
  for (let i = 0; i < struct.total; i++) {
    if (grid[i] === 0) {
      solved = false;
      break;
    }
  }
  if (solved) {
    solutions.push(cloneGrid(grid));
    return;
  }

  // MRV：找候选最少的格子
  let bestCell = -1;
  let bestCount = 99;
  for (let i = 0; i < struct.total; i++) {
    if (grid[i] !== 0) continue;
    const cnt = popcount(cands[i]);
    if (cnt < bestCount) {
      bestCount = cnt;
      bestCell = i;
      if (cnt === 2) break; // 最少也是 2
    }
  }

  if (bestCell === -1) return;

  // 尝试每个候选值
  const values = maskToValues(cands[bestCell]);
  for (const v of values) {
    if (solutions.length >= maxSolutions) return;

    const newGrid = cloneGrid(grid);
    const newCands = new Int32Array(cands);
    newGrid[bestCell] = v;
    newCands[bestCell] = 0;
    eliminatePeers(newGrid, newCands, struct, bestCell, v);

    steps?.push({
      technique: "试探",
      cell: bestCell,
      value: v,
      description: `假设第${Math.floor(bestCell / struct.size) + 1}行第${(bestCell % struct.size) + 1}列填${v}`,
    });

    search(newGrid, newCands, struct, units, maxSolutions, solutions, extra, steps);
  }
}

/**
 * 主求解入口
 */
export function solve(
  grid: Int8Array,
  struct: GridStructure,
  opts: SolveOptions = {},
): SolverResult {
  const { maxSolutions = 1, extraUnits, extraConstraint, recordSteps } = opts;
  const size = struct.size;
  const units = extraUnits ? [...struct.units, ...extraUnits] : struct.units;

  const workGrid = cloneGrid(grid);
  const cands = initCandidates(workGrid, struct, size);

  const steps: SolveStep[] = recordSteps ? [] : [];
  const solutions: Int8Array[] = [];

  search(workGrid, cands, struct, units, maxSolutions, solutions, extraConstraint, recordSteps ? steps : undefined);

  return {
    solutions,
    isUnique: solutions.length === 1,
    steps,
  };
}

/**
 * 求一个解（不需要唯一性），返回解或 null
 */
export function solveOne(
  grid: Int8Array,
  struct: GridStructure,
  opts: Omit<SolveOptions, "maxSolutions"> = {},
): Int8Array | null {
  const result = solve(grid, struct, { ...opts, maxSolutions: 1 });
  return result.solutions[0] ?? null;
}

/**
 * 检查是否有唯一解
 */
export function hasUniqueSolution(
  grid: Int8Array,
  struct: GridStructure,
  opts: Omit<SolveOptions, "maxSolutions"> = {},
): boolean {
  const result = solve(grid, struct, { ...opts, maxSolutions: 2 });
  return result.solutions.length === 1;
}

/**
 * 统计解的数量（最多 maxCount 个）
 */
export function countSolutions(
  grid: Int8Array,
  struct: GridStructure,
  maxCount = 2,
  opts: Omit<SolveOptions, "maxSolutions"> = {},
): number {
  const result = solve(grid, struct, { ...opts, maxSolutions: maxCount });
  return result.solutions.length;
}
