/**
 * Elysia API 服务器
 * 提供数独训练所需的全部接口
 */
import { Elysia } from "elysia";
import { t } from "elysia";
import { eq, sql, and } from "drizzle-orm";
import { db, schema } from "./db/client";
import { PUZZLE_TYPES, PHASE_NAMES, getPuzzleType } from "../shared/puzzle-types";
import { generatePuzzle } from "./puzzle-service";
import type { Difficulty } from "../engine";
import { analyzeWeakness } from "./ai/analyzer";


let analysisCache: { data: unknown; timestamp: number } | null = null;
const ANALYSIS_CACHE_TTL = 5 * 60 * 1000; // 5 分钟缓存
const DEFAULT_USER_ID = 1;

// ─── 工具函数 ───

/** 计算薄弱分（0-100，越高越弱） */
function calcWeakScore(attempts: number, completed: number, avgDuration: number, avgMistakes: number, bestTime: number | null): number {
  if (attempts === 0) return 50; // 无数据，中等
  const completionRate = completed / attempts;
  const completionScore = (1 - completionRate) * 50;
  const mistakeScore = Math.min(avgMistakes * 8, 30);
  const timeScore = avgDuration > 0 ? Math.min(avgDuration / 60000 * 3, 20) : 10; // 超过 20 分钟得满分
  return Math.round(completionScore + mistakeScore + timeScore);
}

/** XP 奖励 */
function calcXp(difficulty: string, durationMs: number, mistakes: number, completed: boolean): number {
  if (!completed) return 5;
  const base = difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : difficulty === "hard" ? 35 : 50;
  const timeBonus = durationMs < 60000 ? 10 : durationMs < 120000 ? 5 : 0;
  const mistakePenalty = Math.min(mistakes * 2, base / 2);
  return Math.max(base + timeBonus - mistakePenalty, 5);
}

// ─── API 路由 ───

const app = new Elysia()

  // 健康检查
  .get("/api/health", () => ({ status: "ok", time: Date.now() }))

  // ─── 题型列表 ───
  .get("/api/puzzle-types", () => {
    return PUZZLE_TYPES.map((t) => ({
      code: t.code,
      name: t.name,
      gridSize: t.gridSize,
      boxRows: t.boxRows,
      boxCols: t.boxCols,
      variantType: t.variantType,
      description: t.description,
      rules: t.rules,
      icon: t.icon,
      color: t.color,
      phase: t.phase,
      sortOrder: t.sortOrder,
      isFinals: t.isFinals,
    }));
  })

  // ─── 生成题目 ───
  .post(
    "/api/puzzles/generate",
    ({ body }) => {
      const { typeCode, difficulty } = body;
      const typeDef = getPuzzleType(typeCode);
      if (!typeDef) return { error: "未知题型" };

      const diff = (difficulty ?? "medium") as Difficulty;
      const generated = generatePuzzle(typeDef, diff);

      // 存入数据库
      const result = db
        .insert(schema.puzzles)
        .values({
          typeCode,
          difficulty: diff,
          givens: JSON.stringify(generated.givens),
          solution: JSON.stringify(generated.solution),
          dataJson: generated.data ? JSON.stringify(generated.data) : null,
        })
        .returning({ id: schema.puzzles.id })
        .get();

      return {
        id: result.id,
        typeCode,
        difficulty: diff,
        meta: {
          size: typeDef.gridSize,
          boxRows: typeDef.boxRows,
          boxCols: typeDef.boxCols,
        },
        givens: generated.givens,
        solution: generated.solution,
        variantType: typeDef.variantType,
        data: generated.data ?? null,
      };
    },
    {
      body: t.Object({
        typeCode: t.String(),
        difficulty: t.Optional(t.String()),
      }),
    },
  )

  // ─── 获取题目 ───
  .get("/api/puzzles/:id", ({ params }) => {
    const puzzle = db
      .select()
      .from(schema.puzzles)
      .where(eq(schema.puzzles.id, parseInt(params.id)))
      .get();
    if (!puzzle) return { error: "题目不存在" };

    const typeDef = getPuzzleType(puzzle.typeCode);
    return {
      id: puzzle.id,
      typeCode: puzzle.typeCode,
      difficulty: puzzle.difficulty,
      meta: typeDef
        ? { size: typeDef.gridSize, boxRows: typeDef.boxRows, boxCols: typeDef.boxCols }
        : null,
      givens: JSON.parse(puzzle.givens),
      variantType: typeDef?.variantType ?? "standard",
      data: puzzle.dataJson ? JSON.parse(puzzle.dataJson) : null,
    };
  })

  // ─── 提交练习结果 ───
  .post(
    "/api/practice",
    ({ body }) => {
      const { puzzleId, typeCode, difficulty, durationMs, mistakes, hintsUsed, completed } = body;
      const xp = calcXp(difficulty, durationMs, mistakes, completed);

      // 记录练习
      db.insert(schema.practiceRecords)
        .values({
          userId: DEFAULT_USER_ID,
          puzzleId: puzzleId ?? null,
          typeCode,
          difficulty,
          durationMs,
          mistakes,
          hintsUsed,
          completed,
          xpEarned: xp,
        })
        .run();

      // 更新技能统计
      const existing = db
        .select()
        .from(schema.skillStats)
        .where(and(eq(schema.skillStats.userId, DEFAULT_USER_ID), eq(schema.skillStats.typeCode, typeCode)))
        .get();

      if (existing) {
        const newTotal = existing.totalAttempts + 1;
        const newCompleted = existing.completedCount + (completed ? 1 : 0);
        const newDuration = existing.totalDurationMs + durationMs;
        const newMistakes = existing.totalMistakes + mistakes;
        const newHints = existing.totalHints + hintsUsed;
        const newBest = completed
          ? existing.bestTimeMs
            ? Math.min(existing.bestTimeMs, durationMs)
            : durationMs
          : existing.bestTimeMs;

        db.update(schema.skillStats)
          .set({
            totalAttempts: newTotal,
            completedCount: newCompleted,
            totalDurationMs: newDuration,
            totalMistakes: newMistakes,
            totalHints: newHints,
            bestTimeMs: newBest,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.skillStats.id, existing.id))
          .run();
      }

      // 更新用户 XP
      const user = db.select().from(schema.users).where(eq(schema.users.id, DEFAULT_USER_ID)).get();
      if (user) {
        const today = new Date().toISOString().split("T")[0];
        const lastDate = user.lastPracticeDate;
        let streak = user.streakDays;
        if (lastDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          streak = lastDate === yesterday ? streak + 1 : 1;
        }
        db.update(schema.users)
          .set({
            totalXp: user.totalXp + xp,
            streakDays: streak,
            lastPracticeDate: today,
          })
          .where(eq(schema.users.id, DEFAULT_USER_ID))
          .run();
      }

      return { success: true, xpEarned: xp };
    },
    {
      body: t.Object({
        puzzleId: t.Optional(t.Number()),
        typeCode: t.String(),
        difficulty: t.String(),
        durationMs: t.Number(),
        mistakes: t.Number(),
        hintsUsed: t.Number(),
        completed: t.Boolean(),
      }),
    },
  )

  // ─── 课程列表 ───
  .get("/api/lessons", () => {
    const lessons = db.select().from(schema.lessons).all();
    const progress = db
      .select()
      .from(schema.lessonProgress)
      .where(eq(schema.lessonProgress.userId, DEFAULT_USER_ID))
      .all();
    const progressMap = new Map(progress.map((p) => [p.lessonId, p.status]));

    return lessons.map((l) => ({
      id: l.id,
      typeCode: l.typeCode,
      phase: l.phase,
      title: l.title,
      sortOrder: l.sortOrder,
      status: progressMap.get(l.id) ?? "locked",
    }));
  })

  // ─── 课程详情 ───
  .get("/api/lessons/:id", ({ params }) => {
    const lesson = db
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.id, parseInt(params.id)))
      .get();
    if (!lesson) return { error: "课程不存在" };

    const progress = db
      .select()
      .from(schema.lessonProgress)
      .where(and(eq(schema.lessonProgress.userId, DEFAULT_USER_ID), eq(schema.lessonProgress.lessonId, lesson.id)))
      .get();

    return {
      id: lesson.id,
      typeCode: lesson.typeCode,
      phase: lesson.phase,
      title: lesson.title,
      sortOrder: lesson.sortOrder,
      sections: JSON.parse(lesson.contentJson),
      status: progress?.status ?? "locked",
    };
  })

  // ─── 更新课程状态 ───
  .patch(
    "/api/lessons/:id",
    ({ params, body }) => {
      const lessonId = parseInt(params.id);
      const { status } = body;
      const now = new Date().toISOString();

      const existing = db
        .select()
        .from(schema.lessonProgress)
        .where(and(eq(schema.lessonProgress.userId, DEFAULT_USER_ID), eq(schema.lessonProgress.lessonId, lessonId)))
        .get();

      if (existing) {
        db.update(schema.lessonProgress)
          .set({
            status,
            startedAt: status === "in_progress" && !existing.startedAt ? now : existing.startedAt,
            completedAt: status === "completed" ? now : existing.completedAt,
          })
          .where(eq(schema.lessonProgress.id, existing.id))
          .run();
      } else {
        db.insert(schema.lessonProgress)
          .values({
            userId: DEFAULT_USER_ID,
            lessonId,
            status,
            startedAt: status !== "locked" ? now : null,
            completedAt: status === "completed" ? now : null,
          })
          .run();
      }

      // 完成课程后解锁下一节
      if (status === "completed") {
        const currentLesson = db.select().from(schema.lessons).where(eq(schema.lessons.id, lessonId)).get();
        if (currentLesson) {
          const nextLesson = db
            .select()
            .from(schema.lessons)
            .where(eq(schema.lessons.sortOrder, currentLesson.sortOrder + 1))
            .get();
          if (nextLesson) {
            const nextProgress = db
              .select()
              .from(schema.lessonProgress)
              .where(and(eq(schema.lessonProgress.userId, DEFAULT_USER_ID), eq(schema.lessonProgress.lessonId, nextLesson.id)))
              .get();
            if (nextProgress && nextProgress.status === "locked") {
              db.update(schema.lessonProgress)
                .set({ status: "available" })
                .where(eq(schema.lessonProgress.id, nextProgress.id))
                .run();
            }
          }
        }
      }

      return { success: true };
    },
    {
      body: t.Object({
        status: t.String(),
      }),
    },
  )

  // ─── 技能统计（薄弱点分析数据）───
  .get("/api/stats", () => {
    const stats = db
      .select()
      .from(schema.skillStats)
      .where(eq(schema.skillStats.userId, DEFAULT_USER_ID))
      .all();

    return stats.map((s) => {
      const avgDuration = s.completedCount > 0 ? s.totalDurationMs / s.completedCount : 0;
      const avgMistakes = s.totalAttempts > 0 ? s.totalMistakes / s.totalAttempts : 0;
      return {
        typeCode: s.typeCode,
        totalAttempts: s.totalAttempts,
        completedCount: s.completedCount,
        completionRate: s.totalAttempts > 0 ? s.completedCount / s.totalAttempts : 0,
        avgDurationMs: avgDuration,
        avgMistakes,
        bestTimeMs: s.bestTimeMs,
        weakScore: calcWeakScore(s.totalAttempts, s.completedCount, avgDuration, avgMistakes, s.bestTimeMs),
      };
    });
  })

  // ─── 仪表盘（首页聚合数据）───
  .get("/api/dashboard", () => {
    const user = db.select().from(schema.users).where(eq(schema.users.id, DEFAULT_USER_ID)).get();
    const lessons = db.select().from(schema.lessons).all();
    const progress = db
      .select()
      .from(schema.lessonProgress)
      .where(eq(schema.lessonProgress.userId, DEFAULT_USER_ID))
      .all();
    const progressMap = new Map(progress.map((p) => [p.lessonId, p.status]));
    const stats = db
      .select()
      .from(schema.skillStats)
      .where(eq(schema.skillStats.userId, DEFAULT_USER_ID))
      .all();
    const recent = db
      .select()
      .from(schema.practiceRecords)
      .where(eq(schema.practiceRecords.userId, DEFAULT_USER_ID))
      .orderBy(sql`created_at DESC`)
      .limit(10)
      .all();

    // 按阶段分组
    const phases = [1, 2, 3, 4].map((phase) => {
      const phaseLessons = lessons.filter((l) => l.phase === phase);
      const phaseTypes = PUZZLE_TYPES.filter((t) => t.phase === phase);
      const completedCount = phaseLessons.filter((l) => progressMap.get(l.id) === "completed").length;

      return {
        phase,
        name: PHASE_NAMES[phase] ?? `阶段 ${phase}`,
        totalLessons: phaseLessons.length,
        completedLessons: completedCount,
        puzzleTypes: phaseTypes.map((t) => ({
          code: t.code,
          name: t.name,
          icon: t.icon,
          color: t.color,
        })),
      };
    });

    const skillStats = stats.map((s) => {
      const avgDuration = s.completedCount > 0 ? s.totalDurationMs / s.completedCount : 0;
      const avgMistakes = s.totalAttempts > 0 ? s.totalMistakes / s.totalAttempts : 0;
      return {
        typeCode: s.typeCode,
        totalAttempts: s.totalAttempts,
        completedCount: s.completedCount,
        completionRate: s.totalAttempts > 0 ? s.completedCount / s.totalAttempts : 0,
        avgDurationMs: avgDuration,
        avgMistakes,
        bestTimeMs: s.bestTimeMs,
        weakScore: calcWeakScore(s.totalAttempts, s.completedCount, avgDuration, avgMistakes, s.bestTimeMs),
      };
    });

    // 简单推荐
    const recommendations: string[] = [];
    const sortedByWeak = [...skillStats].filter((s) => s.totalAttempts > 0).sort((a, b) => b.weakScore - a.weakScore);
    if (sortedByWeak.length > 0 && sortedByWeak[0].weakScore > 40) {
      const def = getPuzzleType(sortedByWeak[0].typeCode);
      if (def) recommendations.push(`${def.icon} 多练习 ${def.name}，这是你的薄弱项！`);
    }
    const totalCompleted = progress.filter((p) => p.status === "completed").length;
    if (totalCompleted === 0) {
      recommendations.push("🌱 从第一课开始你的数独之旅吧！");
    } else if (totalCompleted < 4) {
      recommendations.push("📚 继续学习课程，打好基础！");
    } else {
      recommendations.push("💪 挑战更高难度的题目，提升速度！");
    }

    return {
      user: user
        ? {
            id: user.id,
            name: user.name,
            avatarEmoji: user.avatarEmoji,
            totalXp: user.totalXp,
            streakDays: user.streakDays,
          }
        : null,
      phases,
      skillStats,
      recentPractice: recent.map((r) => ({
        id: r.id,
        typeCode: r.typeCode,
        durationMs: r.durationMs,
        mistakes: r.mistakes,
        completed: r.completed === 1,
        createdAt: r.createdAt,
      })),
      recommendations,
    };
  })

  // ─── AI 薄弱点分析 ───
  .get("/api/analysis", async () => {
    // 缓存 5 分钟，避免频繁调用 API
    if (analysisCache && Date.now() - analysisCache.timestamp < ANALYSIS_CACHE_TTL) {
      return analysisCache.data;
    }

    const stats = db
      .select()
      .from(schema.skillStats)
      .where(eq(schema.skillStats.userId, DEFAULT_USER_ID))
      .all();

    const formatted = stats.map((s) => {
      const def = getPuzzleType(s.typeCode);
      const avgDur = s.completedCount > 0 ? s.totalDurationMs / s.completedCount : 0;
      const avgMis = s.totalAttempts > 0 ? s.totalMistakes / s.totalAttempts : 0;
      return {
        typeCode: s.typeCode,
        typeName: def?.name ?? s.typeCode,
        icon: def?.icon ?? "📝",
        totalAttempts: s.totalAttempts,
        completedCount: s.completedCount,
        completionRate: s.totalAttempts > 0 ? s.completedCount / s.totalAttempts : 0,
        avgDurationMs: avgDur,
        avgMistakes: avgMis,
        bestTimeMs: s.bestTimeMs,
        weakScore: calcWeakScore(s.totalAttempts, s.completedCount, avgDur, avgMis, s.bestTimeMs),
      };
    });

    const result = await analyzeWeakness(formatted);
    analysisCache = { data: result, timestamp: Date.now() };
    return result;
  })

  // ─── 静态文件服务（生产环境）───
  .get("*", async ({ path }) => {
    if (process.env.NODE_ENV !== "production") {
      return new Response("Not Found", { status: 404 });
    }
    // 生产环境：从 dist/ 提供静态文件
    const filePath = path === "/" ? "/index.html" : path;
    const file = Bun.file(`./dist${filePath}`);
    if (await file.exists()) {
      return new Response(file, {
        headers: { "Cache-Control": "public, max-age=3600" },
      });
    }
    // SPA 回退
    const index = Bun.file("./dist/index.html");
    if (await index.exists()) {
      return new Response(index);
    }
    return new Response("Not Found", { status: 404 });
  });

// ─── 启动 ───
const PORT = parseInt(process.env.PORT ?? "3000");

if (process.env.NODE_ENV === "production") {
  // 生产环境：构建后由 Elysia 提供前端文件
  app.listen(PORT);
  console.log(`🚀 生产服务器已启动: http://localhost:${PORT}`);
} else {
  // 开发环境：仅 API 服务器
  app.listen(PORT);
  console.log(`📡 API 服务器已启动: http://localhost:${PORT}`);
  console.log(`   前端开发服务器: http://localhost:5173`);
}

export { app };
