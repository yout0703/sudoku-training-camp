/**
 * 数据库种子脚本（可重复运行）
 * 1. 同步所有 23 种数独题型
 * 2. 预置/生成题库种子
 * 3. 初始化演示用户与技能统计
 * 运行：bun src/server/db/seed.ts
 */
import { eq } from "drizzle-orm";
import { db, schema } from "./client";
import { PUZZLE_TYPES } from "../../shared/puzzle-types";
import { generatePuzzle } from "../puzzle-service";
import { serializeVariantData } from "../variant-serialize";
import type { Difficulty } from "../../engine";

export function runSeed() {
  // 1. 同步 23 个题型
  for (const pt of PUZZLE_TYPES) {
    db.insert(schema.puzzleTypes)
      .values({
        code: pt.code,
        name: pt.name,
        gridSize: pt.gridSize,
        boxRows: pt.boxRows,
        boxCols: pt.boxCols,
        variantType: pt.variantType,
        description: pt.description,
        rules: pt.rules,
        icon: pt.icon,
        color: pt.color,
        phase: pt.phase,
        sortOrder: pt.sortOrder,
        isFinals: pt.isFinals,
      })
      .onConflictDoUpdate({
        target: schema.puzzleTypes.code,
        set: {
          name: pt.name,
          gridSize: pt.gridSize,
          boxRows: pt.boxRows,
          boxCols: pt.boxCols,
          variantType: pt.variantType,
          description: pt.description,
          rules: pt.rules,
          icon: pt.icon,
          color: pt.color,
          phase: pt.phase,
          sortOrder: pt.sortOrder,
          isFinals: pt.isFinals,
        },
      })
      .run();
  }

  // 2. 预置基础题库（每个题型各预生成若干道精选题库）
  const existingCount = db.select().from(schema.puzzles).all().length;
  if (existingCount < PUZZLE_TYPES.length * 2) {
    for (const pt of PUZZLE_TYPES) {
      for (const diff of ["easy", "medium", "hard"] as Difficulty[]) {
        try {
          const generated = generatePuzzle(pt, diff, 10000 + pt.sortOrder * 10 + (diff === "easy" ? 1 : diff === "medium" ? 2 : 3));
          const data = serializeVariantData(generated.data);
          db.insert(schema.puzzles)
            .values({
              typeCode: pt.code,
              difficulty: diff,
              givens: JSON.stringify(generated.givens),
              solution: JSON.stringify(generated.solution),
              dataJson: data ? JSON.stringify(data) : null,
            })
            .run();
        } catch (e) {
          console.error(`生成预置题目失败: ${pt.code} ${diff}`, e);
        }
      }
    }
  }

  // 3. 确保默认用户
  const defaultUser = db.select().from(schema.users).where(eq(schema.users.username, "demo")).get();
  if (!defaultUser) {
    db.insert(schema.users)
      .values({
        username: "demo",
        name: "数独达人",
        avatarEmoji: "🦊",
        ageGroup: "10-12",
        totalXp: 120,
        streakDays: 3,
      })
      .run();
  }

  // 4. 初始化技能统计
  const demoUser = db.select().from(schema.users).where(eq(schema.users.username, "demo")).get();
  if (demoUser) {
    for (const pt of PUZZLE_TYPES) {
      db.insert(schema.skillStats)
        .values({
          userId: demoUser.id,
          typeCode: pt.code,
        })
        .onConflictDoNothing()
        .run();
    }
  }
}

if (import.meta.main) {
  console.log("🌱 开始初始化 / 同步数独题库与配置...");
  runSeed();
  console.log("✅ 数据库题库与种子初始化完成！");
}
