/**
 * 题目服务：根据题型生成题目
 * 支持：标准数独（完整生成）、对角线（带约束生成）
 * 其他变体：标准题 + 变体标记
 */
import {
  type GridMetadata,
  type Difficulty,
  type VariantData,
  DEFAULT_META,
  buildStructure,
  generateFullGrid,
  digHoles,
  valBit,
  allMask,
  maskToValues,
  RNG,
} from "../engine";

import type { PuzzleTypeDef } from "../shared/puzzle-types";

// ─── 对角线 peers ───
function computeDiagonalPeers(size: number): number[][] {
  const peers: number[][] = Array.from({ length: size * size }, () => []);
  const main: number[] = [];
  const anti: number[] = [];
  for (let i = 0; i < size; i++) {
    main.push(i * size + i);
    anti.push(i * size + (size - 1 - i));
  }
  for (const cell of main) {
    peers[cell] = [...peers[cell], ...main.filter((c) => c !== cell)];
  }
  for (const cell of anti) {
    peers[cell] = [...peers[cell], ...anti.filter((c) => c !== cell)];
  }
  return peers;
}

/** 带额外 peers 的递归填充 */
function fillCellWithPeers(
  grid: Int8Array,
  struct: ReturnType<typeof buildStructure>,
  pos: number,
  rng: RNG,
  extraPeers?: number[][],
): boolean {
  while (pos < struct.total && grid[pos] !== 0) pos++;
  if (pos >= struct.total) return true;

  let mask = allMask(struct.size);
  for (const p of struct.peers[pos]) {
    if (grid[p] !== 0) mask &= ~valBit(grid[p]);
  }
  if (extraPeers?.[pos]) {
    for (const p of extraPeers[pos]) {
      if (grid[p] !== 0) mask &= ~valBit(grid[p]);
    }
  }

  const candidates = maskToValues(mask);
  rng.shuffle(candidates);

  for (const v of candidates) {
    grid[pos] = v;
    if (fillCellWithPeers(grid, struct, pos + 1, rng, extraPeers)) return true;
    grid[pos] = 0;
  }
  return false;
}

/** 难度 → clue 目标 */
function clueRangeFor(size: number, difficulty: Difficulty): [number, number] {
  const total = size * size;
  const ratio =
    difficulty === "easy" ? 0.55 : difficulty === "medium" ? 0.45 : difficulty === "hard" ? 0.38 : 0.32;
  const mid = Math.round(total * ratio);
  return [Math.max(mid - 3, size), mid + 2];
}

// ─── 变体数据计算 ───

function computeOddEven(solution: Int8Array, size: number, rng: RNG): VariantData {
  const parity = new Int8Array(size * size);
  for (let i = 0; i < size * size; i++) {
    // 随机选择约 40% 的格子标记奇偶
    if (rng.next() < 0.4) {
      parity[i] = solution[i] % 2 === 1 ? 1 : 2; // 1=odd, 2=even
    }
  }
  return { oddEven: { parity } };
}

function computeConsecutive(solution: Int8Array, size: number): VariantData {
  const pairs = new Set<string>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      const val = solution[idx];
      // 右邻居
      if (c + 1 < size) {
        const right = r * size + (c + 1);
        if (Math.abs(val - solution[right]) === 1) {
          pairs.add(`${Math.min(idx, right)}-${Math.max(idx, right)}`);
        }
      }
      // 下邻居
      if (r + 1 < size) {
        const down = (r + 1) * size + c;
        if (Math.abs(val - solution[down]) === 1) {
          pairs.add(`${Math.min(idx, down)}-${Math.max(idx, down)}`);
        }
      }
    }
  }
  return { consecutive: { pairs } };
}

function computeFortress(solution: Int8Array, size: number, rng: RNG): VariantData {
  const grey = new Int8Array(size * size);
  for (let i = 0; i < size * size; i++) {
    // 约定：解中值较大的格子标记为灰格（满足堡垒约束）
    if (solution[i] > size / 2 && rng.next() < 0.5) {
      // 检查是否大于所有正交邻居
      const r = Math.floor(i / size);
      const c = i % size;
      let valid = true;
      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
      ];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (solution[nr * size + nc] >= solution[i]) {
            valid = false;
            break;
          }
        }
      }
      if (valid) grey[i] = 1;
    }
  }
  return { fortress: { grey } };
}

function computeSum56(solution: Int8Array, size: number): VariantData {
  const sums = new Map<string, number>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      const left = r * size + c;
      const right = r * size + (c + 1);
      const s = solution[left] + solution[right];
      if (s === 5 || s === 6) {
        sums.set(`${left}-${right}`, s);
      }
    }
  }
  return { sum56: { sums } };
}

function computeAntiKnight(): VariantData {
  // 无马约束不需要额外数据（约束本身由规则定义）
  return undefined;
}

function computeDiagonal(): VariantData {
  return undefined; // 对角线约束由规则定义，无需额外数据
}

function computeKiller(solution: Int8Array, size: number, rng: RNG): VariantData {
  // 简单策略：随机生成笼子（2-3 格）
  const used = new Set<number>();
  const cages: { cells: number[]; sum: number }[] = [];

  for (let i = 0; i < size * size; i++) {
    if (used.has(i)) continue;
    const cageSize = rng.next() < 0.6 ? 2 : 3;
    const cells = [i];
    used.add(i);
    const r = Math.floor(i / size);
    const c = i % size;

    for (let s = 1; s < cageSize; s++) {
      const candidates = [
        r > 0 ? (r - 1) * size + c : -1,
        r < size - 1 ? (r + 1) * size + c : -1,
        c > 0 ? r * size + (c - 1) : -1,
        c < size - 1 ? r * size + (c + 1) : -1,
      ].filter((x) => x >= 0 && !used.has(x));
      if (candidates.length === 0) break;
      const pick = rng.pick(candidates);
      cells.push(pick);
      used.add(pick);
    }

    const sum = cells.reduce((a, c) => a + solution[c], 0);
    cages.push({ cells, sum });
  }

  return { killer: { cages } };
}

function computeIrregular(size: number, rng: RNG): VariantData {
  // 生成不规则宫：用简单的区域生长算法
  const boxOf = new Int8Array(size * size).fill(-1);
  const numBoxes = size;
  // 种子格
  const seeds = rng.shuffle(Array.from({ length: size * size }, (_, i) => i)).slice(0, numBoxes);
  seeds.forEach((s, i) => {
    boxOf[s] = i;
  });

  let unassigned = size * size - numBoxes;
  let boxCells: number[][] = seeds.map((s, i) => [s]);

  while (unassigned > 0) {
    let progressed = false;
    for (let b = 0; b < numBoxes; b++) {
      if (boxCells[b].length >= size) continue;
      // 找这个宫的邻接空格
      const frontier: number[] = [];
      for (const cell of boxCells[b]) {
        const r = Math.floor(cell / size);
        const c = cell % size;
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            const n = nr * size + nc;
            if (boxOf[n] === -1) frontier.push(n);
          }
        }
      }
      if (frontier.length > 0) {
        const pick = rng.pick(frontier);
        boxOf[pick] = b;
        boxCells[b].push(pick);
        unassigned--;
        progressed = true;
      }
    }
    if (!progressed) {
      // 兜底：把剩余格子分配给最小的宫
      for (let i = 0; i < size * size; i++) {
        if (boxOf[i] === -1) {
          const r = Math.floor(i / size);
          const c = i % size;
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              const b = boxOf[nr * size + nc];
              if (b >= 0) {
                boxOf[i] = b;
                boxCells[b].push(i);
                unassigned--;
                break;
              }
            }
          }
        }
      }
      break;
    }
  }

  return { irregular: { boxOf, boxCells } };
}

// ─── 主生成函数 ───

export interface GeneratedPuzzle {
  givens: number[];
  solution: number[];
  data?: VariantData;
}

export function generatePuzzle(
  typeDef: PuzzleTypeDef,
  difficulty: Difficulty = "medium",
  seed?: number,
): GeneratedPuzzle {
  const meta: GridMetadata = DEFAULT_META[typeDef.gridSize as 4 | 6 | 9];
  const rng = new RNG(seed ?? Date.now() + Math.floor(Math.random() * 100000));
  const struct = buildStructure(meta);
  const variant = typeDef.variantType;

  // 1. 生成完整解
  let fullGrid: Int8Array;
  if (variant === "diagonal") {
    const diagPeers = computeDiagonalPeers(meta.size);
    fullGrid = new Int8Array(struct.total);
    fillCellWithPeers(fullGrid, struct, 0, rng, diagPeers);
  } else {
    fullGrid = generateFullGrid(struct, rng);
  }

  // 2. 计算变体数据
  let data: VariantData | undefined;
  switch (variant) {
    case "odd_even":
      data = computeOddEven(fullGrid, meta.size, rng);
      break;
    case "consecutive":
      data = computeConsecutive(fullGrid, meta.size);
      break;
    case "fortress":
      data = computeFortress(fullGrid, meta.size, rng);
      break;
    case "sum_56":
      data = computeSum56(fullGrid, meta.size);
      break;
    case "killer":
      data = computeKiller(fullGrid, meta.size, rng);
      break;
    case "irregular":
      data = computeIrregular(meta.size, rng);
      break;
    case "anti_knight":
    case "diagonal":
      data = undefined;
      break;
    default:
      data = undefined;
  }

  // 3. 挖洞（变体题用更少的提示数，因为变体约束提供了额外信息）
  let [targetMin, targetMax] = clueRangeFor(meta.size, difficulty);
  if (variant !== "standard") {
    // 变体题可以少 2-4 个提示数
    targetMin = Math.max(targetMin - 3, meta.size);
    targetMax = Math.max(targetMax - 2, meta.size + 1);
  }

  const givens = digHoles(fullGrid, struct, targetMin, targetMax, rng);

  return {
    givens,
    solution: Array.from(fullGrid),
    data,
  };
}
