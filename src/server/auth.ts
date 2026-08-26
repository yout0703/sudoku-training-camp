/**
 * 认证与密码工具
 * - 密码：node:crypto scrypt 加盐哈希（兼容历史明文，登录成功后自动升级）
 * - token：服务端密钥 HMAC-SHA256 签名，杜绝伪造 / 嗅探后冒用
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// 生产环境务必通过环境变量设置 AUTH_SECRET；未设置 / 为空时使用开发默认值并提示
let AUTH_SECRET = process.env.AUTH_SECRET?.trim() || "sudoku-training-dev-secret";
if (process.env.NODE_ENV === "production" && AUTH_SECRET === "sudoku-training-dev-secret") {
  console.warn(
    "⚠️  未设置 AUTH_SECRET，正在使用开发默认签名密钥。生产环境请务必通过环境变量设置随机密钥（openssl rand -hex 32）",
  );
}
const TOKEN_EXPIRY_MS = 1000 * 60 * 60 * 24 * 90; // 90 天

/** Worker 入口用环境 vars 注入密钥（来自 `env` / `[vars]`）；Bun 入口默认读 process.env */
export function setAuthSecret(secret?: string): void {
  const trimmed = secret?.trim();
  if (trimmed) AUTH_SECRET = trimmed;
}

// ─── 密码 ───

/** 生成 `salt:hash` 格式的密码哈希 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** 校验密码；兼容数据库里的历史明文（无盐分隔符） */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (!stored.includes(":")) return stored === password; // 历史明文
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/** 是否为历史明文（升级用） */
export function isLegacyPlain(stored: string): boolean {
  return !!stored && !stored.includes(":");
}

// ─── token ───

function sign(payload: string): string {
  return createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
}

/** 生成签名 token：`usr.<id>.<payload>.<sig>`（base64url 不含 `.`，可安全 split） */
export function makeToken(user: { id: number; username: string }): string {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, username: user.username, iat: Date.now() }),
  ).toString("base64url");
  const sig = sign(`${user.id}.${payload}`);
  return `usr.${user.id}.${payload}.${sig}`;
}

/** 从请求头解析用户 id；签名不匹配 / 过期返回 null */
export function parseUserIdFromHeaders(headers: Record<string, string | undefined>): number | null {
  const auth = headers["authorization"] || headers["x-user-token"];
  if (!auth) return null;
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : auth.trim();
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "usr") return null;
  const id = parseInt(parts[1], 10);
  if (isNaN(id)) return null;

  if (sign(`${id}.${parts[2]}`) !== parts[3]) return null; // 验签失败

  try {
    const payload = JSON.parse(Buffer.from(parts[2], "base64url").toString("utf8"));
    if (typeof payload.iat === "number" && Date.now() - payload.iat > TOKEN_EXPIRY_MS) return null;
  } catch {
    return null;
  }
  return id;
}
