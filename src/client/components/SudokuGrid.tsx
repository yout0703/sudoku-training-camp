/**
 * 数独盘面：多尺寸、多变体、错误高亮
 * 格子尺寸随容器宽度自适应（手机 / iPad）
 */
import { memo, useEffect, useMemo, useRef } from "react";
import { useGameStore } from "../stores/gameStore";
import { normalizeVariantData } from "../lib/variant";
import { computeCellSize, useContainerWidth } from "../hooks/useContainerWidth";
import type { PuzzleDTO } from "../../shared/api-types";
import type { IrregularData, KillerData, ThermometerData } from "../../engine";

interface Props {
  puzzle: PuzzleDTO;
  /** 只读演示（课程） */
  readOnly?: boolean;
  /** 高亮格子索引（演示用） */
  highlightCells?: number[];
  /** 覆盖显示的盘面（演示用） */
  displayGrid?: number[];
  /** 外层最大宽度 class，默认占满父容器 */
  className?: string;
}

function getBorderStyle(
  row: number,
  col: number,
  size: number,
  boxRows: number,
  boxCols: number,
  irregular?: IrregularData,
): React.CSSProperties {
  if (irregular) return getIrregularBorders(row, col, size, irregular);
  const style: React.CSSProperties = {
    borderRight: "1px solid #c5d4ce",
    borderBottom: "1px solid #c5d4ce",
  };
  if ((col + 1) % boxCols === 0 && col < size - 1) style.borderRight = "3px solid #1a2e28";
  if ((row + 1) % boxRows === 0 && row < size - 1) style.borderBottom = "3px solid #1a2e28";
  return style;
}

function getIrregularBorders(
  row: number,
  col: number,
  size: number,
  irregular: IrregularData,
): React.CSSProperties {
  const idx = row * size + col;
  const myBox = irregular.boxOf[idx];
  const style: React.CSSProperties = {
    borderRight: "1px solid #c5d4ce",
    borderBottom: "1px solid #c5d4ce",
  };
  if (col < size - 1) {
    if (irregular.boxOf[idx + 1] !== myBox) style.borderRight = "3px solid #1a2e28";
  }
  if (row < size - 1) {
    if (irregular.boxOf[(row + 1) * size + col] !== myBox) style.borderBottom = "3px solid #1a2e28";
  }
  return style;
}

function SudokuGridBase({ puzzle, readOnly, highlightCells, displayGrid, className = "" }: Props) {
  const { meta, variantType, data: rawData } = puzzle;
  const { size, boxRows, boxCols } = meta;
  const total = size * size;

  const shellRef = useRef<HTMLDivElement>(null);
  const shellWidth = useContainerWidth(shellRef, 320);
  const cellSize = useMemo(() => computeCellSize(size, shellWidth), [size, shellWidth]);
  const fontSize = Math.max(14, Math.round(cellSize * (size <= 4 ? 0.44 : size <= 6 ? 0.42 : 0.4)));
  const thick = cellSize >= 56 ? 3 : 2;

  const vdata = useMemo(() => normalizeVariantData(rawData), [rawData]);
  const userGrid = useGameStore((s) => s.userGrid);
  const candidates = useGameStore((s) => s.candidates);
  const selectedCell = useGameStore((s) => s.selectedCell);
  const selectCell = useGameStore((s) => s.selectCell);
  const givensArr = useGameStore((s) => s.givens);
  const errorCells = useGameStore((s) => s.errorCells);
  const flashError = useGameStore((s) => s.flashError);
  const clearFlash = useGameStore((s) => s.clearFlash);

  useEffect(() => {
    if (flashError === null) return;
    const t = setTimeout(() => clearFlash(), 450);
    return () => clearTimeout(t);
  }, [flashError, clearFlash]);

  const grid = displayGrid ?? userGrid;
  const selectedValue = !readOnly && selectedCell !== null ? grid[selectedCell] : 0;

  const highlightInfo = useMemo(() => {
    if (readOnly || selectedCell === null) return null;
    const sr = Math.floor(selectedCell / size);
    const sc = selectedCell % size;
    return { sr, sc, selectedCell };
  }, [selectedCell, size, readOnly]);

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
  const bigSmall = vdata.bigSmall;
  const errorSet = useMemo(() => new Set(errorCells), [errorCells]);
  const demoHL = useMemo(() => new Set(highlightCells ?? []), [highlightCells]);

  const consecPairs = useMemo(() => {
    if (variantType !== "consecutive" || !vdata.consecutive) return null;
    return vdata.consecutive.pairs;
  }, [variantType, vdata]);

  const sum56 = useMemo(() => {
    if (variantType !== "sum_56" || !vdata.sum56) return null;
    return vdata.sum56.sums;
  }, [variantType, vdata]);

  return (
    <div ref={shellRef} className={`relative w-full ${className}`}>
      <div
        className="mx-auto grid overflow-hidden rounded-2xl bg-surface-elevated shadow-card"
        style={{
          width: cellSize * size + thick * 2,
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
          border: `${thick}px solid #1a2e28`,
        }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const row = Math.floor(i / size);
          const col = i % size;
          const value = grid[i] ?? 0;
          const isGiven = displayGrid
            ? puzzle.givens[i] !== 0
            : (givensArr[i] ?? puzzle.givens[i]) !== 0;
          const isSelected = !readOnly && selectedCell === i;
          const isError = !readOnly && errorSet.has(i) && !isGiven;
          const isFlash = !readOnly && flashError === i;
          const inSameArea =
            highlightInfo &&
            (row === highlightInfo.sr ||
              col === highlightInfo.sc ||
              (irregular
                ? irregular.boxOf[i] === irregular.boxOf[selectedCell!]
                : Math.floor(row / boxRows) === Math.floor(highlightInfo.sr / boxRows) &&
                  Math.floor(col / boxCols) === Math.floor(highlightInfo.sc / boxCols)));
          const sameValue = selectedValue !== 0 && value === selectedValue && value !== 0;
          const onMainDiag = diagCells?.main.has(i);
          const onAntiDiag = diagCells?.anti.has(i);
          const isDemoHL = demoHL.has(i);

          let bg = "bg-surface-elevated";
          if (isFlash) bg = "bg-danger-soft";
          else if (isError) bg = "bg-danger-soft/70";
          else if (isDemoHL) bg = "bg-accent-100";
          else if (isSelected) bg = "bg-accent-200";
          else if (sameValue) bg = "bg-accent-100";
          else if (inSameArea) bg = "bg-surface";

          const isGreyFortress = fortress?.grey[i] === 1;
          const isGreyBig = bigSmall?.grey[i] === 1;
          if ((isGreyFortress || isGreyBig) && !isSelected && !isError && !isFlash && !isDemoHL) {
            bg = "bg-surface-sunken";
          }
          if ((isGreyFortress || isGreyBig) && isSelected) bg = "bg-accent-300";

          const parity = oddEven?.parity[i];
          const cands = candidates[i];
          const showCandidates = !readOnly && !value && cands && cands.size > 0;

          return (
            <div
              key={i}
              className={`${bg} relative flex items-center justify-center transition-colors duration-150 ${
                readOnly ? "" : "cursor-pointer"
              } ${isFlash ? "animate-pulse" : ""}`}
              style={{
                ...getBorderStyle(row, col, size, boxRows, boxCols, irregular),
                width: cellSize,
                height: cellSize,
              }}
              onClick={() => {
                if (!readOnly) selectCell(i);
              }}
            >
              {onMainDiag && (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    width: `${cellSize * Math.SQRT2}px`,
                    height: "1.5px",
                    background: "rgba(147,51,234,0.28)",
                    transform: "rotate(45deg)",
                    transformOrigin: "center",
                  }}
                />
              )}
              {onAntiDiag && (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    width: `${cellSize * Math.SQRT2}px`,
                    height: "1.5px",
                    background: "rgba(147,51,234,0.28)",
                    transform: "rotate(-45deg)",
                    transformOrigin: "center",
                  }}
                />
              )}

              {parity === 1 && (
                <div
                  className="pointer-events-none absolute rounded-full"
                  style={{ width: "70%", height: "70%", border: "2px solid #0891b2" }}
                />
              )}
              {parity === 2 && (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    width: "70%",
                    height: "70%",
                    border: "2px solid #0891b2",
                    borderRadius: "3px",
                  }}
                />
              )}

              {value !== 0 && (
                <span
                  className="relative z-10 select-none font-bold tabular"
                  style={{
                    fontSize,
                    color: isError || isFlash ? "#dc2626" : isGiven ? "#1a2e28" : "#0d9488",
                  }}
                >
                  {value}
                </span>
              )}

              {showCandidates && (
                <div
                  className="pointer-events-none absolute inset-0 grid p-0.5"
                  style={{
                    gridTemplateColumns: `repeat(${size <= 4 ? 2 : 3}, 1fr)`,
                    gridTemplateRows: `repeat(${size <= 4 ? 2 : 3}, 1fr)`,
                    fontSize: size <= 4 ? 10 : size <= 6 ? 9 : 8,
                  }}
                >
                  {Array.from({ length: size <= 4 ? 4 : 9 }).map((_, ci) => {
                    const num = ci + 1;
                    return (
                      <div key={num} className="flex items-center justify-center text-ink-faint">
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

      {consecPairs && <ConsecutiveMarks pairs={consecPairs} size={size} cellSize={cellSize} />}
      {sum56 && <Sum56Marks sums={sum56} size={size} cellSize={cellSize} />}
      {vdata.killer && (
        <KillerCageMarks data={vdata.killer as KillerData} size={size} cellSize={cellSize} />
      )}
      {vdata.thermometer && (
        <ThermoMarks data={vdata.thermometer} size={size} cellSize={cellSize} />
      )}
      {vdata.greaterThan && (
        <GTMarks data={vdata.greaterThan} size={size} cellSize={cellSize} />
      )}
      {vdata.ratio && <RatioMarks data={vdata.ratio} size={size} cellSize={cellSize} />}
    </div>
  );
}

export const SudokuGrid = memo(SudokuGridBase);

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
        className="pointer-events-none absolute bg-ink"
        style={
          isHorizontal
            ? { left: left - 2, top: top + 4, width: 3, height: cellSize - 8 }
            : { left: left + 4, top: top - 2, width: cellSize - 8, height: 3 }
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
        className="pointer-events-none absolute flex items-center justify-center rounded-full border border-warning bg-warning-soft font-bold text-warning"
        style={{ left: left - 11, top: top - 11, width: 22, height: 22, fontSize: 11 }}
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
    let minCell = cage.cells[0];
    for (const c of cage.cells) if (c < minCell) minCell = c;
    const mr = Math.floor(minCell / size);
    const mc = minCell % size;
    marks.push(
      <div
        key={`sum-${ci}`}
        className="pointer-events-none absolute z-20 text-[10px] font-bold text-danger"
        style={{ left: mc * cellSize + 2, top: mr * cellSize + 1 }}
      >
        {cage.sum}
      </div>,
    );
    for (const cell of cage.cells) {
      const r = Math.floor(cell / size);
      const c = cell % size;
      marks.push(
        <div
          key={`cage-${ci}-${cell}`}
          className="pointer-events-none absolute"
          style={{
            left: c * cellSize + 1,
            top: r * cellSize + 1,
            width: cellSize - 2,
            height: cellSize - 2,
            border: "1.5px dashed #dc2626",
            borderRadius: 4,
          }}
        />,
      );
    }
  }
  return <>{marks}</>;
}

function ThermoMarks({
  data,
  size,
  cellSize,
}: {
  data: ThermometerData;
  size: number;
  cellSize: number;
}) {
  const marks: React.ReactNode[] = [];
  for (let ti = 0; ti < data.thermos.length; ti++) {
    const cells = data.thermos[ti].cells;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const r = Math.floor(cell / size);
      const c = cell % size;
      const cx = c * cellSize + cellSize / 2;
      const cy = r * cellSize + cellSize / 2;
      if (i === 0) {
        marks.push(
          <div
            key={`bulb-${ti}`}
            className="pointer-events-none absolute rounded-full bg-danger/25 ring-2 ring-danger/40"
            style={{ left: cx - 10, top: cy - 10, width: 20, height: 20 }}
          />,
        );
      }
      if (i < cells.length - 1) {
        const next = cells[i + 1];
        const nr = Math.floor(next / size);
        const nc = next % size;
        const nx = nc * cellSize + cellSize / 2;
        const ny = nr * cellSize + cellSize / 2;
        const dx = nx - cx;
        const dy = ny - cy;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        marks.push(
          <div
            key={`seg-${ti}-${i}`}
            className="pointer-events-none absolute origin-left bg-danger/30"
            style={{
              left: cx,
              top: cy - 2,
              width: len,
              height: 4,
              transform: `rotate(${angle}deg)`,
              borderRadius: 2,
            }}
          />,
        );
      }
    }
  }
  return <>{marks}</>;
}

function GTMarks({
  data,
  size,
  cellSize,
}: {
  data: { horizontal: Map<string, string>; vertical: Map<string, string> };
  size: number;
  cellSize: number;
}) {
  const marks: React.ReactNode[] = [];
  for (const [key, sym] of data.horizontal) {
    const [r, c] = key.split(",").map(Number);
    marks.push(
      <div
        key={`h-${key}`}
        className="pointer-events-none absolute z-20 text-[11px] font-bold text-ink-muted"
        style={{
          left: (c + 1) * cellSize - 6,
          top: r * cellSize + cellSize / 2 - 8,
        }}
      >
        {sym}
      </div>,
    );
  }
  for (const [key, sym] of data.vertical) {
    const [r, c] = key.split(",").map(Number);
    const ch = sym === "v" ? "∨" : "∧";
    marks.push(
      <div
        key={`v-${key}`}
        className="pointer-events-none absolute z-20 text-[11px] font-bold text-ink-muted"
        style={{
          left: c * cellSize + cellSize / 2 - 5,
          top: (r + 1) * cellSize - 8,
        }}
      >
        {ch}
      </div>,
    );
  }
  return <>{marks}</>;
}

function RatioMarks({
  data,
  size,
  cellSize,
}: {
  data: { ratios: Map<string, string> };
  size: number;
  cellSize: number;
}) {
  const marks: React.ReactNode[] = [];
  for (const [pair, ratio] of data.ratios) {
    const [a, b] = pair.split("-").map(Number);
    const ra = Math.floor(a / size);
    const ca = a % size;
    const isH = Math.floor(b / size) === ra;
    const left = isH ? (ca + 1) * cellSize - 10 : ca * cellSize + cellSize / 2 - 10;
    const top = isH ? ra * cellSize + cellSize / 2 - 8 : (ra + 1) * cellSize - 8;
    marks.push(
      <div
        key={pair}
        className="pointer-events-none absolute z-20 rounded bg-accent-50 px-0.5 text-[9px] font-bold text-accent-700"
        style={{ left, top }}
      >
        {ratio}
      </div>,
    );
  }
  return <>{marks}</>;
}
