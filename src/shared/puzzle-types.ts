/**
 * 题型目录 — 基于 10-12 岁组比赛说明
 * phase: 1=入门 2=基础变体 3=进阶变体 4=高阶
 */

export interface PuzzleTypeDef {
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

export const PUZZLE_TYPES: PuzzleTypeDef[] = [
  // ─── Phase 1: 入门 ───
  {
    code: "standard_4",
    name: "四宫标准数独",
    gridSize: 4,
    boxRows: 2,
    boxCols: 2,
    variantType: "standard",
    description: "4×4 小盘面，填入 1-4",
    rules: "将数字 1-4 填入空格内，使每行、每列及每宫内数字均不重复。",
    icon: "🌱",
    color: "#22c55e",
    phase: 1,
    sortOrder: 1,
    isFinals: false,
  },
  {
    code: "standard_6",
    name: "六宫标准数独",
    gridSize: 6,
    boxRows: 2,
    boxCols: 3,
    variantType: "standard",
    description: "6×6 盘面，填入 1-6",
    rules: "将数字 1-6 填入空格内，使每行、每列及每宫内数字均不重复。",
    icon: "⭐",
    color: "#3b82f6",
    phase: 1,
    sortOrder: 2,
    isFinals: false,
  },
  {
    code: "standard_9",
    name: "九宫标准数独",
    gridSize: 9,
    boxRows: 3,
    boxCols: 3,
    variantType: "standard",
    description: "9×9 经典盘面，填入 1-9",
    rules: "将数字 1-9 填入空格内，使每行、每列及每宫内数字均不重复。",
    icon: "🏆",
    color: "#8b5cf6",
    phase: 1,
    sortOrder: 3,
    isFinals: false,
  },

  // ─── Phase 2: 基础变体 ───
  {
    code: "diagonal_6",
    name: "六宫对角线数独",
    gridSize: 6,
    boxRows: 2,
    boxCols: 3,
    variantType: "diagonal",
    description: "标准规则 + 两条对角线也不能重复",
    rules: "将数字 1-6 填入空格内，使每行、每列、每宫以及两条对角线上的数字均不重复。",
    icon: "✖️",
    color: "#ec4899",
    phase: 2,
    sortOrder: 4,
    isFinals: false,
  },
  {
    code: "odd_even_6",
    name: "六宫奇偶数独",
    gridSize: 6,
    boxRows: 2,
    boxCols: 3,
    variantType: "odd_even",
    description: "方块格只能填偶数，圆格只能填奇数",
    rules: "将数字 1-6 填入空格内，使每行、每列、每宫内数字均不重复。含正方形的空格内只能填偶数（2、4、6），含圆形的空格内只能填奇数（1、3、5）。",
    icon: "🔷",
    color: "#06b6d4",
    phase: 2,
    sortOrder: 5,
    isFinals: false,
  },
  {
    code: "killer_4",
    name: "四宫杀手数独",
    gridSize: 4,
    boxRows: 2,
    boxCols: 2,
    variantType: "killer",
    description: "虚线框内数字之和等于提示数",
    rules: "将数字 1-4 填入空格内，使每行、每列、每宫内的数字均不重复。虚线框内提示数表示该框内所有数字之和，同一虚线框内不能出现相同的数字。",
    icon: "🎯",
    color: "#ef4444",
    phase: 2,
    sortOrder: 6,
    isFinals: true,
  },

  // ─── Phase 3: 进阶变体 ───
  {
    code: "irregular_6",
    name: "六宫不规则数独",
    gridSize: 6,
    boxRows: 2,
    boxCols: 3,
    variantType: "irregular",
    description: "宫的形状不规则，不是长方形",
    rules: "将数字 1-6 填入空格内，使每行、每列、每个不规则粗线宫内的数字均不重复。",
    icon: "🧩",
    color: "#f59e0b",
    phase: 3,
    sortOrder: 7,
    isFinals: false,
  },
  {
    code: "consecutive_6",
    name: "六宫连续数独",
    gridSize: 6,
    boxRows: 2,
    boxCols: 3,
    variantType: "consecutive",
    description: "粗线标记的两格数字差值为 1",
    rules: "将数字 1-6 填入空格内，使每行、每列、每宫内的数字均不重复。两格之间的粗线标记表示这两格为连续数，差值为 1，所有符合该条件的均已标出。",
    icon: "🔗",
    color: "#10b981",
    phase: 3,
    sortOrder: 8,
    isFinals: true,
  },
  {
    code: "sum56_6",
    name: "六宫五六数独",
    gridSize: 6,
    boxRows: 2,
    boxCols: 3,
    variantType: "sum_56",
    description: "圆圈中的 5/6 表示两侧格内数字之和",
    rules: "将数字 1-6 填入空格内，使每行、每列、每宫内数字均不重复。盘面内圆圈中的数字 5 和 6 分别表示两侧格内数字之和，相邻两格中间没有圆圈则两侧格内数字之和不能为 5 和 6。",
    icon: "🔮",
    color: "#a855f7",
    phase: 3,
    sortOrder: 9,
    isFinals: false,
  },
  {
    code: "fortress_6",
    name: "六宫堡垒数独",
    gridSize: 6,
    boxRows: 2,
    boxCols: 3,
    variantType: "fortress",
    description: "灰格内数字大于相邻白格",
    rules: "将数字 1-6 填入空格内，使每行、每列及每宫内数字均不重复。灰色格内数字大于相邻白色格内数字。",
    icon: "🏰",
    color: "#64748b",
    phase: 3,
    sortOrder: 10,
    isFinals: true,
  },

  // ─── Phase 4: 高阶 ───
  {
    code: "antiknight_6",
    name: "六宫无马数独",
    gridSize: 6,
    boxRows: 2,
    boxCols: 3,
    variantType: "anti_knight",
    description: "马步位置的两格不能相同",
    rules: "将数字 1-6 填入空格内，使每行、每列、每宫内数字均不重复。彼此形成国际象棋中马步位置（二拐一）关系的两格内不能出现相同的数字。",
    icon: "♞",
    color: "#dc2626",
    phase: 4,
    sortOrder: 11,
    isFinals: true,
  },
];

export const PHASE_NAMES: Record<number, string> = {
  1: "🌱 入门基础",
  2: "⭐ 基础变体",
  3: "🔥 进阶变体",
  4: "🏆 高阶挑战",
};

/** 根据代码获取题型 */
export function getPuzzleType(code: string): PuzzleTypeDef | undefined {
  return PUZZLE_TYPES.find((t) => t.code === code);
}
