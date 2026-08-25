/**
 * 数独引擎核心类型定义
 */

/** 宫格大小 */
export type GridSize = 4 | 5 | 6 | 9;

/** 盘面元数据 */
export interface GridMetadata {
  size: GridSize;
  /** 每宫的行数 */
  boxRows: number;
  /** 每宫的列数 */
  boxCols: number;
}

/** 盘面数据：扁平数组，0 = 空格，1..N = 已填数字 */
export type Grid = Int8Array;

/** 题目（不含变体约束的标准题） */
export interface StandardPuzzle {
  meta: GridMetadata;
  givens: number[];
  solution: number[];
}

/** 变体类型枚举 */
export type VariantType =
  | "standard"
  | "diagonal"
  | "irregular"
  | "killer"
  | "odd_even"
  | "consecutive"
  | "fortress"
  | "sum_56"
  | "anti_knight"
  | "thermometer"
  | "greater_than"
  | "arrow"
  | "extra_region"
  | "big_small"
  | "connected"
  | "ratio"
  | "product"
  | "add_sub";

/** 难度等级 */
export type Difficulty = "easy" | "medium" | "hard" | "expert";

/** 生成参数 */
export interface GenerateOptions {
  /** 盘面元数据（GenerateOptions 使用方已单独传 meta，此处可选，避免生成函数默认值报类型错） */
  meta?: GridMetadata;
  difficulty?: Difficulty;
  /** 目标空格数（若指定则优先于 difficulty） */
  clueCount?: number;
  /** 随机种子 */
  seed?: number;
}

/** 解题步骤 / 提示 */
export interface SolveStep {
  technique: string;
  cell: number;
  value: number;
  description: string;
}

/** 解题结果 */
export interface SolveResult {
  solution: Grid | null;
  steps: SolveStep[];
  isUnique: boolean;
}

/** 单元格坐标 */
export interface CellCoord {
  row: number;
  col: number;
}

// ─── 变体约束数据 ───

/** 不规则宫：每个格子属于哪个宫（box index） */
export interface IrregularData {
  /** cell → boxIndex 映射 */
  boxOf: Int8Array;
  /** boxIndex → cell[] 映射 */
  boxCells: number[][];
}

/** 杀手笼 */
export interface KillerCage {
  cells: number[];
  sum: number;
}
export interface KillerData {
  cages: KillerCage[];
}

/** 奇偶约束 */
export interface OddEvenData {
  /** cell → 'odd' | 'even' | null */
  parity: Int8Array; // 0 = none, 1 = odd, 2 = even
}

/** 连续约束（粗线标记的相邻格） */
export interface ConsecutiveData {
  /** "cellA-cellB" 对的集合，表示两格连续 */
  pairs: Set<string>;
}

/** 堡垒约束（灰格大于相邻白格） */
export interface FortressData {
  /** 灰格标记：1 = grey, 0 = white */
  grey: Int8Array;
}

/** 五六数独约束 */
export interface Sum56Data {
  /** "cellA-cellB" → 目标和 (5 或 6) */
  sums: Map<string, number>;
}

/** 温度计 */
export interface Thermometer {
  /** 温度计上的格子序列，从圆点（最小）到末端（最大） */
  cells: number[];
}
export interface ThermometerData {
  thermos: Thermometer[];
}

/** 不等号约束 */
export interface GreaterThanData {
  /** 水平不等号: "r,c" → '>' | '<' (左格 vs 右格) */
  horizontal: Map<string, ">" | "<">;
  /** 垂直不等号: "r,c" → '^' | 'v' (上格 vs 下格) */
  vertical: Map<string, "^" | "v">;
}

/** 大小数约束 */
export interface BigSmallData {
  /** 灰格只能填较大数，白格只能填较小数 */
  grey: Int8Array;
  bigValues: number[];
  smallValues: number[];
}

/** 额外区域 */
export interface ExtraRegionData {
  /** 额外区域：每个区域是一组格子 */
  regions: number[][];
}

/** 箭头数独 */
export interface ArrowData {
  arrows: { circle: number; body: number[] }[];
}

/** 比例数独：相邻格比值为 a/b */
export interface RatioData {
  /** "cellA-cellB" → "a/b" 例如 "1/2" */
  ratios: Map<string, string>;
}

/** 加减数独笼：框内数字按 + 或 - 运算得到提示数 */
export type CalcOp = "+" | "-";
export interface CalcCage {
  cells: number[];
  target: number;
  op: CalcOp;
}
export interface CalcData {
  cages: CalcCage[];
}

/** 所有变体数据的并集 */
export interface VariantData {
  irregular?: IrregularData;
  killer?: KillerData;
  oddEven?: OddEvenData;
  consecutive?: ConsecutiveData;
  fortress?: FortressData;
  sum56?: Sum56Data;
  thermometer?: ThermometerData;
  greaterThan?: GreaterThanData;
  bigSmall?: BigSmallData;
  extraRegion?: ExtraRegionData;
  arrow?: ArrowData;
  ratio?: RatioData;
  addSub?: CalcData;
}

/** 完整题目（含变体） */
export interface Puzzle {
  meta: GridMetadata;
  variant: VariantType;
  givens: number[];
  solution: number[];
  data?: VariantData;
}

/** 默认宫格配置 */
export const DEFAULT_META: Record<GridSize, GridMetadata> = {
  4: { size: 4, boxRows: 2, boxCols: 2 },
  5: { size: 5, boxRows: 5, boxCols: 1 }, // 五阶无标准宫，用额外区域
  6: { size: 6, boxRows: 2, boxCols: 3 },
  9: { size: 9, boxRows: 3, boxCols: 3 },
};
