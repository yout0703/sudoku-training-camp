/**
 * 数据库种子脚本
 * 运行：bun src/server/db/seed.ts
 */
import { db, schema } from "./client";
import { PUZZLE_TYPES } from "../../shared/puzzle-types";
import { LESSONS } from "../../shared/lessons";

console.log("🌱 开始初始化数据库...");

// ─── 题型 ───
console.log(`  插入 ${PUZZLE_TYPES.length} 个题型...`);
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
    .onConflictDoNothing()
    .run();
}

// ─── 课程 ───
console.log(`  插入 ${LESSONS.length} 节课程...`);
for (const lesson of LESSONS) {
  db.insert(schema.lessons)
    .values({
      typeCode: lesson.typeCode,
      phase: lesson.phase,
      title: lesson.title,
      sortOrder: lesson.sortOrder,
      contentJson: JSON.stringify(lesson.sections),
    })
    .run();
}

// ─── 默认用户 ───
console.log("  创建默认用户...");
db.insert(schema.users)
  .values({
    id: 1,
    name: "小选手",
    avatarEmoji: "🦊",
    ageGroup: "10-12",
  })
  .onConflictDoNothing()
  .run();

// ─── 课程进度（第一节解锁）───
console.log("  初始化课程进度...");
const allLessons = db.select().from(schema.lessons).all();
for (const lesson of allLessons) {
  const status = lesson.sortOrder === 1 ? "available" : "locked";
  db.insert(schema.lessonProgress)
    .values({
      userId: 1,
      lessonId: lesson.id,
      status,
    })
    .onConflictDoNothing()
    .run();
}

// ─── 技能统计初始化 ───
console.log("  初始化技能统计...");
for (const pt of PUZZLE_TYPES) {
  db.insert(schema.skillStats)
    .values({
      userId: 1,
      typeCode: pt.code,
    })
    .onConflictDoNothing()
    .run();
}

console.log("✅ 数据库初始化完成！");
console.log(`   题型: ${PUZZLE_TYPES.length} 个`);
console.log(`   课程: ${LESSONS.length} 节`);
console.log("   默认用户 ID: 1");
