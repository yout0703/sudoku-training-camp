/**
 * 数字键盘 + 候选 / 清除 / 撤销 / 提示
 */
import { useGameStore } from "../stores/gameStore";
import { IconPencil, IconEraser } from "./ui/Icons";

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
  const mistakes = useGameStore((s) => s.mistakes);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const canUndo = historyLen > 0;
  const canRedo = futureLen > 0;

  const counts = Array.from({ length: size + 1 }, () => 0);
  for (const v of userGrid) {
    if (v > 0 && v <= size) counts[v]++;
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-2.5 md:gap-3">
      {/* 状态条 */}
      <div className="flex items-center justify-center gap-4 text-xs text-ink-muted md:text-sm">
        <span>
          错误 <strong className="tabular text-danger">{mistakes}</strong>
        </span>
        <span className="text-ink-faint">·</span>
        <span>
          提示 <strong className="tabular text-ink">{hintsUsed}</strong>
        </span>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(size, 5)}, 1fr)` }}
      >
        {Array.from({ length: size }).map((_, i) => {
          const num = i + 1;
          const remaining = size - counts[num];
          const done = remaining === 0;
          return (
            <button
              key={num}
              type="button"
              onClick={() => inputNumber(num)}
              disabled={done}
              className={`aspect-square min-h-[2.75rem] rounded-2xl text-2xl font-bold transition-all duration-150 active:scale-95 md:min-h-[3.25rem] md:text-3xl ${
                done
                  ? "bg-surface-sunken text-ink-faint/40"
                  : "bg-surface-elevated text-accent-700 shadow-card ring-1 ring-accent-600/15 hover:bg-accent-50"
              }`}
            >
              <span className="block leading-none tabular">{num}</span>
              {!done && (
                <span className="mt-0.5 block text-[10px] font-medium text-ink-faint md:text-xs">
                  {remaining}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={toggleNoteMode}
          className={`flex min-h-[2.75rem] flex-1 items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-semibold transition-all duration-150 active:scale-95 md:min-h-[3rem] md:text-base ${
            noteMode
              ? "bg-warning text-white shadow-card"
              : "bg-surface-elevated text-ink-muted shadow-card ring-1 ring-ink/6"
          }`}
        >
          <IconPencil className="h-4 w-4 md:h-5 md:w-5" />
          {noteMode ? "候选" : "填数"}
        </button>
        <button
          type="button"
          onClick={eraseCell}
          className="flex min-h-[2.75rem] flex-1 items-center justify-center gap-1.5 rounded-2xl bg-surface-elevated py-3 text-sm font-semibold text-ink-muted shadow-card ring-1 ring-ink/6 transition-all duration-150 active:scale-95 md:min-h-[3rem] md:text-base"
        >
          <IconEraser className="h-4 w-4 md:h-5 md:w-5" />
          清除
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className="min-h-[2.75rem] rounded-2xl bg-surface-elevated py-2.5 text-sm font-semibold text-ink-muted shadow-card ring-1 ring-ink/6 transition-all active:scale-95 disabled:opacity-40 md:min-h-[3rem] md:text-base"
        >
          撤销
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          className="min-h-[2.75rem] rounded-2xl bg-surface-elevated py-2.5 text-sm font-semibold text-ink-muted shadow-card ring-1 ring-ink/6 transition-all active:scale-95 disabled:opacity-40 md:min-h-[3rem] md:text-base"
        >
          重做
        </button>
        <button
          type="button"
          onClick={() => useHint()}
          className="min-h-[2.75rem] rounded-2xl bg-accent-50 py-2.5 text-sm font-semibold text-accent-700 ring-1 ring-accent-600/15 transition-all active:scale-95 md:min-h-[3rem] md:text-base"
        >
          提示
        </button>
      </div>
    </div>
  );
}
