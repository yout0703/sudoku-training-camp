/**
 * API 客户端：支持用户认证、题目生成、云端草稿读写与统计
 */
import type {
  PuzzleTypeDTO,
  PuzzleDTO,
  SkillStatDTO,
  DashboardDTO,
  PracticeSubmitDTO,
  SavedDraftDTO,
  UserDTO,
} from "../shared/api-types";

const BASE = "/api";
const TOKEN_KEY = "sudoku_auth_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${url}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt}`);
  }
  return res.json();
}

export const api = {
  // ─── 题型与题目 ───
  getPuzzleTypes: () => fetchJSON<PuzzleTypeDTO[]>("/puzzle-types"),

  generatePuzzle: (typeCode: string, difficulty?: string, seed?: number) =>
    fetchJSON<PuzzleDTO>("/puzzles/generate", {
      method: "POST",
      body: JSON.stringify({ typeCode, difficulty, seed }),
    }),

  getPuzzle: (id: number) => fetchJSON<PuzzleDTO>(`/puzzles/${id}`),

  // ─── 认证 ───
  quickLogin: (username: string, name?: string, password?: string) =>
    fetchJSON<{ success?: boolean; user?: UserDTO; token?: string; error?: string }>(
      "/auth/quick-login",
      {
        method: "POST",
        body: JSON.stringify({ username, name, password }),
      },
    ),

  login: (username: string, password?: string) =>
    fetchJSON<{ success?: boolean; user?: UserDTO; token?: string; error?: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  register: (data: { username: string; password?: string; name?: string; avatarEmoji?: string }) =>
    fetchJSON<{ success?: boolean; user?: UserDTO; token?: string; error?: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  getMe: () => fetchJSON<{ user: UserDTO | null }>("/auth/me"),

  // ─── 云端草稿读写 ───
  getDraft: (typeCode: string, difficulty?: string) =>
    fetchJSON<{ draft: SavedDraftDTO | null }>(
      `/progress/draft?typeCode=${encodeURIComponent(typeCode)}&difficulty=${encodeURIComponent(
        difficulty || "medium",
      )}`,
    ),

  getActiveDrafts: () => fetchJSON<SavedDraftDTO[]>("/progress/active-drafts"),

  saveDraft: (draft: SavedDraftDTO) =>
    fetchJSON<{ saved: boolean; reason?: string }>("/progress/draft", {
      method: "POST",
      body: JSON.stringify(draft),
    }),

  deleteDraft: (typeCode: string, difficulty: string) =>
    fetchJSON<{ success: boolean }>("/progress/draft", {
      method: "DELETE",
      body: JSON.stringify({ typeCode, difficulty }),
    }),

  syncGuestData: (drafts: SavedDraftDTO[], records: PracticeSubmitDTO[]) =>
    fetchJSON<{ success: boolean }>("/progress/sync-guest", {
      method: "POST",
      body: JSON.stringify({ drafts, records }),
    }),

  // ─── 练习提交与统计 ───
  submitPractice: (data: PracticeSubmitDTO) =>
    fetchJSON<{ success: boolean; xpEarned: number }>("/practice", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getStats: () => fetchJSON<SkillStatDTO[]>("/stats"),
  getDashboard: () => fetchJSON<DashboardDTO>("/dashboard"),
};
