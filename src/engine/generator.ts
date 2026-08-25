/**
 * 数独题目生成器
 * 算法：生成完整解 → 随机挖洞（保证唯一解）→ 按难度控制空格数
 */
import type { GenerateOptions, Difficulty, GridMetadata } from "./types";
import { type GridStructure, buildStructure, allMask, valBit, popcount } from "./grid";
import { solve, type SolveOptions } from "./solver";
import { RNG } from "./rng";

/** 各尺寸 + 难度对应的目标提示数（clues） */
const CLUE_TARGETS: Record<number, Record<Difficulty, [number, number]>> = {
  4: { easy: [9, 11], medium: [7, 8], hard: [5, 6], expert: [4, 5] },
  6: { easy: [22, 26], medium: [17, 21], hard: [13, 16], expert: [10, 12] },
  9: { easy: [42, 50], medium: [34, 40], hard: [28, 33], expert: [24, 27] },
};

/** 获取某尺寸+难度的目标 clue 数范围 */
function clueRange(size: number, difficulty: Difficulty): [number, number] {
  const table = CLUE_TARGETS[size];
  if (table) return table[difficulty];
  // 默认：保留约 45% 的格子
  const total = size * size;
  const ratio = difficulty === "easy" ? 0.6 : difficulty === "medium" ? 0.5 : difficulty === "hard" ? 0.4 : 0.33;
  const mid = Math.round(total * ratio);
  return [mid - 2, mid + 2];
}

/** 获取某格子当前可填的有效值列表 */
function getValidValues(grid: Int8Array, struct: GridStructure, cell: number): number[] {
  const used = 0;
  let mask = allMask(struct.size);
  for (const p of struct.peers[cell]) {
    if (grid[p] !== 0) {
      mask &= ~valBit(grid[p]);
    }
  }
  const vals: number[] = [];
  for (let v = 1; v <= struct.size; v++) {
    if (mask & valBit(v)) vals.push(v);
  }
  return vals;
}

/**
 * 递归回溯生成完整解
 * 使用 cell-by-cell 顺序填充，候选随机化
 */
export function generateFullGrid(struct: GridStructure, rng: RNG): Int8Array {
  const grid = new Int8Array(struct.total);
  fillCell(grid, struct, 0, rng);
  return grid;
}

function fillCell(grid: Int8Array, struct: GridStructure, pos: number, rng: RNG): boolean {
  // 跳过已填格子
  while (pos < struct.total && grid[pos] !== 0) pos++;
  if (pos >= struct.total) return true;

  const candidates = getValidValues(grid, struct, pos);
  rng.shuffle(candidates);

  for (const v of candidates) {
    grid[pos] = v;
    if (fillCell(grid, struct, pos + 1, rng)) return true;
    grid[pos] = 0;
  }
  return false;
}

/**
 * 从完整解中挖洞，生成题目
 * 每次移除一个格子，检查唯一解，不满足则回填
 */
export function digHoles(
  solution: Int8Array,
  struct: GridStructure,
  targetMin: number,
  targetMax: number,
  rng: RNG,
  solveOpts?: SolveOptions,
): number[] {
  const total = struct.total;
  const puzzle = new Int8Array(solution); // 复制完整解
  const order = Array.from({ length: total }, (_, i) => i);
  rng.shuffle(order);

  let clues = total;

  for (const cell of order) {
    if (clues <= targetMin) break;
    if (puzzle[cell] === 0) continue;

    const backup = puzzle[cell];
    puzzle[cell] = 0;

    // 检查唯一解
    const result = solve(puzzle, struct, { maxSolutions: 2, ...solveOpts });

    if (result.solutions.length === 1) {
      clues--; // 移除成功
    } else {
      puzzle[cell] = backup; // 回填，保持唯一解
    }
  }

  return Array.from(puzzle);
}

/**
 * 生成一道数独题
 * @returns { givens: number[], solution: number[] }
 */
export function generate(
  meta: GridMetadata,
  opts: GenerateOptions = {},
): { givens: number[]; solution: number[] } {
  const rng = new RNG(opts.seed);
  const struct = buildStructure(meta);

  // 生成完整解
  const solution = generateFullGrid(struct, rng);

  // 计算目标 clue 数
  const [targetMin, targetMax] = opts.clueCount
    ? [opts.clueCount, opts.clueCount]
    : clueRange(meta.size, opts.difficulty ?? "medium");

  // 挖洞
  const givens = digHoles(solution, struct, targetMin, targetMax, rng);

  return {
    givens,
    solution: Array.from(solution),
  };
}

/**
 * 批量生成题目
 */
export function generateBatch(
  meta: GridMetadata,
  count: number,
  opts: GenerateOptions = {},
): { givens: number[]; solution: number[] }[] {
  const results: { givens: number[]; solution: number[] }[] = [];
  let seed = opts.seed ?? Date.now();

  for (let i = 0; i < count; i++) {
    results.push(generate(meta, { ...opts, seed: seed + i }));
  }
  return results;
}
