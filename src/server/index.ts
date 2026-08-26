/**
 * Bun 服务器入口（本地开发 / 测试 / 单机自托管）
 * 一个进程同时提供 API 与前端静态资源。
 */
import { createApp } from "./app";
import { createBunDb, schema } from "./db/client";
import { runMigration } from "./db/migrate";
import { runSeed } from "./db/seed";
import { lt } from "drizzle-orm";

const db = createBunDb();
const app = createApp(db);

// ─── 静态文件服务（生产环境，自托管时承担 SPA 兜底 + 安全头）───
app.get("*", async ({ path }) => {
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

// 确保 SQLite 表与种子配置就绪，并清理过期旧题
try {
  runMigration();
  runSeed();

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
