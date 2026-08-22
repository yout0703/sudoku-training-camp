/**
 * 数独盘面：多尺寸、多变体
 * 对错只在交卷后标红，填数过程不给实时反馈
 * 格子尺寸随容器宽度自适应（手机 / iPad）
 */
import { memo, useMemo, useRef } from "react";
import { useGameStore } from "../stores/gameStore";
import { normalizeVariantData } from "../lib/variant";
import { computeCellSize, useContainerWidth } from "../hooks/useContainerWidth";
import type { PuzzleDTO } from "../../shared/api-types";
import type { CalcData, IrregularData, KillerData, ThermometerData } from "../../engine";

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
    borderRight: "1px solid rgba(34, 28, 22, 0.16)",
    borderBottom: "1px solid rgba(34, 28, 22, 0.16)",
  };
  if ((col + 1) % boxCols === 0 && col < size - 1) style.borderRight = "2.5px solid #221C16";
  if ((row + 1) % boxRows === 0 && row < size - 1) style.borderBottom = "2.5px solid #221C16";
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
    borderRight: "1px solid rgba(34, 28, 22, 0.16)",
    borderBottom: "1px solid rgba(34, 28, 22, 0.16)",
  };
  if (col < size - 1) {
    if (irregular.boxOf[idx + 1] !== myBox) style.borderRight = "2.5px solid #221C16";
  }
  if (row < size - 1) {
    if (irregular.boxOf[(row + 1) * size + col] !== myBox) style.borderBottom = "2.5px solid #221C16";
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
  const noteMode = useGameStore((s) => s.noteMode);

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

  const cageLabelCells = useMemo(() => {
    const set = new Set<number>();
    const cages = vdata.addSub?.cages ?? vdata.killer?.cages;
    if (!cages) return set;
    for (const cage of cages) {
      if (!cage.cells.length) continue;
      let min = cage.cells[0];
      for (const c of cage.cells) if (c < min) min = c;
      set.add(min);
    }
    return set;
  }, [vdata]);

  const candCols = size <= 4 ? 2 : 3;
  const candFont = size <= 4 ? 11 : size <= 6 ? 10 : 8;

  return (
    <div ref={shellRef} className={`relative w-full ${className}`}>
      <div className="relative mx-auto" style={{ width: cellSize * size + thick * 2 }}>
      <div
        className="grid overflow-hidden rounded-2xl bg-surface shadow-[4px_4px_0_var(--color-ink)]"
        style={{
          width: cellSize * size + thick * 2,
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
          border: `${thick}px solid #2B2622`,
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

          let bg = "bg-surface";
          if (isError) bg = "bg-danger-soft";
          else if (isDemoHL) bg = "bg-yellow-soft";
          else if (isSelected && noteMode) bg = "bg-orange-soft ring-2 ring-inset ring-orange";
          else if (isSelected) bg = "bg-[#FFD84D] ring-2 ring-inset ring-ink";
          else if (sameValue) bg = "bg-[#FFEAA3]";
          else if (inSameArea) bg = "bg-[#FFF9EC]";
          else if ((onMainDiag || onAntiDiag) && !isSelected) bg = "bg-purple-soft/50";

          const isGreyFortress = fortress?.grey[i] === 1;
          const isGreyBig = bigSmall?.grey[i] === 1;
          if ((isGreyFortress || isGreyBig) && !isSelected && !isError && !isDemoHL) {
            bg = "bg-surface-sunken";
          }
          if ((isGreyFortress || isGreyBig) && isSelected) {
            bg = noteMode ? "bg-orange-soft ring-2 ring-inset ring-orange" : "bg-[#FFD84D] ring-2 ring-inset ring-ink";
          }

          const parity = oddEven?.parity[i];
          const cands = candidates[i];
          const showCandidates = !readOnly && !value && cands && cands.size > 0;

          return (
            <div
              key={i}
              className={`${bg} relative flex items-center justify-center transition-all duration-100 ${
                readOnly ? "" : "cursor-pointer active:scale-95"
              }`}
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
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    background: "linear-gradient(135deg, transparent 46%, #8B5CF6 47%, #8B5CF6 53%, transparent 54%)",
                  }}
                />
              )}
              {onAntiDiag && (
                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    background: "linear-gradient(45deg, transparent 46%, #8B5CF6 47%, #8B5CF6 53%, transparent 54%)",
                  }}
                />
              )}

              {parity === 1 && (
                <div
                  className="pointer-events-none absolute rounded-full border-2 border-blue bg-blue/10"
                  style={{ width: "72%", height: "72%" }}
                />
              )}
              {parity === 2 && (
                <div
                  className="pointer-events-none absolute rounded-[6px] border-2 border-blue bg-blue/10"
                  style={{ width: "72%", height: "72%" }}
                />
              )}

              {value !== 0 && (
                <span
                  className="relative z-10 select-none font-black tabular font-sans transition-transform"
                  style={{
                    fontSize,
                    color: isError ? "#E84D4D" : isGiven ? "#221C16" : "#147B8E",
                  }}
                >
                  {value}
                </span>
              )}

              {isSelected && noteMode && !readOnly && (
                <div
                  className="pointer-events-none absolute rounded-[6px]"
                  style={{
                    inset: 3,
                    border: "2px dashed #FF772A",
                  }}
                />
              )}

              {showCandidates && (
                <div
                  className="pointer-events-none absolute inset-0 grid"
                  style={{
                    gridTemplateColumns: `repeat(${candCols}, 1fr)`,
                    padding: cageLabelCells.has(i) ? "11px 2px 2px" : "3px",
                    fontSize: candFont,
                  }}
                >
                  {Array.from({ length: size }).map((_, ci) => {
                    const num = ci + 1;
                    return (
                      <div
                        key={num}
                        className="flex items-center justify-center font-semibold tabular text-ink-muted"
                      >
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

      <div
        className="pointer-events-none absolute"
        style={{ left: thick, top: thick, width: cellSize * size, height: cellSize * size }}
      >
        {consecPairs && <ConsecutiveMarks pairs={consecPairs} size={size} cellSize={cellSize} />}
        {sum56 && <Sum56Marks sums={sum56} size={size} cellSize={cellSize} />}
        {vdata.killer && (
          <KillerCageMarks data={vdata.killer as KillerData} size={size} cellSize={cellSize} />
        )}
        {vdata.addSub && (
          <CalcCageMarks data={vdata.addSub} size={size} cellSize={cellSize} />
        )}
        {vdata.thermometer && (
          <ThermoMarks data={vdata.thermometer} size={size} cellSize={cellSize} />
        )}
        {vdata.greaterThan && (
          <GTMarks data={vdata.greaterThan} size={size} cellSize={cellSize} />
        )}
        {vdata.ratio && <RatioMarks data={vdata.ratio} size={size} cellSize={cellSize} />}
      </div>
      </div>
    </div>
  );
}

export const SudokuGrid = memo(SudokuGridBase);

function renderCageContour(
  cells: number[],
  size: number,
  cellSize: number,
  keyPrefix: string,
  color = "#E04F4F",
) {
  const set = new Set(cells);
  const inset = 3;
  const lines: React.ReactNode[] = [];

  for (const cell of cells) {
    const r = Math.floor(cell / size);
    const c = cell % size;
    const x0 = c * cellSize;
    const x1 = (c + 1) * cellSize;
    const y0 = r * cellSize;
    const y1 = (r + 1) * cellSize;

    const hasTop = set.has((r - 1) * size + c);
    const hasBottom = set.has((r + 1) * size + c);
    const hasLeft = set.has(r * size + (c - 1));
    const hasRight = set.has(r * size + (c + 1));

    // 顶部外边线
    if (!hasTop) {
      const lx = x0 + (hasLeft ? 0 : inset);
      const rx = x1 - (hasRight ? 0 : inset);
      lines.push(
        <div
          key={`${keyPrefix}-${cell}-T`}
          className="pointer-events-none absolute"
          style={{
            left: lx,
            top: y0 + inset,
            width: rx - lx,
            height: 0,
            borderTop: `2px dashed ${color}`,
          }}
        />,
      );
    }

    // 底部外边线
    if (!hasBottom) {
      const lx = x0 + (hasLeft ? 0 : inset);
      const rx = x1 - (hasRight ? 0 : inset);
      lines.push(
        <div
          key={`${keyPrefix}-${cell}-B`}
          className="pointer-events-none absolute"
          style={{
            left: lx,
            top: y1 - inset,
            width: rx - lx,
            height: 0,
            borderTop: `2px dashed ${color}`,
          }}
        />,
      );
    }

    // 左侧外边线
    if (!hasLeft) {
      const ty = y0 + (hasTop ? 0 : inset);
      const by = y1 - (hasBottom ? 0 : inset);
      lines.push(
        <div
          key={`${keyPrefix}-${cell}-L`}
          className="pointer-events-none absolute"
          style={{
            left: x0 + inset,
            top: ty,
            width: 0,
            height: by - ty,
            borderLeft: `2px dashed ${color}`,
          }}
        />,
      );
    }

    // 右侧外边线
    if (!hasRight) {
      const ty = y0 + (hasTop ? 0 : inset);
      const by = y1 - (hasBottom ? 0 : inset);
      lines.push(
        <div
          key={`${keyPrefix}-${cell}-R`}
          className="pointer-events-none absolute"
          style={{
            left: x1 - inset,
            top: ty,
            width: 0,
            height: by - ty,
            borderLeft: `2px dashed ${color}`,
          }}
        />,
      );
    }
  }

  return lines;
}

function CalcCageMarks({
  data,
  size,
  cellSize,
}: {
  data: CalcData;
  size: number;
  cellSize: number;
}) {
  const marks: React.ReactNode[] = [];

  for (let ci = 0; ci < data.cages.length; ci++) {
    const cage = data.cages[ci];
    if (cage.cells.length < 2) continue;

    // 寻找最左上的格用于放标签
    let topCell = cage.cells[0];
    let topR = Math.floor(topCell / size);
    let topC = topCell % size;
    for (const c of cage.cells) {
      const r = Math.floor(c / size);
      const col = c % size;
      if (r < topR || (r === topR && col < topC)) {
        topCell = c;
        topR = r;
        topC = col;
      }
    }

    marks.push(
      ...renderCageContour(cage.cells, size, cellSize, `calc-${ci}`, "#0E7490"),
    );

    marks.push(
      <div
        key={`calc-lab-${ci}`}
        className="pointer-events-none absolute z-20 flex items-center rounded bg-surface/95 px-1 text-[9px] font-black leading-none text-[#0E7490] shadow-[0.5px_0.5px_0_var(--color-ink)] border border-[#0E7490]/40"
        style={{ left: topC * cellSize + 4, top: topR * cellSize + 4 }}
      >
        {cage.target}
        {cage.op}
      </div>,
    );
  }

  return <>{marks}</>;
}

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
  const diameter = Math.max(16, Math.min(22, Math.round(cellSize * 0.4)));
  const halfD = diameter / 2;

  for (const [pair, sum] of sums) {
    const [a, b] = pair.split("-").map(Number);
    const ra = Math.floor(a / size);
    const ca = a % size;
    const rb = Math.floor(b / size);
    const cb = b % size;
    const isHorizontal = ra === rb;

    const cx = isHorizontal
      ? Math.max(ca, cb) * cellSize
      : ca * cellSize + cellSize / 2;
    const cy = isHorizontal
      ? ra * cellSize + cellSize / 2
      : Math.max(ra, rb) * cellSize;

    marks.push(
      <div
        key={pair}
        className="pointer-events-none absolute z-20 flex items-center justify-center rounded-full border-2 border-ink bg-surface font-black text-ink shadow-[1px_1px_0_var(--color-ink)]"
        style={{
          left: cx - halfD,
          top: cy - halfD,
          width: diameter,
          height: diameter,
          fontSize: Math.max(9, Math.round(diameter * 0.58)),
          lineHeight: 1,
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

    // 寻找最左上的格用于放提示数
    let topCell = cage.cells[0];
    let topR = Math.floor(topCell / size);
    let topC = topCell % size;
    for (const c of cage.cells) {
      const r = Math.floor(c / size);
      const col = c % size;
      if (r < topR || (r === topR && col < topC)) {
        topCell = c;
        topR = r;
        topC = col;
      }
    }

    marks.push(
      ...renderCageContour(cage.cells, size, cellSize, `killer-${ci}`, "#E04F4F"),
    );

    marks.push(
      <div
        key={`sum-${ci}`}
        className="pointer-events-none absolute z-20 flex items-center rounded bg-surface/95 px-1 text-[9px] font-black leading-none text-[#E04F4F] shadow-[0.5px_0.5px_0_var(--color-ink)] border border-[#E04F4F]/40"
        style={{ left: topC * cellSize + 4, top: topR * cellSize + 4 }}
      >
        {cage.sum}
      </div>,
    );
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
    const rb = Math.floor(b / size);
    const cb = b % size;
    const isH = ra === rb;
    const cx = isH ? Math.max(ca, cb) * cellSize : ca * cellSize + cellSize / 2;
    const cy = isH ? ra * cellSize + cellSize / 2 : Math.max(ra, rb) * cellSize;
    marks.push(
      <div
        key={pair}
        className="pointer-events-none absolute z-20 flex items-center justify-center rounded border border-ink bg-surface px-1 text-[9px] font-black text-ink shadow-[1px_1px_0_var(--color-ink)]"
        style={{
          left: cx - 11,
          top: cy - 7.5,
          minWidth: 22,
          height: 15,
          lineHeight: "13px",
        }}
      >
        {ratio}
      </div>,
    );
  }
  return <>{marks}</>;
}
