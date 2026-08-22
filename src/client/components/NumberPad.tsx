/**
 * 数字键盘：专业数独人机工程学控制台
 * 统一 5 键功能工具栏 + 规整数字矩阵，杜绝挤压变形与文字折行
 */
import { useGameStore } from "../stores/gameStore";
import { IconPencil, IconEraser, IconUndo, IconRedo, IconLightbulb } from "./ui/Icons";

interface Props {
  size: number;
}

export function NumberPad({ size }: Props) {
  const inputNumber = useGameStore((s) => s.inputNumber);
  const eraseCell = useGameStore((s) => s.eraseCell);
  const noteMode = useGameStore((s) => s.noteMode);
  const toggleNoteMode = useGameStore((s) => s.toggleNoteMode);
  const undo = useGameStore((s) => s.undo);
  const redo = useGameStore((s) => s.redo);
  const useHint = useGameStore((s) => s.useHint);
  const historyLen = useGameStore((s) => s.history.length);
  const futureLen = useGameStore((s) => s.future.length);
  const userGrid = useGameStore((s) => s.userGrid);
  const candidates = useGameStore((s) => s.candidates);
  const selectedCell = useGameStore((s) => s.selectedCell);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const canUndo = historyLen > 0;
  const canRedo = futureLen > 0;

  const counts = Array.from({ length: size + 1 }, () => 0);
  for (const v of userGrid) {
    if (v > 0 && v <= size) counts[v]++;
  }

  const selectedMarks =
    selectedCell !== null && candidates[selectedCell] ? candidates[selectedCell] : null;

  // 4 宫格一行 4 列，6 宫格和 9 宫格每行 3 列
  const gridColsClass = size <= 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className="mx-auto flex w-full flex-col gap-2.5 sm:gap-3">
      {/* 顶部状态栏：剩余空格与提示计数 */}
      <div className="flex items-center justify-between px-1 text-xs font-black text-ink-muted">
        <div className="inline-flex items-center gap-1.5 rounded-full border-1.5 border-ink bg-surface px-3 py-0.5 shadow-[1.5px_1.5px_0_var(--color-ink)]">
          <span>剩余空格</span>
          <strong className="tabular text-ink font-black text-sm">
            {userGrid.filter((v) => v === 0).length}
          </strong>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border-1.5 border-ink bg-surface px-3 py-0.5 shadow-[1.5px_1.5px_0_var(--color-ink)]">
          <span>已用提示</span>
          <strong className="tabular text-orange font-black text-sm">{hintsUsed}</strong>
        </div>
      </div>

      {/* 专业功能工具条：撤销、重做、擦除、笔记、提示（5 键等宽矩形排布） */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          aria-label="撤销"
          className="touch-manipulation flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-ink bg-surface py-2 text-ink shadow-[2.5px_2.5px_0_var(--color-ink)] transition-all hover:bg-yellow-soft active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <IconUndo className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-[11px] font-black leading-none">撤销</span>
        </button>

        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          aria-label="重做"
          className="touch-manipulation flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-ink bg-surface py-2 text-ink shadow-[2.5px_2.5px_0_var(--color-ink)] transition-all hover:bg-yellow-soft active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <IconRedo className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-[11px] font-black leading-none">重做</span>
        </button>

        <button
          type="button"
          onClick={eraseCell}
          aria-label="擦除"
          className="touch-manipulation flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-ink bg-surface py-2 text-ink shadow-[2.5px_2.5px_0_var(--color-ink)] transition-all hover:bg-orange-soft active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <IconEraser className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-[11px] font-black leading-none">擦除</span>
        </button>

        <button
          type="button"
          onClick={toggleNoteMode}
          aria-pressed={noteMode}
          aria-label="笔记模式"
          className={`touch-manipulation flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-ink py-2 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
            noteMode
              ? "bg-yellow text-ink shadow-[2.5px_2.5px_0_var(--color-ink)] ring-2 ring-orange"
              : "bg-surface text-ink shadow-[2.5px_2.5px_0_var(--color-ink)] hover:bg-yellow-soft"
          }`}
        >
          <IconPencil className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-[11px] font-black leading-none">
            {noteMode ? "笔记中" : "笔记"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => useHint()}
          aria-label="获取提示"
          className="touch-manipulation flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-ink bg-blue text-white py-2 shadow-[2.5px_2.5px_0_var(--color-ink)] transition-all hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <IconLightbulb className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-[11px] font-black leading-none">提示</span>
        </button>
      </div>

      {/* 主数字按键矩阵：整整齐齐的正方/圆角矩形 */}
      <div className={`grid gap-2 ${gridColsClass}`}>
        {Array.from({ length: size }).map((_, i) => {
          const num = i + 1;
          const remaining = size - counts[num];
          const done = remaining <= 0 && !noteMode;
          const marked = Boolean(noteMode && selectedMarks?.has(num));

          return (
            <button
              key={num}
              type="button"
              onClick={() => inputNumber(num)}
              disabled={done}
              aria-label={noteMode ? `标记候选数 ${num}` : `填入数字 ${num}`}
              className={`touch-manipulation relative flex flex-col items-center justify-center rounded-2xl border-2 border-ink py-3 transition-all duration-100 ${
                size <= 4 ? "aspect-[4/3]" : "aspect-[1.1/1]"
              } ${
                done
                  ? "bg-paper-sunken/60 text-ink-faint border-ink/30 cursor-not-allowed opacity-45 shadow-none"
                  : marked
                  ? "bg-yellow text-ink shadow-[3px_3px_0_var(--color-ink)] -translate-y-0.5"
                  : noteMode
                  ? "bg-yellow-soft text-ink shadow-[3px_3px_0_var(--color-ink)] hover:bg-yellow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  : "bg-surface text-ink shadow-[3px_3px_0_var(--color-ink)] hover:bg-orange-soft active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              }`}
            >
              <span
                className={`block leading-none tabular font-black ${
                  noteMode ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
                }`}
              >
                {num}
              </span>
              {!done && !noteMode && (
                <span className="mt-1.5 block text-[10px] font-bold text-ink-muted leading-none">
                  余 {remaining}
                </span>
              )}
              {done && (
                <span className="mt-1 block text-[10px] font-black text-green leading-none">
                  ✓ 完成
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
