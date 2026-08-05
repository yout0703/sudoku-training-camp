/**
 * 课程内嵌交互演示盘面
 * 固定小盘面 + 分步高亮讲解
 */
import { useState } from "react";
import { SudokuGrid } from "./SudokuGrid";
import { Button } from "./ui/primitives";
import type { PuzzleDTO } from "../../shared/api-types";

export interface DemoStep {
  /** 讲解文案 */
  text: string;
  /** 高亮格子 */
  highlight: number[];
  /** 本步填入后的盘面（逐步揭晓） */
  grid: number[];
}

export interface LessonDemoDef {
  title: string;
  puzzle: PuzzleDTO;
  steps: DemoStep[];
}

interface Props {
  demo: LessonDemoDef;
}

export function LessonDemo({ demo }: Props) {
  const [step, setStep] = useState(0);
  const current = demo.steps[step];
  const atEnd = step >= demo.steps.length - 1;
  const atStart = step === 0;

  return (
    <div className="overflow-hidden rounded-2xl bg-surface-elevated shadow-card">
      <div className="border-b border-ink/6 px-4 py-3">
        <p className="text-xs font-semibold text-accent-600">互动演示</p>
        <h4 className="text-sm font-bold text-ink">{demo.title}</h4>
      </div>

      <div className="flex flex-col items-center gap-4 px-4 py-5">
        <SudokuGrid
          puzzle={demo.puzzle}
          readOnly
          displayGrid={current.grid}
          highlightCells={current.highlight}
        />

        <div className="w-full rounded-xl bg-accent-50 px-3.5 py-3">
          <p className="text-xs font-medium text-accent-700 mb-1">
            步骤 {step + 1} / {demo.steps.length}
          </p>
          <p className="text-sm leading-relaxed text-ink">{current.text}</p>
        </div>

        <div className="flex w-full gap-2">
          <Button
            variant="secondary"
            block
            disabled={atStart}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            上一步
          </Button>
          <Button
            variant="primary"
            block
            disabled={atEnd}
            onClick={() => setStep((s) => Math.min(demo.steps.length - 1, s + 1))}
          >
            {atEnd ? "完成" : "下一步"}
          </Button>
        </div>
        {atEnd && (
          <button
            type="button"
            className="text-xs font-medium text-ink-muted"
            onClick={() => setStep(0)}
          >
            重新演示
          </button>
        )}
      </div>
    </div>
  );
}

/** 第一课：唯一数法演示（4×4） */
export const DEMO_UNIQUE_4: LessonDemoDef = {
  title: "找唯一数",
  puzzle: {
    id: 0,
    typeCode: "standard_4",
    difficulty: "easy",
    meta: { size: 4, boxRows: 2, boxCols: 2 },
    givens: [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    variantType: "standard",
    data: null,
    solution: [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1],
  },
  steps: [
    {
      text: "看第一行：已经有 1 和 2。我们先看右上宫（前两行的后两列）。",
      highlight: [0, 1],
      grid: [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      text: "假设第二行也给出了一些数。注意：右上宫还缺数字。",
      highlight: [2, 3, 6, 7],
      grid: [1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      text: "第一行还缺 3 和 4。第三列已经有……我们用排除：若第 0 行第 2 格只能是 3。",
      highlight: [2],
      grid: [1, 2, 3, 0, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      text: "第一行最后一个空格只能是 4。这就是「唯一数法」：同行/列/宫排除后只剩一个可能。",
      highlight: [3],
      grid: [1, 2, 3, 4, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  ],
};

/** 对角线规则演示 */
export const DEMO_DIAGONAL_6: LessonDemoDef = {
  title: "对角线也是约束",
  puzzle: {
    id: 0,
    typeCode: "diagonal_6",
    difficulty: "easy",
    meta: { size: 4, boxRows: 2, boxCols: 2 },
    givens: [0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
    variantType: "diagonal",
    data: null,
  },
  steps: [
    {
      text: "两条对角线（X）上的数字也不能重复，和行、列、宫一样重要。",
      highlight: [0, 5, 10, 15, 3, 6, 9, 12],
      grid: [0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
    },
    {
      text: "主对角线上已有提示时，同对角其他格要排除该数字。",
      highlight: [0, 5, 10, 15],
      grid: [4, 0, 2, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
    },
    {
      text: "填数时记得四条约束：行、列、宫、对角线。信息越多，越容易推。",
      highlight: [0, 5, 10, 15],
      grid: [4, 3, 2, 1, 1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3],
    },
  ],
};

/** 根据 typeCode / 课程标题匹配演示 */
export function getDemoForLesson(typeCode: string | null, title: string): LessonDemoDef | null {
  if (title.includes("认识数独") || typeCode === "standard_4") return DEMO_UNIQUE_4;
  if (typeCode === "diagonal_6" || title.includes("对角线")) return DEMO_DIAGONAL_6;
  if (typeCode === "standard_6" || typeCode === "standard_9") return DEMO_UNIQUE_4;
  return DEMO_UNIQUE_4; // 默认给一个演示
}
