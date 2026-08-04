/**
 * 数独盘面组件
 * 支持多尺寸（4/6/9）、多种变体渲染、平板触控交互
 */
import { memo, useMemo } from "react";
import { useGameStore } from "../stores/gameStore";
import type { PuzzleDTO } from "../../shared/api-types";
import type {
  VariantData,
  OddEvenData,
  FortressData,
  KillerData,
  ConsecutiveData,
  Sum56Data,
  IrregularData,
} from "../../engine";

interface Props {
  puzzle: PuzzleDTO;
}

/** 安全读取变体数据 */
function useVariantData(data: unknown): VariantData {
  return (data as VariantData) ?? {};
}

/** 计算格子边框样式 */
function getBorderStyle(
  row: number,
  col: number,
  size: number,
  boxRows: number,
  boxCols: number,
  irregular?: IrregularData,
): React.CSSProperties {
  if (irregular) {
    return getIrregularBorders(row, col, size, irregular);
  }
  const style: React.CSSProperties = {
    borderRight: "1px solid #cbd5e1",
    borderBottom: "1px solid #cbd5e1",
  };
  if ((col + 1) % boxCols === 0 && col < size - 1) {
    style.borderRight = "3px solid #1e293b";
  }
  if ((row + 1) % boxRows === 0 && row < size - 1) {
    style.borderBottom = "3px solid #1e293b";
  }
  return style;
}

/** 不规则宫的边框计算 */
function getIrregularBorders(
  row: number,
  col: number,
  size: number,
  irregular: IrregularData,
): React.CSSProperties {
  const idx = row * size + col;
  const myBox = irregular.boxOf[idx];
  const style: React.CSSProperties = {
    borderRight: "1px solid #cbd5e1",
    borderBottom: "1px solid #cbd5e1",
  };
  // 右边
  if (col < size - 1) {
    const rightBox = irregular.boxOf[idx + 1];
    if (rightBox !== myBox) style.borderRight = "3px solid #1e293b";
  }
  // 下边
  if (row < size - 1) {
    const downBox = irregular.boxOf[(row + 1) * size + col];
    if (downBox !== myBox) style.borderBottom = "3px solid #1e293b";
  }
  return style;
}

function SudokuGridBase({ puzzle }: Props) {
  const { meta, givens, variantType, data: rawData } = puzzle;
  const { size, boxRows, boxCols } = meta;
  const total = size * size;

  const vdata = useVariantData(rawData);
  const userGrid = useGameStore((s) => s.userGrid);
  const candidates = useGameStore((s) => s.candidates);
  const selectedCell = useGameStore((s) => s.selectedCell);
  const selectCell = useGameStore((s) => s.selectCell);
  const givensArr = useGameStore((s) => s.givens);

  const selectedValue = selectedCell !== null ? userGrid[selectedCell] : 0;

  // 预计算每个格子的同区高亮
  const highlightInfo = useMemo(() => {
    if (selectedCell === null) return null;
    const sr = Math.floor(selectedCell / size);
    const sc = selectedCell % size;
    return { sr, sc, selectedCell };
  }, [selectedCell, size]);

  // 对角线格子集合
  const diagCells = useMemo(() => {
    if (variantType !== "diagonal") return null;
    const main = new Set<number>();
    const anti = new Set<number>();
    for (let i = 0; i < size; i++) {
      main.add(i * size + i);
      anti.add(i * size + (size - 1 - i));
    }
    return { main, anti };
  }, [variantType, size]);

  const oddEven = vdata.oddEven;
  const fortress = vdata.fortress;
  const irregular = vdata.irregular;

  // 连续数独粗线标记
  const consecPairs = useMemo(() => {
    if (variantType !== "consecutive" || !vdata.consecutive) return null;
    return (vdata.consecutive as ConsecutiveData).pairs;
  }, [variantType, vdata]);

  // 五六数独圆圈
  const sum56 = useMemo(() => {
    if (variantType !== "sum_56" || !vdata.sum56) return null;
    return (vdata.sum56 as Sum56Data).sums;
  }, [variantType, vdata]);

  const cellSize = size <= 4 ? 72 : size <= 6 ? 56 : 42;
  const fontSize = size <= 4 ? 32 : size <= 6 ? 26 : 20;

  return (
    <div className="relative inline-block">
      {/* 外框 */}
      <div
        className="grid rounded-xl overflow-hidden bg-white shadow-lg"
        style={{
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
          borderTop: "3px solid #1e293b",
          borderLeft: "3px solid #1e293b",
          borderRight: "3px solid #1e293b",
        }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const row = Math.floor(i / size);
          const col = i % size;
          const value = userGrid[i];
          const isGiven = givensArr[i] !== 0;
          const isSelected = selectedCell === i;
          const inSameArea =
            highlightInfo &&
            (row === highlightInfo.sr ||
              col === highlightInfo.sc ||
              (irregular
                ? irregular.boxOf[i] === irregular.boxOf[selectedCell!]
                : Math.floor(row / boxRows) === Math.floor(highlightInfo.sr / boxRows) &&
                  Math.floor(col / boxCols) === Math.floor(highlightInfo.sc / boxCols)));
          const sameValue = selectedValue !== 0 && value === selectedValue && value !== 0;

          // 对角线高亮
          const onMainDiag = diagCells?.main.has(i);
          const onAntiDiag = diagCells?.anti.has(i);

          // 背景色
          let bg = "bg-white";
          if (isSelected) bg = "bg-brand-200";
          else if (sameValue) bg = "bg-brand-100";
          else if (inSameArea) bg = "bg-slate-50";

          // 堡垒灰格
          const isGreyCell = fortress?.grey[i] === 1;
          if (isGreyCell && !isSelected) bg = "bg-slate-200";
          if (isGreyCell && isSelected) bg = "bg-brand-300";

          // 奇偶标记
          const parity = oddEven?.parity[i];

          const cands = candidates[i];
          const showCandidates = !value && cands && cands.size > 0;

          return (
            <div
              key={i}
              className={`${bg} flex items-center justify-center cursor-pointer relative transition-colors`}
              style={{
                ...getBorderStyle(row, col, size, boxRows, boxCols, irregular),
                width: `${cellSize}px`,
                height: `${cellSize}px`,
              }}
              onClick={() => selectCell(i)}
            >
              {/* 对角线标记 */}
              {onMainDiag && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    width: `${cellSize * Math.SQRT2}px`,
                    height: "1.5px",
                    background: "rgba(168,85,247,0.25)",
                    transform: "rotate(45deg)",
                    transformOrigin: "center",
                  }}
                />
              )}
              {onAntiDiag && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    width: `${cellSize * Math.SQRT2}px`,
                    height: "1.5px",
                    background: "rgba(168,85,247,0.25)",
                    transform: "rotate(-45deg)",
                    transformOrigin: "center",
                  }}
                />
              )}

              {/* 奇偶标记 */}
              {parity === 1 && (
                <div
                  className="absolute pointer-events-none rounded-full"
                  style={{ width: "70%", height: "70%", border: "2px solid #3b82f6" }}
                />
              )}
              {parity === 2 && (
                <div
                  className="absolute pointer-events-none"
                  style={{ width: "70%", height: "70%", border: "2px solid #3b82f6", borderRadius: "3px" }}
                />
              )}

              {/* 数字 */}
              {value !== 0 && (
                <span
                  className="font-bold select-none relative z-10"
                  style={{
                    fontSize: `${fontSize}px`,
                    color: isGiven ? "#1e293b" : "#4f46e5",
                  }}
                >
                  {value}
                </span>
              )}

              {/* 候选数 */}
              {showCandidates && (
                <div
                  className="absolute inset-0 grid p-0.5 pointer-events-none"
                  style={{
                    gridTemplateColumns: `repeat(${size <= 4 ? 2 : 3}, 1fr)`,
                    gridTemplateRows: `repeat(${size <= 4 ? 2 : 3}, 1fr)`,
                    fontSize: `${size <= 4 ? 10 : size <= 6 ? 9 : 8}px`,
                  }}
                >
                  {Array.from({ length: size <= 4 ? 4 : 9 }).map((_, ci) => {
                    const num = ci + 1;
                    return (
                      <div key={num} className="flex items-center justify-center text-slate-400">
                        {cands.has(num) ? num : ""}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 连续数独的粗线标记（覆盖在网格上） */}
      {consecPairs && (
        <ConsecutiveMarks pairs={consecPairs} size={size} cellSize={cellSize} />
      )}

      {/* 五六数独的圆圈标记 */}
      {sum56 && <Sum56Marks sums={sum56} size={size} cellSize={cellSize} />}

      {/* 杀手笼标记 */}
      {vdata.killer && <KillerCageMarks data={vdata.killer as KillerData} size={size} cellSize={cellSize} />}
    </div>
  );
}

export const SudokuGrid = memo(SudokuGridBase);

// ─── 变体标记子组件 ───

function ConsecutiveMarks({
  pairs,
  size,
  cellSize,
}: {
  pairs: Set<string>;
  size: number;
  cellSize: number;
}) {
  const marks: React.ReactNode[] = [];
  for (const pair of pairs) {
    const [a, b] = pair.split("-").map(Number);
    const ra = Math.floor(a / size);
    const ca = a % size;
    const rb = Math.floor(b / size);
    const cb = b % size;
    const isHorizontal = ra === rb;
    const left = Math.max(ca, cb) * cellSize;
    const top = Math.max(ra, rb) * cellSize;
    marks.push(
      <div
        key={pair}
        className="absolute bg-slate-800 pointer-events-none"
        style={
          isHorizontal
            ? { left: `${left - 2}px`, top: `${top + 4}px`, width: "3px", height: `${cellSize - 8}px` }
            : { left: `${left + 4}px`, top: `${top - 2}px`, width: `${cellSize - 8}px`, height: "3px" }
        }
      />,
    );
  }
  return <>{marks}</>;
}

function Sum56Marks({
  sums,
  size,
  cellSize,
}: {
  sums: Map<string, number>;
  size: number;
  cellSize: number;
}) {
  const marks: React.ReactNode[] = [];
  for (const [pair, sum] of sums) {
    const [a, b] = pair.split("-").map(Number);
    const ra = Math.floor(a / size);
    const ca = a % size;
    const isHorizontal = Math.floor(b / size) === ra;
    const left = isHorizontal ? (ca + 0.5) * cellSize + 3 : ca * cellSize + cellSize / 2;
    const top = isHorizontal ? ra * cellSize + cellSize / 2 : (ra + 0.5) * cellSize + 3;
    marks.push(
      <div
        key={pair}
        className="absolute rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center pointer-events-none font-bold text-amber-700"
        style={{
          left: `${left - 11}px`,
          top: `${top - 11}px`,
          width: "22px",
          height: "22px",
          fontSize: "11px",
        }}
      >
        {sum}
      </div>,
    );
  }
  return <>{marks}</>;
}

function KillerCageMarks({
  data,
  size,
  cellSize,
}: {
  data: KillerData;
  size: number;
  cellSize: number;
}) {
  const marks: React.ReactNode[] = [];
  for (let ci = 0; ci < data.cages.length; ci++) {
    const cage = data.cages[ci];
    // 找到笼子中最小 row/col 的格子放 sum 标签
    let minCell = cage.cells[0];
    for (const c of cage.cells) {
      if (c < minCell) minCell = c;
    }
    const mr = Math.floor(minCell / size);
    const mc = minCell % size;
    marks.push(
      <div
        key={`sum-${ci}`}
        className="absolute pointer-events-none text-[10px] font-bold text-red-600 z-20"
        style={{ left: `${mc * cellSize + 2}px`, top: `${mr * cellSize + 1}px` }}
      >
        {cage.sum}
      </div>,
    );
    // 每个格子的虚线边框
    for (const cell of cage.cells) {
      const r = Math.floor(cell / size);
      const c = cell % size;
      marks.push(
        <div
          key={`cage-${ci}-${cell}`}
          className="absolute pointer-events-none"
          style={{
            left: `${c * cellSize + 1}px`,
            top: `${r * cellSize + 1}px`,
            width: `${cellSize - 2}px`,
            height: `${cellSize - 2}px`,
            border: "1.5px dashed #dc2626",
            borderRadius: "4px",
          }}
        />,
      );
    }
  }
  return <>{marks}</>;
}
