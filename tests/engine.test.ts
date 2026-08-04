/**
 * 引擎核心测试：求解器 + 生成器 + 验证器
 */
import { describe, test, expect } from "bun:test";
import {
  DEFAULT_META,
  buildStructure,
  solve,
  solveOne,
  hasUniqueSolution,
  generate,
  isValid,
  isSolved,
} from "../src/engine";

// ─── 辅助：从字符串构建盘面 ───
function gridFromString(str: string): Int8Array {
  const clean = str.replace(/[^0-9.]/g, "");
  const arr = [...clean].map((c) => (c === "." ? 0 : parseInt(c)));
  return Int8Array.from(arr);
}

// ─── 经典 9×9 测试用例 ───
const TEST_9x9 = `
  5 3 . . 7 . . . .
  6 . . 1 9 5 . . .
  . 9 8 . . . . 6 .
  8 . . . 6 . . . 3
  4 . . 8 . 3 . . 1
  7 . . . 2 . . . 6
  . 6 . . . . 2 8 .
  . . . 4 1 9 . . 5
  . . . . 8 . . 7 9
`;

const TEST_9x9_SOLUTION = `
  5 3 4 6 7 8 9 1 2
  6 7 2 1 9 5 3 4 8
  1 9 8 3 4 2 5 6 7
  8 5 9 7 6 1 4 2 3
  4 2 6 8 5 3 7 9 1
  7 1 3 9 2 4 8 5 6
  9 6 1 5 3 7 2 8 4
  2 8 7 4 1 9 6 3 5
  3 4 5 2 8 6 1 7 9
`;

describe("Grid Structure", () => {
  test("4×4 structure has correct units", () => {
    const meta = DEFAULT_META[4];
    const struct = buildStructure(meta);
    expect(struct.size).toBe(4);
    expect(struct.total).toBe(16);
    expect(struct.rows).toHaveLength(4);
    expect(struct.cols).toHaveLength(4);
    expect(struct.boxes).toHaveLength(4);
    // 每个宫 4 个格子
    for (const box of struct.boxes) {
      expect(box).toHaveLength(4);
    }
  });

  test("9×9 peers count", () => {
    const struct = buildStructure(DEFAULT_META[9]);
    // 每格 peers = (9-1)*3 - overlaps = 20
    expect(struct.peers[0]).toHaveLength(20);
    expect(struct.peers[40]).toHaveLength(20);
  });

  test("6×6 box structure (2×3)", () => {
    const struct = buildStructure(DEFAULT_META[6]);
    expect(struct.boxes).toHaveLength(6);
    for (const box of struct.boxes) {
      expect(box).toHaveLength(6);
    }
  });
});

describe("Solver", () => {
  test("solves classic 9×9", () => {
    const struct = buildStructure(DEFAULT_META[9]);
    const grid = gridFromString(TEST_9x9);
    const result = solve(grid, struct, { maxSolutions: 1 });
    expect(result.solutions).toHaveLength(1);
    const expected = gridFromString(TEST_9x9_SOLUTION);
    expect([...result.solutions[0]]).toEqual([...expected]);
  });

  test("detects unique solution", () => {
    const struct = buildStructure(DEFAULT_META[9]);
    const grid = gridFromString(TEST_9x9);
    expect(hasUniqueSolution(grid, struct)).toBe(true);
  });

  test("solves empty 4×4 (generates valid grid)", () => {
    const struct = buildStructure(DEFAULT_META[4]);
    const empty = new Int8Array(16);
    const sol = solveOne(empty, struct);
    expect(sol).not.toBeNull();
    expect(isSolved(sol!, struct)).toBe(true);
  });

  test("solves empty 6×6", () => {
    const struct = buildStructure(DEFAULT_META[6]);
    const empty = new Int8Array(36);
    const sol = solveOne(empty, struct);
    expect(sol).not.toBeNull();
    expect(isSolved(sol!, struct)).toBe(true);
  });

  test("returns null for unsolvable puzzle", () => {
    const struct = buildStructure(DEFAULT_META[4]);
    // 第一行全填 1（冲突）
    const grid = new Int8Array(16);
    grid[0] = 1; grid[1] = 1;
    const result = solve(grid, struct, { maxSolutions: 1 });
    expect(result.solutions).toHaveLength(0);
  });
});

describe("Validator", () => {
  test("valid grid passes", () => {
    const struct = buildStructure(DEFAULT_META[9]);
    const grid = gridFromString(TEST_9x9);
    expect(isValid(grid, struct)).toBe(true);
  });

  test("grid with conflict fails", () => {
    const struct = buildStructure(DEFAULT_META[4]);
    const grid = new Int8Array(16);
    grid[0] = 1; grid[1] = 1; // 同行冲突
    expect(isValid(grid, struct)).toBe(false);
  });

  test("solved grid isSolved=true", () => {
    const struct = buildStructure(DEFAULT_META[9]);
    const grid = gridFromString(TEST_9x9_SOLUTION);
    expect(isSolved(grid, struct)).toBe(true);
  });
});

describe("Generator", () => {
  test("generates solvable 4×4 easy", () => {
    const meta = DEFAULT_META[4];
    const { givens, solution } = generate(meta, { difficulty: "easy", seed: 42 });
    expect(givens).toHaveLength(16);
    expect(solution).toHaveLength(16);

    // 解应该有效
    const struct = buildStructure(meta);
    const solGrid = Int8Array.from(solution);
    expect(isSolved(solGrid, struct)).toBe(true);

    // 题目应有唯一解
    const puzzleGrid = Int8Array.from(givens);
    expect(hasUniqueSolution(puzzleGrid, struct)).toBe(true);

    // clue 数在范围内
    const clues = givens.filter((v) => v !== 0).length;
    expect(clues).toBeGreaterThanOrEqual(5);
  });

  test("generates solvable 6×6 medium", () => {
    const meta = DEFAULT_META[6];
    const { givens, solution } = generate(meta, { difficulty: "medium", seed: 100 });
    const struct = buildStructure(meta);
    expect(isSolved(Int8Array.from(solution), struct)).toBe(true);
    expect(hasUniqueSolution(Int8Array.from(givens), struct)).toBe(true);
  });

  test("generates solvable 9×9 easy", () => {
    const meta = DEFAULT_META[9];
    const { givens, solution } = generate(meta, { difficulty: "easy", seed: 7 });
    const struct = buildStructure(meta);
    expect(isSolved(Int8Array.from(solution), struct)).toBe(true);
    expect(hasUniqueSolution(Int8Array.from(givens), struct)).toBe(true);
  });

  test("generates solvable 9×9 hard", () => {
    const meta = DEFAULT_META[9];
    const { givens, solution } = generate(meta, { difficulty: "hard", seed: 999 });
    const struct = buildStructure(meta);
    expect(isSolved(Int8Array.from(solution), struct)).toBe(true);
    expect(hasUniqueSolution(Int8Array.from(givens), struct)).toBe(true);
  });

  test("different seeds produce different puzzles", () => {
    const meta = DEFAULT_META[4];
    const a = generate(meta, { difficulty: "easy", seed: 1 });
    const b = generate(meta, { difficulty: "easy", seed: 2 });
    expect(a.givens).not.toEqual(b.givens);
  });

  test("same seed produces same puzzle", () => {
    const meta = DEFAULT_META[4];
    const a = generate(meta, { difficulty: "easy", seed: 42 });
    const b = generate(meta, { difficulty: "easy", seed: 42 });
    expect(a.givens).toEqual(b.givens);
  });
});
