/**
 * 题目服务：根据题型生成高质量、规则严格满足且唯一解的数独题目
 */
import {
  type GridMetadata,
  type Difficulty,
  type VariantData,
  type GridStructure,
  type KillerCage,
  type CalcData,
  type IrregularData,
  DEFAULT_META,
  buildStructure,
  buildIrregularStructure,
  generateFullGrid,
  generateAddSubPuzzle,
  digHoles,
  valBit,
  allMask,
  maskToValues,
  solve,
  solveOne,
  buildVariantSolveOptions,
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

// ─── 马步 peers ───
function computeKnightPeers(size: number): number[][] {
  const peers: number[][] = Array.from({ length: size * size }, () => []);
  const knightOffsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      for (const [dr, dc] of knightOffsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          peers[idx].push(nr * size + nc);
        }
      }
    }
  }
  return peers;
}

/** 带额外 peers 的递归填充 */
function fillCellWithPeers(
  grid: Int8Array,
  struct: GridStructure,
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
function clueRangeFor(size: number, difficulty: Difficulty, variant: string): [number, number] {
  const total = size * size;
  let ratio =
    difficulty === "easy" ? 0.55 : difficulty === "medium" ? 0.44 : difficulty === "hard" ? 0.36 : 0.30;

  if (variant !== "standard") {
    // 变体题目约束更丰富，可减少 10%~20% 提示数
    ratio *= 0.85;
  }

  const mid = Math.round(total * ratio);
  const minClues = Math.max(Math.min(mid - 2, total - 4), Math.max(size - 1, 2));
  const maxClues = Math.min(mid + 2, total - 2);
  return [minClues, Math.max(minClues + 1, maxClues)];
}

// ─── 变体数据生成 ───

function computeOddEven(solution: Int8Array, size: number, rng: RNG): VariantData {
  const parity = new Int8Array(size * size);
  for (let i = 0; i < size * size; i++) {
    if (rng.next() < 0.48) {
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

function computeSum56(solution: Int8Array, size: number): VariantData {
  const sums = new Map<string, number>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      const val = solution[idx];
      // 水平
      if (c + 1 < size) {
        const right = r * size + (c + 1);
        const s = val + solution[right];
        if (s === 5 || s === 6) {
          sums.set(`${Math.min(idx, right)}-${Math.max(idx, right)}`, s);
        }
      }
      // 垂直
      if (r + 1 < size) {
        const down = (r + 1) * size + c;
        const s = val + solution[down];
        if (s === 5 || s === 6) {
          sums.set(`${Math.min(idx, down)}-${Math.max(idx, down)}`, s);
        }
      }
    }
  }
  return { sum56: { sums } };
}

function computeFortress(solution: Int8Array, size: number, rng: RNG): VariantData {
  const grey = new Int8Array(size * size);
  // 找出所有大于所有正交邻居的格子
  const candidates: number[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const i = r * size + c;
      let isLocalMax = true;
      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
      ];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (solution[nr * size + nc] >= solution[i]) {
            isLocalMax = false;
            break;
          }
        }
      }
      if (isLocalMax && solution[i] >= Math.ceil(size / 2)) {
        candidates.push(i);
      }
    }
  }

  // 随机保留部分极大值作为灰格
  rng.shuffle(candidates);
  const count = Math.max(1, Math.min(candidates.length, Math.floor(size * 0.75)));
  for (let i = 0; i < count; i++) {
    grey[candidates[i]] = 1;
  }

  return { fortress: { grey } };
}

function computeBigSmall(solution: Int8Array, size: number): VariantData {
  const half = size / 2;
  const smallValues = Array.from({ length: half }, (_, i) => i + 1);
  const bigValues = Array.from({ length: half }, (_, i) => half + i + 1);
  const grey = new Int8Array(size * size);
  for (let i = 0; i < size * size; i++) {
    grey[i] = solution[i] > half ? 1 : 0;
  }
  return { bigSmall: { grey, bigValues, smallValues } };
}

function computeThermometer(solution: Int8Array, size: number, rng: RNG): VariantData {
  const thermos: { cells: number[] }[] = [];
  const used = new Set<number>();
  const attempts = size <= 4 ? 2 : 3;

  for (let t = 0; t < attempts * 2; t++) {
    if (thermos.length >= attempts) break;
    const start = rng.int(0, size * size - 1);
    if (used.has(start)) continue;

    const path = [start];
    used.add(start);
    let cur = start;

    for (let step = 0; step < size - 1; step++) {
      const r = Math.floor(cur / size);
      const c = cur % size;
      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
      ]
        .filter(([nr, nc]) => nr >= 0 && nr < size && nc >= 0 && nc < size)
        .map(([nr, nc]) => nr * size + nc)
        .filter((n) => !used.has(n) && solution[n] > solution[cur]);

      if (neighbors.length === 0) break;
      const next = rng.pick(neighbors);
      path.push(next);
      used.add(next);
      cur = next;
    }

    if (path.length >= 2) {
      thermos.push({ cells: path });
    }
  }

  return { thermometer: { thermos } };
}

function computeGreaterThan(solution: Int8Array, size: number, rng: RNG): VariantData {
  const horizontal = new Map<string, ">" | "<">();
  const vertical = new Map<string, "^" | "v">();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      if (c + 1 < size && rng.next() < 0.6) {
        const right = r * size + (c + 1);
        horizontal.set(`${r},${c}`, solution[idx] > solution[right] ? ">" : "<");
      }
      if (r + 1 < size && rng.next() < 0.6) {
        const down = (r + 1) * size + c;
        vertical.set(`${r},${c}`, solution[idx] > solution[down] ? "v" : "^");
      }
    }
  }
  return { greaterThan: { horizontal, vertical } };
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

function computeRatio(solution: Int8Array, size: number, rng: RNG): VariantData {
  const ratios = new Map<string, string>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      if (c + 1 < size && rng.next() < 0.45) {
        const right = r * size + (c + 1);
        const a = solution[idx];
        const b = solution[right];
        const g = gcd(a, b);
        ratios.set(`${idx}-${right}`, `${a / g}/${b / g}`);
      }
      if (r + 1 < size && rng.next() < 0.45) {
        const down = (r + 1) * size + c;
        const a = solution[idx];
        const b = solution[down];
        const g = gcd(a, b);
        ratios.set(`${idx}-${down}`, `${a / g}/${b / g}`);
      }
    }
  }
  return { ratio: { ratios } };
}

function computeKiller(solution: Int8Array, size: number, rng: RNG): VariantData {
  const total = size * size;
  const used = new Set<number>();
  const cages: KillerCage[] = [];

  const order = rng.shuffle(Array.from({ length: total }, (_, i) => i));

  for (const start of order) {
    if (used.has(start)) continue;
    const cageSize = rng.next() < 0.7 ? 2 : 3;
    const cells = [start];
    used.add(start);

    for (let s = 1; s < cageSize; s++) {
      const r = Math.floor(cells[cells.length - 1] / size);
      const c = cells[cells.length - 1] % size;
      const candidates = [
        r > 0 ? (r - 1) * size + c : -1,
        r < size - 1 ? (r + 1) * size + c : -1,
        c > 0 ? r * size + (c - 1) : -1,
        c < size - 1 ? r * size + (c + 1) : -1,
      ].filter((x) => x >= 0 && !used.has(x) && !cells.some((existing) => solution[existing] === solution[x]));

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

/** 生成合法的 6 阶不规则 6-omino 连通宫 */
function generateIrregularBoxes(size: number, rng: RNG): { boxOf: Int8Array; boxCells: number[][] } {
  const total = size * size;
  for (let attempt = 0; attempt < 50; attempt++) {
    const boxOf = new Int8Array(total).fill(-1);
    const boxCells: number[][] = Array.from({ length: size }, () => []);

    // 随机分配初始种子
    const seeds = rng.shuffle(Array.from({ length: total }, (_, i) => i)).slice(0, size);
    seeds.forEach((s, idx) => {
      boxOf[s] = idx;
      boxCells[idx].push(s);
    });

    let unassigned = total - size;
    let stuck = false;

    while (unassigned > 0) {
      let expanded = false;
      const order = rng.shuffle(Array.from({ length: size }, (_, i) => i));

      for (const b of order) {
        if (boxCells[b].length >= size) continue;
        const frontier: number[] = [];
        for (const cell of boxCells[b]) {
          const r = Math.floor(cell / size);
          const c = cell % size;
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              const n = nr * size + nc;
              if (boxOf[n] === -1 && !frontier.includes(n)) {
                frontier.push(n);
              }
            }
          }
        }

        if (frontier.length > 0) {
          const pick = rng.pick(frontier);
          boxOf[pick] = b;
          boxCells[b].push(pick);
          unassigned--;
          expanded = true;
          if (unassigned === 0) break;
        }
      }

      if (!expanded) {
        stuck = true;
        break;
      }
    }

    if (!stuck && boxCells.every((b) => b.length === size)) {
      return { boxOf, boxCells };
    }
  }

  // 默认规则阶梯不规则宫兜底
  const fallbackBoxOf = new Int8Array(total);
  const fallbackCells: number[][] = Array.from({ length: size }, () => []);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const b = Math.floor((r * size + c) / size);
      const idx = r * size + c;
      fallbackBoxOf[idx] = b;
      fallbackCells[b].push(idx);
    }
  }
  return { boxOf: fallbackBoxOf, boxCells: fallbackCells };
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
  const variant = typeDef.variantType;

  // 1. 生成满盘结构
  if (variant === "irregular") {
    // 不规则数独：先生成不规则宫，再在此结构上生成满盘
    for (let attempt = 0; attempt < 30; attempt++) {
      const irregularData = generateIrregularBoxes(meta.size, rng);
      const struct = buildIrregularStructure(meta, irregularData.boxOf);
      const fullGrid = new Int8Array(struct.total);
      if (fillCellWithPeers(fullGrid, struct, 0, rng)) {
        const [targetMin, targetMax] = clueRangeFor(meta.size, difficulty, variant);
        const givens = digHoles(fullGrid, struct, targetMin, targetMax, rng);
        return {
          givens,
          solution: Array.from(fullGrid),
          data: { irregular: irregularData },
        };
      }
    }
  }

  const struct = buildStructure(meta);
  let fullGrid: Int8Array;

  if (variant === "diagonal") {
    const diagPeers = computeDiagonalPeers(meta.size);
    fullGrid = new Int8Array(struct.total);
    fillCellWithPeers(fullGrid, struct, 0, rng, diagPeers);
  } else if (variant === "anti_knight") {
    const knightPeers = computeKnightPeers(meta.size);
    fullGrid = new Int8Array(struct.total);
    fillCellWithPeers(fullGrid, struct, 0, rng, knightPeers);
  } else {
    fullGrid = generateFullGrid(struct, rng);
  }

  // 2. 加减数独独立生成
  if (variant === "add_sub") {
    const addSub = generateAddSubPuzzle(fullGrid, meta, rng, difficulty);
    return {
      givens: addSub.givens,
      solution: Array.from(fullGrid),
      data: addSub.data,
    };
  }

  // 3. 计算变体数据
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
    case "big_small":
      data = computeBigSmall(fullGrid, meta.size);
      break;
    case "thermometer":
      data = computeThermometer(fullGrid, meta.size, rng);
      break;
    case "greater_than":
      data = computeGreaterThan(fullGrid, meta.size, rng);
      break;
    case "ratio":
      data = computeRatio(fullGrid, meta.size, rng);
      break;
    default:
      data = undefined;
  }

  // 4. 带变体约束的挖洞
  const solveOpts = buildVariantSolveOptions(variant, meta.size, data);
  const [targetMin, targetMax] = clueRangeFor(meta.size, difficulty, variant);
  const givens = digHoles(fullGrid, struct, targetMin, targetMax, rng, solveOpts);

  return {
    givens,
    solution: Array.from(fullGrid),
    data,
  };
}
