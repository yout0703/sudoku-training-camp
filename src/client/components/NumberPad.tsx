/**
 * 数字键盘：填数 + 比赛同款「标记」
 */
import { useGameStore } from "../stores/gameStore";
import { IconPencil } from "./ui/Icons";

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
  const cols = size <= 4 ? 4 : 3;

  return (
    <div className="mx-auto flex w-full flex-col gap-2.5 md:gap-3">
      <div className="flex items-center justify-center gap-4 text-xs text-ink-muted md:text-sm">
        <span>
          空格 <strong className="tabular text-ink">{userGrid.filter((v) => v === 0).length}</strong>
        </span>
        <span className="text-ink-faint">·</span>
        <span>
          提示 <strong className="tabular text-ink">{hintsUsed}</strong>
        </span>
      </div>

      <div className="flex gap-2">
        <div className="grid min-w-0 flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: size }).map((_, i) => {
            const num = i + 1;
            const remaining = size - counts[num];
            const done = remaining === 0 && !noteMode;
            const marked = Boolean(noteMode && selectedMarks?.has(num));
            return (
              <button
                key={num}
                type="button"
                onClick={() => inputNumber(num)}
                disabled={done}
                aria-label={noteMode ? `标记 ${num}` : `填入 ${num}`}
                className={`flex aspect-square min-h-[2.75rem] flex-col items-center justify-center rounded-2xl transition-all duration-150 active:scale-95 md:min-h-[3.25rem] ${
                  done
                    ? "bg-surface-sunken text-ink-faint/40"
                    : marked
                      ? "bg-warning text-white shadow-card"
                      : noteMode
                        ? "bg-warning-soft text-warning shadow-card ring-1 ring-warning/25"
                        : "bg-surface-elevated text-accent-700 shadow-card ring-1 ring-accent-600/15 hover:bg-accent-50"
                }`}
              >
                <span
                  className={`block leading-none tabular ${
                    noteMode ? "text-lg font-semibold md:text-xl" : "text-2xl font-bold md:text-3xl"
                  }`}
                >
                  {num}
                </span>
                {!done && !noteMode && (
                  <span className="mt-0.5 block text-[10px] font-medium text-ink-faint md:text-xs">
                    {remaining}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={toggleNoteMode}
          aria-pressed={noteMode}
          aria-label={noteMode ? "关闭标记" : "打开标记"}
          className={`flex w-[3.4rem] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl text-sm font-semibold transition-all duration-150 active:scale-95 md:w-[3.75rem] md:text-base ${
            noteMode
              ? "bg-warning text-white shadow-card"
              : "bg-surface-elevated text-ink-muted shadow-card ring-1 ring-ink/6"
          }`}
        >
          <IconPencil className="h-5 w-5 md:h-6 md:w-6" />
          标记
        </button>
      </div>

      <p className="text-center text-[11px] leading-snug text-ink-faint md:text-xs">
        {noteMode
          ? selectedCell === null
            ? "先点一个空格，再点数字记下候选"
            : "再点一次同一数字可去掉标记"
          : "点「标记」，就能在格子里记下几个可能的数"}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={eraseCell}
          className="min-h-[2.75rem] flex-1 rounded-2xl bg-surface-elevated py-2.5 text-sm font-semibold text-ink-muted shadow-card ring-1 ring-ink/6 transition-all duration-150 active:scale-95 md:min-h-[3rem] md:text-base"
        >
          清除
        </button>
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className="min-h-[2.75rem] flex-1 rounded-2xl bg-surface-elevated py-2.5 text-sm font-semibold text-ink-muted shadow-card ring-1 ring-ink/6 transition-all active:scale-95 disabled:opacity-40 md:min-h-[3rem] md:text-base"
        >
          撤销
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          className="min-h-[2.75rem] flex-1 rounded-2xl bg-surface-elevated py-2.5 text-sm font-semibold text-ink-muted shadow-card ring-1 ring-ink/6 transition-all active:scale-95 disabled:opacity-40 md:min-h-[3rem] md:text-base"
        >
          重做
        </button>
        <button
          type="button"
          onClick={() => useHint()}
          className="min-h-[2.75rem] flex-1 rounded-2xl bg-accent-50 py-2.5 text-sm font-semibold text-accent-700 ring-1 ring-accent-600/15 transition-all active:scale-95 md:min-h-[3rem] md:text-base"
        >
          提示
        </button>
      </div>
    </div>
  );
}
