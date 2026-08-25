/**
 * Elysia API 服务器
 * 提供数独公共做题、多变体题目生成、用户认证、进度/草稿持久化及统计
 */
import { Elysia } from "elysia";
import { t } from "elysia";
import { eq, lt, and, desc } from "drizzle-orm";
import { db, schema } from "./db/client";
import { runMigration } from "./db/migrate";
import { runSeed } from "./db/seed";
import { PUZZLE_TYPES, PHASE_NAMES, getPuzzleType } from "../shared/puzzle-types";
import { generatePuzzle } from "./puzzle-service";
import { serializeVariantData } from "./variant-serialize";
import { hashPassword, verifyPassword, isLegacyPlain, makeToken, parseUserIdFromHeaders } from "./auth";
import type { Difficulty } from "../engine";

// ─── 工具函数 ───

/** 计算薄弱分（0-100，越高越弱） */
function calcWeakScore(
  attempts: number,
  completed: number,
  avgDuration: number,
  avgMistakes: number,
  bestTime: number | null,
): number {
  if (attempts === 0) return 50; // 无数据，中等
  const completionRate = completed / attempts;
  const completionScore = (1 - completionRate) * 50;
  const mistakeScore = Math.min(avgMistakes * 8, 30);
  const timeScore = avgDuration > 0 ? Math.min((avgDuration / 60000) * 3, 20) : 10;
  return Math.round(completionScore + mistakeScore + timeScore);
}

/** XP 奖励 */
function calcXp(
  difficulty: string,
  durationMs: number,
  mistakes: number,
  completed: boolean,
): number {
  if (!completed) return 5;
  const base =
    difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : difficulty === "hard" ? 35 : 50;
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
      const { typeCode, difficulty, seed } = body;
      const typeDef = getPuzzleType(typeCode);
      if (!typeDef) return { error: "未知题型" };

      const diff = (difficulty ?? "medium") as Difficulty;
      const generated = generatePuzzle(typeDef, diff, seed);
      const data = serializeVariantData(generated.data);

      // 存入数据库供题库索引
      const result = db
        .insert(schema.puzzles)
        .values({
          typeCode,
          difficulty: diff,
          givens: JSON.stringify(generated.givens),
          solution: JSON.stringify(generated.solution),
          dataJson: data ? JSON.stringify(data) : null,
          seed: seed ?? null,
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
        data,
      };
    },
    {
      body: t.Object({
        typeCode: t.String(),
        difficulty: t.Optional(t.String()),
        seed: t.Optional(t.Number()),
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
      solution: puzzle.solution ? JSON.parse(puzzle.solution) : undefined,
      variantType: typeDef?.variantType ?? "standard",
      data: puzzle.dataJson ? JSON.parse(puzzle.dataJson) : null,
    };
  })

  // ─── 用户认证 API ───

  // 注册
  .post(
    "/api/auth/register",
    ({ body }) => {
      const { username, password, name, avatarEmoji } = body;
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername) return { error: "用户名不能为空" };

      const existing = db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, cleanUsername))
        .get();
      if (existing) return { error: "用户名已存在" };

      const user = db
        .insert(schema.users)
        .values({
          username: cleanUsername,
          passwordHash: password ? hashPassword(password) : null,
          name: name?.trim() || cleanUsername,
          avatarEmoji: avatarEmoji || "🦊",
        })
        .returning()
        .get();

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatarEmoji: user.avatarEmoji,
          totalXp: user.totalXp,
          streakDays: user.streakDays,
        },
        token: makeToken(user),
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.Optional(t.String()),
        name: t.Optional(t.String()),
        avatarEmoji: t.Optional(t.String()),
      }),
    },
  )

  // 快捷登录 / 切换用户
  .post(
    "/api/auth/quick-login",
    ({ body }) => {
      const { username, name, password } = body;
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername) return { error: "用户名不能为空" };

      let user = db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, cleanUsername))
        .get();

      if (user && user.passwordHash) {
        // 已设置密码的账号必须凭密码登录，防止冒名
        if (!password || !verifyPassword(password, user.passwordHash)) {
          return { error: "该用户名已注册，请切换到「密码登录」并输入正确密码" };
        }
      } else if (!user) {
        // 新用户（游客）直接创建
        user = db
          .insert(schema.users)
          .values({
            username: cleanUsername,
            name: name?.trim() || cleanUsername,
            avatarEmoji: "🦊",
          })
          .returning()
          .get();
      }

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatarEmoji: user.avatarEmoji,
          totalXp: user.totalXp,
          streakDays: user.streakDays,
        },
        token: makeToken(user),
      };
    },
    {
      body: t.Object({
        username: t.String(),
        name: t.Optional(t.String()),
        password: t.Optional(t.String()),
      }),
    },
  )

  // 账号登录
  .post(
    "/api/auth/login",
    ({ body }) => {
      const { username, password } = body;
      const cleanUsername = username.trim().toLowerCase();
      const user = db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, cleanUsername))
        .get();

      if (!user) {
        return { error: "用户不存在，请先注册" };
      }
      if (user.passwordHash) {
        if (!password || !verifyPassword(password, user.passwordHash)) {
          return { error: "密码不正确" };
        }
        // 历史明文自动升级为加盐哈希
        if (isLegacyPlain(user.passwordHash)) {
          db.update(schema.users)
            .set({ passwordHash: hashPassword(password) })
            .where(eq(schema.users.id, user.id))
            .run();
        }
      }

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatarEmoji: user.avatarEmoji,
          totalXp: user.totalXp,
          streakDays: user.streakDays,
        },
        token: makeToken(user),
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.Optional(t.String()),
      }),
    },
  )

  // 获取当前登录用户
  .get("/api/auth/me", ({ headers }) => {
    const userId = parseUserIdFromHeaders(headers);
    if (!userId) return { user: null };

    const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
    if (!user) return { user: null };

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatarEmoji: user.avatarEmoji,
        totalXp: user.totalXp,
        streakDays: user.streakDays,
      },
    };
  })

  // ─── 进度与草稿持久化 API（已登录保存在 SQLite）───

  // 获取单个草稿
  .get(
    "/api/progress/draft",
    ({ query, headers }) => {
      const userId = parseUserIdFromHeaders(headers);
      if (!userId) return { draft: null };

      const { typeCode, difficulty } = query;
      if (!typeCode) return { draft: null };

      const draft = db
        .select()
        .from(schema.userSavedGames)
        .where(
          and(
            eq(schema.userSavedGames.userId, userId),
            eq(schema.userSavedGames.typeCode, typeCode),
            eq(schema.userSavedGames.difficulty, difficulty || "medium"),
          ),
        )
        .get();

      if (!draft) return { draft: null };

      return {
        draft: {
          typeCode: draft.typeCode,
          difficulty: draft.difficulty,
          puzzleId: draft.puzzleId,
          givens: JSON.parse(draft.givens),
          userGrid: JSON.parse(draft.userGrid),
          candidates: JSON.parse(draft.candidates),
          elapsedMs: draft.elapsedMs,
          mistakes: draft.mistakes,
          updatedAt: draft.updatedAt,
        },
      };
    },
    {
      query: t.Object({
        typeCode: t.String(),
        difficulty: t.Optional(t.String()),
      }),
    },
  )

  // 获取用户所有进行中的草稿列表
  .get("/api/progress/active-drafts", ({ headers }) => {
    const userId = parseUserIdFromHeaders(headers);
    if (!userId) return [];

    const drafts = db
      .select()
      .from(schema.userSavedGames)
      .where(eq(schema.userSavedGames.userId, userId))
      .orderBy(desc(schema.userSavedGames.updatedAt))
      .all();

    return drafts.map((d) => ({
      typeCode: d.typeCode,
      difficulty: d.difficulty,
      puzzleId: d.puzzleId,
      givens: JSON.parse(d.givens),
      userGrid: JSON.parse(d.userGrid),
      elapsedMs: d.elapsedMs,
      mistakes: d.mistakes,
      updatedAt: d.updatedAt,
    }));
  })

  // 保存草稿
  .post(
    "/api/progress/draft",
    ({ body, headers }) => {
      const userId = parseUserIdFromHeaders(headers);
      if (!userId) return { saved: false, reason: "not_logged_in" };

      const {
        typeCode,
        difficulty,
        puzzleId,
        givens,
        userGrid,
        candidates,
        elapsedMs,
        mistakes,
      } = body;
      const now = new Date().toISOString();

      // upsert：利用唯一索引 user_type_diff_idx 一次写入，避免 select→insert/update 两次往返
      db.insert(schema.userSavedGames)
        .values({
          userId,
          typeCode,
          difficulty,
          puzzleId: puzzleId ?? null,
          givens: JSON.stringify(givens),
          userGrid: JSON.stringify(userGrid),
          candidates: JSON.stringify(candidates),
          elapsedMs: elapsedMs ?? 0,
          mistakes: mistakes ?? 0,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            schema.userSavedGames.userId,
            schema.userSavedGames.typeCode,
            schema.userSavedGames.difficulty,
          ],
          set: {
            puzzleId: puzzleId ?? null,
            givens: JSON.stringify(givens),
            userGrid: JSON.stringify(userGrid),
            candidates: JSON.stringify(candidates),
            elapsedMs: elapsedMs ?? 0,
            mistakes: mistakes ?? 0,
            updatedAt: now,
          },
        })
        .run();

      return { saved: true, updatedAt: now };
    },
    {
      body: t.Object({
        typeCode: t.String(),
        difficulty: t.String(),
        puzzleId: t.Optional(t.Number()),
        givens: t.Array(t.Number()),
        userGrid: t.Array(t.Number()),
        candidates: t.Array(t.Array(t.Number())),
        elapsedMs: t.Number(),
        mistakes: t.Number(),
      }),
    },
  )

  // 删除已完成或放弃的草稿
  .delete(
    "/api/progress/draft",
    ({ body, headers }) => {
      const userId = parseUserIdFromHeaders(headers);
      if (!userId) return { success: true };

      const { typeCode, difficulty } = body;
      db.delete(schema.userSavedGames)
        .where(
          and(
            eq(schema.userSavedGames.userId, userId),
            eq(schema.userSavedGames.typeCode, typeCode),
            eq(schema.userSavedGames.difficulty, difficulty),
          ),
        )
        .run();

      return { success: true };
    },
    {
      body: t.Object({
        typeCode: t.String(),
        difficulty: t.String(),
      }),
    },
  )

  // 游客登录时，批量合并本地草稿与历史记录到该用户
  .post(
    "/api/progress/sync-guest",
    ({ body, headers }) => {
      const userId = parseUserIdFromHeaders(headers);
      if (!userId) return { success: false, reason: "not_logged_in" };

      const { drafts, records } = body;

      // 同步草稿（用 upsert，避免每个草稿一次 select 的 N+1 查询）
      if (Array.isArray(drafts)) {
        for (const draft of drafts) {
          db.insert(schema.userSavedGames)
            .values({
              userId,
              typeCode: draft.typeCode,
              difficulty: draft.difficulty,
              puzzleId: draft.puzzleId ?? null,
              givens: JSON.stringify(draft.givens),
              userGrid: JSON.stringify(draft.userGrid),
              candidates: JSON.stringify(draft.candidates),
              elapsedMs: draft.elapsedMs ?? 0,
              mistakes: draft.mistakes ?? 0,
              updatedAt: draft.updatedAt || new Date().toISOString(),
            })
            .onConflictDoUpdate({
              target: [
                schema.userSavedGames.userId,
                schema.userSavedGames.typeCode,
                schema.userSavedGames.difficulty,
              ],
              set: {
                puzzleId: draft.puzzleId ?? null,
                givens: JSON.stringify(draft.givens),
                userGrid: JSON.stringify(draft.userGrid),
                candidates: JSON.stringify(draft.candidates),
                elapsedMs: draft.elapsedMs ?? 0,
                mistakes: draft.mistakes ?? 0,
                updatedAt: draft.updatedAt || new Date().toISOString(),
              },
            })
            .run();
        }
      }

      // 同步历史记录
      if (Array.isArray(records)) {
        for (const r of records) {
          db.insert(schema.practiceRecords)
            .values({
              userId,
              puzzleId: r.puzzleId ?? null,
              typeCode: r.typeCode,
              difficulty: r.difficulty,
              durationMs: r.durationMs,
              mistakes: r.mistakes,
              hintsUsed: r.hintsUsed ?? 0,
              completed: r.completed,
              xpEarned: r.xpEarned ?? 0,
              createdAt: r.createdAt || new Date().toISOString(),
            })
            .run();
        }
      }

      return { success: true };
    },
    {
      body: t.Object({
        drafts: t.Optional(
          t.Array(
            t.Object({
              typeCode: t.String(),
              difficulty: t.String(),
              puzzleId: t.Optional(t.Number()),
              givens: t.Array(t.Number()),
              userGrid: t.Array(t.Number()),
              candidates: t.Array(t.Array(t.Number())),
              elapsedMs: t.Number(),
              mistakes: t.Number(),
              updatedAt: t.Optional(t.String()),
            }),
          ),
        ),
        records: t.Optional(
          t.Array(
            t.Object({
              puzzleId: t.Optional(t.Number()),
              typeCode: t.String(),
              difficulty: t.String(),
              durationMs: t.Number(),
              mistakes: t.Number(),
              hintsUsed: t.Number(),
              completed: t.Boolean(),
              xpEarned: t.Optional(t.Number()),
              createdAt: t.Optional(t.String()),
            }),
          ),
        ),
      }),
    },
  )

  // ─── 提交练习结果 ───
  .post(
    "/api/practice",
    ({ body, headers }) => {
      const { puzzleId, typeCode, difficulty, durationMs, mistakes, hintsUsed, completed } = body;
      const xp = calcXp(difficulty, durationMs, mistakes, completed);
      const userId = parseUserIdFromHeaders(headers);

      if (userId) {
        // 记录练习 + 清草稿 + 更新技能统计 + 更新用户 XP，全部包在一个事务内，避免部分写入
        db.transaction((tx) => {
          tx.insert(schema.practiceRecords)
            .values({
              userId,
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

          tx.delete(schema.userSavedGames)
            .where(
              and(
                eq(schema.userSavedGames.userId, userId),
                eq(schema.userSavedGames.typeCode, typeCode),
                eq(schema.userSavedGames.difficulty, difficulty),
              ),
            )
            .run();

          const existing = tx
            .select()
            .from(schema.skillStats)
            .where(
              and(eq(schema.skillStats.userId, userId), eq(schema.skillStats.typeCode, typeCode)),
            )
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

            tx.update(schema.skillStats)
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
          } else {
            tx.insert(schema.skillStats)
              .values({
                userId,
                typeCode,
                totalAttempts: 1,
                completedCount: completed ? 1 : 0,
                totalDurationMs: durationMs,
                totalMistakes: mistakes,
                totalHints: hintsUsed,
                bestTimeMs: completed ? durationMs : null,
              })
              .run();
          }

          const user = tx.select().from(schema.users).where(eq(schema.users.id, userId)).get();
          if (user) {
            const today = new Date().toISOString().split("T")[0];
            const lastDate = user.lastPracticeDate;
            let streak = user.streakDays;
            if (lastDate !== today) {
              const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
              streak = lastDate === yesterday ? streak + 1 : 1;
            }
            tx.update(schema.users)
              .set({
                totalXp: user.totalXp + xp,
                streakDays: streak,
                lastPracticeDate: today,
              })
              .where(eq(schema.users.id, userId))
              .run();
          }
        });
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

  // ─── 技能统计 ───
  .get("/api/stats", ({ headers }) => {
    const userId = parseUserIdFromHeaders(headers);
    if (!userId) return [];

    const stats = db
      .select()
      .from(schema.skillStats)
      .where(eq(schema.skillStats.userId, userId))
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
        weakScore: calcWeakScore(
          s.totalAttempts,
          s.completedCount,
          avgDuration,
          avgMistakes,
          s.bestTimeMs,
        ),
      };
    });
  })

  // ─── 仪表盘 ───
  .get("/api/dashboard", ({ headers }) => {
    const userId = parseUserIdFromHeaders(headers);
    const user = userId
      ? db.select().from(schema.users).where(eq(schema.users.id, userId)).get()
      : null;

    const stats = userId
      ? db.select().from(schema.skillStats).where(eq(schema.skillStats.userId, userId)).all()
      : [];

    const recent = userId
      ? db
          .select()
          .from(schema.practiceRecords)
          .where(eq(schema.practiceRecords.userId, userId))
          .orderBy(desc(schema.practiceRecords.createdAt))
          .limit(10)
          .all()
      : [];

    const activeDrafts = userId
      ? db
          .select()
          .from(schema.userSavedGames)
          .where(eq(schema.userSavedGames.userId, userId))
          .orderBy(desc(schema.userSavedGames.updatedAt))
          .limit(5)
          .all()
      : [];

    // 按阶段分组题型
    const phases = [1, 2, 3, 4].map((phase) => {
      const phaseTypes = PUZZLE_TYPES.filter((t) => t.phase === phase);
      return {
        phase,
        name: PHASE_NAMES[phase] ?? `阶段 ${phase}`,
        totalTypes: phaseTypes.length,
        puzzleTypes: phaseTypes.map((t) => ({
          code: t.code,
          name: t.name,
          icon: t.icon,
          color: t.color,
          description: t.description,
          rules: t.rules,
          isFinals: t.isFinals,
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
        weakScore: calcWeakScore(
          s.totalAttempts,
          s.completedCount,
          avgDuration,
          avgMistakes,
          s.bestTimeMs,
        ),
      };
    });

    // 今日任务与推荐
    const today = new Date().toISOString().split("T")[0];
    const todayRecords = recent.filter((r) => (r.createdAt ?? "").startsWith(today));
    const todayCompleted = todayRecords.filter((r) => r.completed).length;
    const todayTarget = 3;

    const sortedByWeak = [...skillStats]
      .filter((s) => s.totalAttempts > 0)
      .sort((a, b) => b.weakScore - a.weakScore);

    const weakTypes = sortedByWeak.slice(0, 3).map((s) => {
      const def = getPuzzleType(s.typeCode);
      return {
        typeCode: s.typeCode,
        name: def?.name ?? s.typeCode,
        icon: def?.icon ?? "·",
        color: def?.color ?? "#0d9488",
        weakScore: s.weakScore,
      };
    });

    return {
      user: user
        ? {
            id: user.id,
            username: user.username,
            name: user.name,
            avatarEmoji: user.avatarEmoji,
            totalXp: user.totalXp,
            streakDays: user.streakDays,
          }
        : null,
      phases,
      skillStats,
      activeDrafts: activeDrafts.map((d) => ({
        typeCode: d.typeCode,
        difficulty: d.difficulty,
        puzzleId: d.puzzleId,
        elapsedMs: d.elapsedMs,
        updatedAt: d.updatedAt,
      })),
      recentPractice: recent.map((r) => ({
        id: r.id,
        typeCode: r.typeCode,
        difficulty: r.difficulty,
        durationMs: r.durationMs,
        mistakes: r.mistakes,
        completed: r.completed,
        createdAt: r.createdAt,
      })),
      todayProgress: {
        completed: todayCompleted,
        target: todayTarget,
        done: todayCompleted >= todayTarget,
      },
      weakTypes,
    };
  })

  // ─── 静态文件服务（生产环境，自托管时承担 SPA 兜底 + 安全头）───
  .get("*", async ({ path }) => {
    if (process.env.NODE_ENV !== "production") {
      return new Response("Not Found", { status: 404 });
    }
    const baseHeaders: Record<string, string> = {
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };

    const filePath = path === "/" ? "/index.html" : path;
    const file = Bun.file(`./dist${filePath}`);
    if (await file.exists()) {
      // 带哈希指纹的资源（如 /assets/*）长缓存，其余短缓存
      const cacheControl = /^\/assets\//.test(filePath)
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600";
      return new Response(file, { headers: { ...baseHeaders, "Cache-Control": cacheControl } });
    }
    const index = Bun.file("./dist/index.html");
    if (await index.exists()) {
      return new Response(index, { headers: baseHeaders });
    }
    return new Response("Not Found", { status: 404, headers: baseHeaders });
  });

// ─── 启动 ───
const PORT = parseInt(process.env.PORT ?? "3000");

// 确保 SQLite 表与种子配置就绪
try {
  runMigration();
  runSeed();

  // 清理 30 天前的旧题，避免每次生成都落库导致表无限膨胀
  // （被草稿引用的旧题删掉后，客户端已有 fallback：getPuzzle 404 时自动重新生成）
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
  db.delete(schema.puzzles).where(lt(schema.puzzles.createdAt, cutoff)).run();
  console.log(`🧹 已清理过期题目（早于 ${cutoff}）`);
} catch (e) {
  console.error("数据库自动初始化提示:", e);
}

if (process.env.NODE_ENV === "production") {
  app.listen(PORT);
  console.log(`🚀 生产服务器已启动: http://localhost:${PORT}`);
} else {
  app.listen(PORT);
  console.log(`📡 API 服务器已启动: http://localhost:${PORT}`);
}

export { app };
