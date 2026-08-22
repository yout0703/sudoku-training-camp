/**
 * 全题型自动化测试套件
 * 覆盖所有 18 个数独题型：
 * 1. 结构与满盘解法合法性
 * 2. 变体规则校验
 * 3. 题目唯一解测试
 * 4. 批量随机性与稳定性
 */
import { describe, it, expect } from "bun:test";
import { PUZZLE_TYPES, getPuzzleType } from "../src/shared/puzzle-types";
import { generatePuzzle } from "../src/server/puzzle-service";
import {
  validateVariantRules,
  solve,
  buildStructure,
  buildIrregularStructure,
  buildVariantSolveOptions,
  DEFAULT_META,
} from "../src/engine";

describe("全数独题型质量测试", () => {
  it("应包含完整的 23 个数独题型定义", () => {
    expect(PUZZLE_TYPES.length).toBe(23);
  });

  for (const typeDef of PUZZLE_TYPES) {
    describe(`题型: ${typeDef.name} (${typeDef.code})`, () => {
      it("生成的满盘解严格符合该题型规则，且题目具有唯一解", () => {
        const generated = generatePuzzle(typeDef, "medium", 12345);
        const meta = DEFAULT_META[typeDef.gridSize as 4 | 6 | 9];
        const struct =
          typeDef.variantType === "irregular" && generated.data?.irregular
            ? buildIrregularStructure(meta, generated.data.irregular.boxOf)
            : buildStructure(meta);

        // 1. 满盘解法合法性测试
        const validation = validateVariantRules(
          generated.solution,
          typeDef.gridSize,
          typeDef.variantType,
          generated.data,
          struct,
        );
        expect(validation.errors).toEqual([]);
        expect(validation.valid).toBe(true);

        // 2. 唯一解测试
        const solveOpts = buildVariantSolveOptions(
          typeDef.variantType,
          typeDef.gridSize,
          generated.data,
        );
        const result = solve(Int8Array.from(generated.givens), struct, {
          maxSolutions: 2,
          ...solveOpts,
        });

        expect(result.solutions.length).toBe(1);
        expect(Array.from(result.solutions[0])).toEqual(generated.solution);
      });

      it("在不同难度（简单/困难）下均能生成有效题目", () => {
        for (const diff of ["easy", "hard"] as const) {
          const generated = generatePuzzle(typeDef, diff, 98765);
          const meta = DEFAULT_META[typeDef.gridSize as 4 | 6 | 9];
          const struct =
            typeDef.variantType === "irregular" && generated.data?.irregular
              ? buildIrregularStructure(meta, generated.data.irregular.boxOf)
              : buildStructure(meta);

          const validation = validateVariantRules(
            generated.solution,
            typeDef.gridSize,
            typeDef.variantType,
            generated.data,
            struct,
          );
          expect(validation.valid).toBe(true);

          const solveOpts = buildVariantSolveOptions(
            typeDef.variantType,
            typeDef.gridSize,
            generated.data,
          );
          const result = solve(Int8Array.from(generated.givens), struct, {
            maxSolutions: 2,
            ...solveOpts,
          });
          expect(result.solutions.length).toBe(1);
        }
      });
    });
  }
});
