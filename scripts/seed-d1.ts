/**
 * 生成供 Cloudflare D1 使用的种子 SQL（数据库不依赖本地文件）
 * 运行：(cd 项目根) bun scripts/seed-d1.ts
 * 产出 ./d1-seed.sql，然后：
 *   wrangler d1 execute sudoku-training-camp --file=./d1-seed.sql --remote
 */
import { PUZZLE_TYPES } from "../src/shared/puzzle-types";
import { generatePuzzle } from "../src/server/puzzle-service";
import { serializeVariantData } from "../src/server/variant-serialize";
import type { Difficulty } from "../src/engine";

/** SQL 单引号转义 */
function esc(v: unknown): string {
  return String(v).replace(/'/g, "''");
}
function str(v: unknown): string {
  return `'${esc(v)}'`;
}

const lines: string[] = [
  "-- 自动生成：题型 / 题库 / demo 用户 / 技能统计 种子（D1）",
];

// 1. 机型目录
for (const pt of PUZZLE_TYPES) {
  lines.push(
    `INSERT OR IGNORE INTO puzzle_types (code,name,grid_size,box_rows,box_cols,variant_type,description,rules,icon,color,phase,sort_order,is_finals) VALUES (${str(pt.code)},${str(pt.name)},${pt.gridSize},${pt.boxRows},${pt.boxCols},${str(pt.variantType)},${str(pt.description)},${str(pt.rules)},${str(pt.icon)},${str(pt.color)},${pt.phase},${pt.sortOrder},${pt.isFinals ? 1 : 0});`,
  );
}

// 2. 每个题型预生成若干题（seed 与 runSeed 保持一致，可复现）
for (const pt of PUZZLE_TYPES) {
  for (const diff of ["easy", "medium", "hard"] as Difficulty[]) {
    const seed = 10000 + pt.sortOrder * 10 + (diff === "easy" ? 1 : diff === "medium" ? 2 : 3);
    const generated = generatePuzzle(pt, diff, seed);
    const data = serializeVariantData(generated.data);
    const dataJson = data ? JSON.stringify(data) : null;
    lines.push(
      `INSERT INTO puzzles (type_code,difficulty,givens,solution,data_json) VALUES (${str(pt.code)},${str(diff)},${str(JSON.stringify(generated.givens))},${str(JSON.stringify(generated.solution))},${dataJson ? str(dataJson) : "NULL"});`,
    );
  }
}

// 3. demo 用户
lines.push(
  `INSERT OR IGNORE INTO users (username,password_hash,name,avatar_emoji,age_group,total_xp,streak_days) VALUES ('demo',NULL,'数独达人','🦊','10-12',120,3);`,
);

// 4. demo 用户的技能统计（关联 demo 的用户 id）
for (const pt of PUZZLE_TYPES) {
  lines.push(
    `INSERT OR IGNORE INTO skill_stats (user_id,type_code) VALUES ((SELECT id FROM users WHERE username='demo'),${str(pt.code)});`,
  );
}

const sql = lines.join("\n") + "\n";

Bun.write("./d1-seed.sql", sql);
console.log(`✅ 已生成 ./d1-seed.sql（${lines.length} 条 SQL）`);
console.log("下一步：wrangler d1 execute sudoku-training-camp --file=./d1-seed.sql --remote");
