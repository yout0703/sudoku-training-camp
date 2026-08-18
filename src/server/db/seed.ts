/**
 * 数据库种子脚本（可重复运行）
 * 运行：bun src/server/db/seed.ts
 */
import { eq } from "drizzle-orm";
import { db, schema } from "./client";
import { PUZZLE_TYPES } from "../../shared/puzzle-types";
import { LESSONS } from "../../shared/lessons";

console.log("🌱 开始初始化 / 同步数据库...");

// ─── 题型 ───
console.log(`  同步 ${PUZZLE_TYPES.length} 个题型...`);
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

// ─── 课程（按 sortOrder 幂等）───
console.log(`  同步 ${LESSONS.length} 节课程...`);
for (const lesson of LESSONS) {
  const existing = db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.sortOrder, lesson.sortOrder))
    .get();

  if (existing) {
    db.update(schema.lessons)
      .set({
        typeCode: lesson.typeCode,
        phase: lesson.phase,
        title: lesson.title,
        contentJson: JSON.stringify(lesson.sections),
      })
      .where(eq(schema.lessons.id, existing.id))
      .run();
  } else {
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
}

// ─── 默认用户 ───
console.log("  确保默认用户...");
db.insert(schema.users)
  .values({
    id: 1,
    name: "小选手",
    avatarEmoji: "🦊",
    ageGroup: "10-12",
  })
  .onConflictDoNothing()
  .run();

// ─── 课程进度 ───
console.log("  同步课程进度...");
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

// 新课插在末尾时：上一节已完成则解锁，避免卡在 locked
const progressRows = db.select().from(schema.lessonProgress).all();
const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));
const ordered = [...allLessons].sort((a, b) => a.sortOrder - b.sortOrder);
for (let i = 1; i < ordered.length; i++) {
  const prev = progressByLesson.get(ordered[i - 1].id);
  const cur = progressByLesson.get(ordered[i].id);
  if (prev?.status === "completed" && cur?.status === "locked") {
    db.update(schema.lessonProgress)
      .set({ status: "available" })
      .where(eq(schema.lessonProgress.id, cur.id))
      .run();
  }
}

// ─── 技能统计 ───
console.log("  同步技能统计...");
for (const pt of PUZZLE_TYPES) {
  db.insert(schema.skillStats)
    .values({
      userId: 1,
      typeCode: pt.code,
    })
    .onConflictDoNothing()
    .run();
}

console.log("✅ 数据库同步完成！");
console.log(`   题型: ${PUZZLE_TYPES.length} 个`);
console.log(`   课程: ${allLessons.length} 节`);
console.log("   默认用户 ID: 1");
