/**
 * 练习页面
 * 两种模式：题型选择 / 解题
 */
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { SudokuGrid } from "../components/SudokuGrid";
import { NumberPad } from "../components/NumberPad";
import { useGameStore } from "../stores/gameStore";
import { PUZZLE_TYPES, PHASE_NAMES, getPuzzleType } from "../../shared/puzzle-types";
import type { PuzzleDTO } from "../../shared/api-types";
import type { Difficulty } from "../../engine";

const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
  { value: "easy", label: "简单", color: "#22c55e" },
  { value: "medium", label: "中等", color: "#f59e0b" },
  { value: "hard", label: "困难", color: "#ef4444" },
];

export function PracticePage() {
  const { typeCode } = useParams();

  if (!typeCode) return <TypeSelect />;
  return <Solver typeCode={typeCode} />;
}

// ─── 题型选择 ───

function TypeSelect() {
  const nav = useNavigate();
  const phases = [1, 2, 3, 4];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">选择练习题型</h1>
      <p className="text-slate-400 text-sm mb-6">点击任意题型开始练习</p>

      {phases.map((phase) => {
        const types = PUZZLE_TYPES.filter((t) => t.phase === phase);
        return (
          <div key={phase} className="mb-6">
            <h2 className="text-lg font-bold text-slate-700 mb-3">{PHASE_NAMES[phase]}</h2>
            <div className="grid grid-cols-2 gap-3">
              {types.map((t) => (
                <button
                  key={t.code}
                  onClick={() => nav(`/practice/${t.code}`)}
                  className="bg-white rounded-2xl p-4 shadow-sm border-2 border-transparent hover:border-brand-300 active:scale-95 transition-all text-left"
                >
                  <div className="text-3xl mb-2">{t.icon}</div>
                  <div className="font-bold text-slate-700 text-sm">{t.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.description}</div>
                  {t.isFinals && (
                    <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 font-medium">
                      🏆 总决赛题型
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 解题界面 ───

function Solver({ typeCode }: { typeCode: string }) {
  const nav = useNavigate();
  const typeDef = getPuzzleType(typeCode);

  const [puzzle, setPuzzle] = useState<PuzzleDTO | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const loadPuzzle = useGameStore((s) => s.loadPuzzle);
  const userGrid = useGameStore((s) => s.userGrid);
  const mistakes = useGameStore((s) => s.mistakes);
  const solution = useGameStore((s) => s.solution);
  const isComplete = useGameStore((s) => s.isComplete);

  // 生成新题
  const newPuzzle = useCallback(
    (diff: Difficulty) => {
      setLoading(true);
      setCompleted(false);
      setSubmitted(false);
      api.generatePuzzle(typeCode, diff).then((p) => {
        setPuzzle(p);
        loadPuzzle(p);
        setLoading(false);
      });
    },
    [typeCode, loadPuzzle],
  );

  useEffect(() => {
    newPuzzle(difficulty);
  }, []); // eslint-disable-line

  // 计时器
  useEffect(() => {
    if (loading || completed) return;
    const timer = setInterval(() => {
      const start = useGameStore.getState().startTime;
      setElapsed(Date.now() - start);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, completed]);

  // 完成检测
  useEffect(() => {
    if (submitted || loading || !puzzle) return;
    if (isComplete()) {
      // 检查正确性
      const correct = userGrid.every((v, i) => v === solution[i]);
      if (correct) {
        setCompleted(true);
        const durationMs = Date.now() - useGameStore.getState().startTime;
        // 提交结果
        api
          .submitPractice({
            puzzleId: puzzle.id,
            typeCode,
            difficulty,
            durationMs,
            mistakes,
            hintsUsed: useGameStore.getState().hintsUsed,
            completed: true,
          })
          .then((r) => setXpEarned(r.xpEarned));
        setSubmitted(true);
      }
    }
  }, [userGrid, submitted, loading, puzzle, isComplete, solution, typeCode, difficulty, mistakes]);

  if (!typeDef) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">未知题型</p>
      </div>
    );
  }

  if (loading || !puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl animate-spin mb-3 inline-block">🧩</div>
          <p className="text-slate-400">正在生成题目...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-4">
      {/* 顶栏 */}
      <div className="w-full max-w-md flex items-center justify-between mb-3">
        <button
          onClick={() => nav("/practice")}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 active:scale-90"
        >
          ←
        </button>
        <div className="text-center">
          <div className="font-bold text-slate-700 text-sm">
            {typeDef.icon} {typeDef.name}
          </div>
          <div className="text-2xl font-mono font-bold text-brand-600">{formatTime(elapsed)}</div>
        </div>
        <button
          onClick={() => newPuzzle(difficulty)}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 active:scale-90"
        >
          🔄
        </button>
      </div>

      {/* 难度选择 */}
      <div className="flex gap-2 mb-4">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.value}
            onClick={() => {
              setDifficulty(d.value);
              newPuzzle(d.value);
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              difficulty === d.value ? "text-white" : "bg-white text-slate-400"
            }`}
            style={difficulty === d.value ? { backgroundColor: d.color } : {}}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* 盘面 */}
      <div className="mb-4">
        <SudokuGrid puzzle={puzzle} />
      </div>

      {/* 数字键盘 */}
      <NumberPad size={puzzle.meta.size} />

      {/* 完成弹窗 */}
      {completed && (
        <CompletionModal
          xp={xpEarned}
          time={elapsed}
          mistakes={mistakes}
          onNewPuzzle={() => newPuzzle(difficulty)}
          onBack={() => nav("/practice")}
        />
      )}
    </div>
  );
}

// ─── 完成弹窗 ───

function CompletionModal({
  xp,
  time,
  mistakes,
  onNewPuzzle,
  onBack,
}: {
  xp: number;
  time: number;
  mistakes: number;
  onNewPuzzle: () => void;
  onBack: () => void;
}) {
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-[bounce_0.3s_ease-out]">
        <div className="text-6xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">太棒了！</h2>
        <p className="text-slate-400 text-sm mb-4">你成功完成了这道题！</p>

        {/* 星级 */}
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`text-4xl ${s <= stars ? "" : "opacity-20"}`}>
              ⭐
            </span>
          ))}
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <StatItem icon="⏱️" label="用时" value={formatTime(time)} />
          <StatItem icon="❌" label="错误" value={String(mistakes)} />
          <StatItem icon="⭐" label="经验" value={`+${xp}`} />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold active:scale-95"
          >
            返回
          </button>
          <button
            onClick={onNewPuzzle}
            className="flex-1 py-3 rounded-2xl bg-brand-500 text-white font-bold active:scale-95"
          >
            再来一题
          </button>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl py-2">
      <div className="text-lg">{icon}</div>
      <div className="font-bold text-slate-700 text-sm">{value}</div>
      <div className="text-[10px] text-slate-400">{label}</div>
    </div>
  );
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
