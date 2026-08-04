/**
 * API 共享类型（前后端通用）
 */

/** 题型响应 */
export interface PuzzleTypeDTO {
  code: string;
  name: string;
  gridSize: number;
  boxRows: number;
  boxCols: number;
  variantType: string;
  description: string;
  rules: string;
  icon: string;
  color: string;
  phase: number;
  sortOrder: number;
  isFinals: boolean;
}

/** 题目响应 */
export interface PuzzleDTO {
  id: number;
  typeCode: string;
  difficulty: string;
  meta: { size: number; boxRows: number; boxCols: number };
  givens: number[];
  variantType: string;
  data: unknown; // VariantData JSON
  solution?: number[];
}

export interface LessonDTO {
  id: number;
  typeCode: string | null;
  phase: number;
  title: string;
  sortOrder: number;
  sections: Array<{
    type: string;
    title: string;
    content: string;
  }>;
  status: string; // locked | available | in_progress | completed
}

/** 练习提交 */
export interface PracticeSubmitDTO {
  puzzleId: number;
  typeCode: string;
  difficulty: string;
  durationMs: number;
  mistakes: number;
  hintsUsed: number;
  completed: boolean;
}

/** 技能统计 */
export interface SkillStatDTO {
  typeCode: string;
  totalAttempts: number;
  completedCount: number;
  completionRate: number;
  avgDurationMs: number;
  avgMistakes: number;
  bestTimeMs: number | null;
  weakScore: number; // 0-100, 越高越薄弱
}

/** 仪表盘数据 */
export interface DashboardDTO {
  user: {
    id: number;
    name: string;
    avatarEmoji: string;
    totalXp: number;
    streakDays: number;
  };
  phases: Array<{
    phase: number;
    name: string;
    totalLessons: number;
    completedLessons: number;
    puzzleTypes: Array<{ code: string; name: string; icon: string; color: string }>;
  }>;
  skillStats: SkillStatDTO[];
  recentPractice: Array<{
    id: number;
    typeCode: string;
    durationMs: number;
    mistakes: number;
    completed: boolean;
    createdAt: string;
  }>;
  recommendations: string[];
}
