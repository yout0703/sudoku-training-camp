/**
 * 数字键盘组件
 */
import { useGameStore } from "../stores/gameStore";

interface Props {
  size: number;
}

export function NumberPad({ size }: Props) {
  const inputNumber = useGameStore((s) => s.inputNumber);
  const eraseCell = useGameStore((s) => s.eraseCell);
  const noteMode = useGameStore((s) => s.noteMode);
  const toggleNoteMode = useGameStore((s) => s.toggleNoteMode);
  const userGrid = useGameStore((s) => s.userGrid);

  // 统计每个数字的剩余数量
  const counts = Array.from({ length: size + 1 }, () => 0);
  for (const v of userGrid) {
    if (v > 0 && v <= size) counts[v]++;
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-md mx-auto">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(size, 5)}, 1fr)` }}>
        {Array.from({ length: size }).map((_, i) => {
          const num = i + 1;
          const remaining = size - counts[num];
          const done = remaining === 0;
          return (
            <button
              key={num}
              onClick={() => inputNumber(num)}
              className={`aspect-square rounded-2xl text-2xl font-bold transition-all active:scale-95 shadow-sm
                ${done ? "bg-slate-100 text-slate-300" : "bg-white text-brand-600 hover:bg-brand-50 border-2 border-brand-200"}`}
            >
              <span className="block leading-none">{num}</span>
              {!done && (
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{remaining}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={toggleNoteMode}
          className={`flex-1 rounded-2xl py-3 font-bold transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5
            ${noteMode ? "bg-amber-400 text-white" : "bg-white text-slate-600 border-2 border-slate-200"}`}
        >
          ✏️ <span className="text-sm">{noteMode ? "候选模式" : "填数模式"}</span>
        </button>
        <button
          onClick={eraseCell}
          className="flex-1 rounded-2xl py-3 font-bold bg-white text-slate-600 border-2 border-slate-200 transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
        >
          🧹 <span className="text-sm">清除</span>
        </button>
      </div>
    </div>
  );
}
