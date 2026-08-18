/**
 * 加减数独：虚线笼内按 + / - 运算得到左上角提示数
 * 减法采用 KenKen 惯例：最大值减去其余数字。
 */
import type { CalcCage, CalcData, CalcOp, Difficulty, GridMetadata, VariantData } from "./types";
import { type GridStructure, allMask, buildStructure, valBit } from "./grid";
import type { ExtraConstraint } from "./solver";
import { solve } from "./solver";
import { RNG } from "./rng";

/** 笼内数字按运算符算出的结果 */
export function evalCalcCage(values: number[], op: CalcOp): number {
  if (values.length === 0) return 0;
  if (op === "+") return values.reduce((a, b) => a + b, 0);
  const sum = values.reduce((a, b) => a + b, 0);
  const max = Math.max(...values);
  return max - (sum - max);
}

export function cageSatisfied(values: number[], cage: CalcCage): boolean {
  if (values.length !== cage.cells.length) return false;
  if (new Set(values).size !== values.length) return false;
  return evalCalcCage(values, cage.op) === cage.target;
}

export function cagesMatchSolution(cages: CalcCage[], solution: ArrayLike<number>): boolean {
  for (const cage of cages) {
    const values = cage.cells.map((c) => solution[c]);
    if (values.some((v) => v === 0) || !cageSatisfied(values, cage)) return false;
  }
  return true;
}

/** 枚举笼内空格还能填哪些数（掩码） */
export function cagePossibleMasks(
  grid: ArrayLike<number>,
  cage: CalcCage,
  size: number,
): Map<number, number> {
  const empty: number[] = [];
  const used = new Set<number>();
  for (const cell of cage.cells) {
    const v = grid[cell];
    if (v === 0) empty.push(cell);
    else used.add(v);
  }

  const masks = new Map<number, number>();
  for (const cell of empty) masks.set(cell, 0);
  if (empty.length === 0) return masks;

  const assigned: number[] = [];
  const walk = (i: number) => {
    if (i === empty.length) {
      const values = [...used, ...assigned];
      if (cageSatisfied(values, { ...cage, cells: cage.cells })) {
        assigned.forEach((v, idx) => {
          masks.set(empty[idx], (masks.get(empty[idx]) ?? 0) | valBit(v));
        });
      }
      return;
    }
    for (let v = 1; v <= size; v++) {
      if (used.has(v) || assigned.includes(v)) continue;
      assigned.push(v);
      walk(i + 1);
      assigned.pop();
    }
  };
  walk(0);
  return masks;
}

export function addSubConstraint(cages: CalcCage[], size: number): ExtraConstraint {
  return {
    eliminations(grid) {
      const elim = new Int32Array(grid.length);
      const full = allMask(size);
      for (const cage of cages) {
        const masks = cagePossibleMasks(grid, cage, size);
        for (const cell of cage.cells) {
          if (grid[cell] !== 0) continue;
          const allowed = masks.get(cell) ?? 0;
          elim[cell] |= full & ~allowed;
        }
      }
      return elim;
    },
  };
}

function orthoNeighbors(cell: number, size: number): number[] {
  const r = Math.floor(cell / size);
  const c = cell % size;
  const out: number[] = [];
  if (r > 0) out.push((r - 1) * size + c);
  if (r < size - 1) out.push((r + 1) * size + c);
  if (c > 0) out.push(r * size + (c - 1));
  if (c < size - 1) out.push(r * size + (c + 1));
  return out;
}

function growCages(
  solution: Int8Array,
  size: number,
  rng: RNG,
  coverage: number,
  tripleChance: number,
): CalcCage[] {
  const total = size * size;
  const used = new Set<number>();
  const cages: CalcCage[] = [];
  const order = rng.shuffle(Array.from({ length: total }, (_, i) => i));

  for (const start of order) {
    if (used.has(start)) continue;
    if (rng.next() > coverage) {
      used.add(start);
      continue;
    }

    const want = rng.next() < tripleChance ? 3 : 2;
    const cells = [start];
    used.add(start);

    while (cells.length < want) {
      const frontier: number[] = [];
      for (const cell of cells) {
        for (const n of orthoNeighbors(cell, size)) {
          if (!used.has(n)) frontier.push(n);
        }
      }
      if (frontier.length === 0) break;
      const pick = rng.pick(frontier);
      cells.push(pick);
      used.add(pick);
    }

    if (cells.length < 2) continue;

    const values = cells.map((c) => solution[c]);
    const sum = values.reduce((a, b) => a + b, 0);
    const diff = evalCalcCage(values, "-");
    let op: CalcOp = "+";
    if (diff >= 1 && new Set(values).size === values.length) {
      op = cells.length >= 3 ? (rng.next() < 0.25 ? "-" : "+") : rng.next() < 0.48 ? "-" : "+";
    }
    cages.push({ cells, target: op === "+" ? sum : diff, op });
  }

  return cages;
}

function sameGrid(a: ArrayLike<number>, b: ArrayLike<number>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function countSolutionsWithCages(
  givens: Int8Array,
  struct: GridStructure,
  cages: CalcCage[],
  maxSolutions: number,
): number {
  const extra = addSubConstraint(cages, struct.size);
  return solve(givens, struct, { maxSolutions, extraConstraint: extra }).solutions.length;
}

function addGivensUntilUnique(
  solution: Int8Array,
  cages: CalcCage[],
  struct: GridStructure,
  rng: RNG,
  minClues: number,
  maxClues: number,
): number[] | null {
  const givens = new Int8Array(struct.total);
  const order = rng.shuffle(Array.from({ length: struct.total }, (_, i) => i));
  let clues = 0;

  const uniqueEnough = () => {
    if (clues < minClues) return false;
    return countSolutionsWithCages(givens, struct, cages, 2) === 1;
  };

  if (minClues === 0 && uniqueEnough()) {
    return Array.from(givens);
  }

  for (const cell of order) {
    if (clues >= maxClues) break;
    givens[cell] = solution[cell];
    clues++;
    if (uniqueEnough()) return Array.from(givens);
  }

  if (countSolutionsWithCages(givens, struct, cages, 2) === 1) {
    return Array.from(givens);
  }
  return null;
}

export interface GeneratedAddSub {
  givens: number[];
  data: VariantData;
}

/**
 * 从完整解生成加减数独：先铺虚线笼，再按难度补少量已知数，保证唯一解。
 */
export function generateAddSubPuzzle(
  solution: Int8Array,
  meta: GridMetadata,
  rng: RNG,
  difficulty: Difficulty = "medium",
): GeneratedAddSub {
  const struct = buildStructure(meta);
  const coverage = difficulty === "easy" ? 0.62 : difficulty === "medium" ? 0.78 : 0.88;
  const tripleChance = difficulty === "easy" ? 0.06 : difficulty === "medium" ? 0.16 : 0.22;
  const minClues = difficulty === "easy" ? 3 : difficulty === "medium" ? 0 : 0;
  const maxClues = difficulty === "easy" ? 6 : difficulty === "medium" ? 3 : 2;

  for (let attempt = 0; attempt < 48; attempt++) {
    const cages = growCages(solution, meta.size, rng, coverage, tripleChance);
    if (cages.length < 3) continue;
    if (!cagesMatchSolution(cages, solution)) continue;

    const extra = addSubConstraint(cages, meta.size);
    const empty = new Int8Array(struct.total);
    const probe = solve(empty, struct, { maxSolutions: 2, extraConstraint: extra });

    // 空盘唯一且就是这套解
    if (probe.solutions.length === 1 && sameGrid(probe.solutions[0], solution)) {
      if (minClues === 0) {
        return { givens: Array.from(empty), data: { addSub: { cages } } };
      }
    }

    const givens = addGivensUntilUnique(solution, cages, struct, rng, minClues, maxClues);
    if (!givens) continue;

    const check = solve(Int8Array.from(givens), struct, {
      maxSolutions: 2,
      extraConstraint: extra,
    });
    if (check.solutions.length === 1 && sameGrid(check.solutions[0], solution)) {
      return { givens, data: { addSub: { cages } } };
    }
  }

  // 兜底：多铺加法笼 + 若干已知数
  const cages = growCages(solution, meta.size, rng, 0.95, 0.1).map((cage) => {
    const values = cage.cells.map((c) => solution[c]);
    return { ...cage, op: "+" as CalcOp, target: evalCalcCage(values, "+") };
  });
  const fallback =
    addGivensUntilUnique(solution, cages, struct, rng, Math.max(minClues, 4), struct.size) ??
    Array.from(solution).map((v, i) => (i % 3 === 0 ? v : 0));
  return { givens: fallback, data: { addSub: { cages } } };
}

export function calcDataFromRaw(raw: unknown): CalcData | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const cages = (raw as { cages?: unknown }).cages;
  if (!Array.isArray(cages)) return undefined;
  return {
    cages: cages.map((c) => ({
      cells: Array.isArray(c.cells) ? c.cells.map(Number) : [],
      target: Number(c.target),
      op: c.op === "-" ? "-" : "+",
    })),
  };
}
