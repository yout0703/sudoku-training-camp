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

/** 练习提交 */
export interface PracticeSubmitDTO {
  puzzleId?: number;
  typeCode: string;
  difficulty: string;
  durationMs: number;
  mistakes: number;
  hintsUsed: number;
  completed: boolean;
}

/** 游戏草稿 */
export interface SavedDraftDTO {
  typeCode: string;
  difficulty: string;
  puzzleId?: number;
  givens: number[];
  userGrid: number[];
  candidates: number[][]; // 每个格子的候选数列表
  elapsedMs: number;
  mistakes: number;
  updatedAt?: string;
}

/** 用户信息 */
export interface UserDTO {
  id: number;
  username: string;
  name: string;
  avatarEmoji: string;
  totalXp: number;
  streakDays: number;
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
  user: UserDTO | null;
  phases: Array<{
    phase: number;
    name: string;
    totalTypes: number;
    puzzleTypes: Array<{
      code: string;
      name: string;
      icon: string;
      color: string;
      description: string;
      rules: string;
      isFinals: boolean;
    }>;
  }>;
  skillStats: SkillStatDTO[];
  activeDrafts: Array<{
    typeCode: string;
    difficulty: string;
    puzzleId?: number;
    elapsedMs: number;
    updatedAt: string;
  }>;
  recentPractice: Array<{
    id: number;
    typeCode: string;
    difficulty: string;
    durationMs: number;
    mistakes: number;
    completed: boolean;
    createdAt: string;
  }>;
  todayProgress: {
    completed: number;
    target: number;
    done: boolean;
  };
  weakTypes: Array<{
    typeCode: string;
    name: string;
    icon: string;
    color: string;
    weakScore: number;
  }>;
}
