/**
 * API 客户端
 */
import type {
  PuzzleTypeDTO,
  PuzzleDTO,
  LessonDTO,
  SkillStatDTO,
  DashboardDTO,
  PracticeSubmitDTO,
} from "../shared/api-types";

const BASE = "/api";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  getPuzzleTypes: () => fetchJSON<PuzzleTypeDTO[]>("/puzzle-types"),

  generatePuzzle: (typeCode: string, difficulty?: string) =>
    fetchJSON<PuzzleDTO>("/puzzles/generate", {
      method: "POST",
      body: JSON.stringify({ typeCode, difficulty }),
    }),

  getPuzzle: (id: number) => fetchJSON<PuzzleDTO>(`/puzzles/${id}`),

  submitPractice: (data: PracticeSubmitDTO) =>
    fetchJSON<{ success: boolean; xpEarned: number }>("/practice", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getLessons: () => fetchJSON<LessonDTO[]>("/lessons"),
  getLesson: (id: number) => fetchJSON<LessonDTO & { sections: unknown[] }>(`/lessons/${id}`),
  updateLesson: (id: number, status: string) =>
    fetchJSON<{ success: boolean }>(`/lessons/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  /** 重置全部课程进度（全部重新开放） */
  resetLessons: () =>
    fetchJSON<{ success: boolean; resetCount: number }>("/lessons/reset", {
      method: "POST",
    }),

  getStats: () => fetchJSON<SkillStatDTO[]>("/stats"),
  getDashboard: () => fetchJSON<DashboardDTO>("/dashboard"),
  getAnalysis: () =>
    fetchJSON<{
      summary: string;
      weakPoints: string[];
      recommendations: string[];
      encouragement: string;
      generatedAt: string;
    }>("/analysis"),
};
