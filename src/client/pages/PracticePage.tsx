import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { SudokuGrid } from "../components/SudokuGrid";
import { NumberPad } from "../components/NumberPad";
import { useGameStore } from "../stores/gameStore";
import { useUserStore } from "../stores/userStore";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { fetchProgressDraft, removeProgressDraft } from "../lib/storage";
import { PUZZLE_TYPES, PHASE_NAMES, getPuzzleType } from "../../shared/puzzle-types";
import type { PuzzleDTO, SavedDraftDTO } from "../../shared/api-types";
import type { Difficulty } from "../../engine";
import {
  Page,
  PageHeader,
  SectionLabel,
  Button,
  IconButton,
  formatTime,
} from "../components/ui/primitives";
import {
  IconBack,
  IconRefresh,
  IconStar,
  IconTrophy,
  IconSparkle,
  IconSave,
  IconCloud,
  IconInfo,
} from "../components/ui/Icons";
import { PuzzleTypeIcon } from "../components/ui/PuzzleTypeIcon";

const DIFFICULTIES: { value: Difficulty; label: string; active: string }[] = [
  { value: "easy", label: "简单", active: "bg-green text-white shadow-[2px_2px_0_var(--color-ink)] border-2 border-ink" },
  { value: "medium", label: "中等", active: "bg-yellow text-ink shadow-[2px_2px_0_var(--color-ink)] border-2 border-ink" },
  { value: "hard", label: "困难", active: "bg-orange text-white shadow-[2px_2px_0_var(--color-ink)] border-2 border-ink" },
];

export function PracticePage() {
  const { typeCode } = useParams();
  if (!typeCode) return <TypeSelect />;
  return <Solver typeCode={typeCode} />;
}

function TypeSelect() {
  useDocumentTitle(
    "数独题型选择 · 23 种变体数独题库",
    "选择你喜欢的数独题型，包含标准四/六/九宫、四/六/九宫对角线、四/六/九宫奇偶、四/六/九宫杀手、加减、大小数、不等号、温度计、不规则、连续、五六、堡垒、比例、无马数独。"
  );
  const nav = useNavigate();
  const phases = [1, 2, 3, 4];

  return (
    <Page>
      <PageHeader
        title="选择数独题型"
        subtitle="23 种题型均已开放 · 挑一题开做"
      />

      {phases.map((phase) => {
        const types = PUZZLE_TYPES.filter((t) => t.phase === phase);
        return (
          <section key={phase} className="mb-6">
            <SectionLabel>{PHASE_NAMES[phase]}</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {types.map((t) => (
                <button
                  key={t.code}
                  type="button"
                  onClick={() => nav(`/practice/${t.code}`)}
                  className="card-interactive flex flex-col items-start !p-3.5 text-left md:!p-4"
                >
                  <PuzzleTypeIcon code={t.code} withBg size={22} className="mb-2" />
                  <span className="text-sm font-black leading-snug text-ink">{t.name}</span>
                  <span className="mt-1 text-[11px] font-medium leading-snug text-ink-muted">
                    {t.description}
                  </span>
                  {t.isFinals && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-ink bg-danger text-white px-2 py-0.5 text-[9px] font-bold shadow-[1px_1px_0_var(--color-ink)]">
                      <IconTrophy className="h-3 w-3" />
                      决赛题
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </Page>
  );
}

function Solver({ typeCode }: { typeCode: string }) {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDiff = (searchParams.get("diff") as Difficulty) || "medium";

  const typeDef = getPuzzleType(typeCode);
  useDocumentTitle(
    typeDef ? `${typeDef.name} · 在线做题` : "数独解题",
    typeDef?.rules || "0703 在线数独解题，支持变体规则校验与进度自动保存。"
  );

  const user = useUserStore((s) => s.user);
  const updateUserXp = useUserStore((s) => s.updateUserXp);

  const [puzzle, setPuzzle] = useState<PuzzleDTO | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDiff);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitHint, setSubmitHint] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(true);
  const [isRestoredDraft, setIsRestoredDraft] = useState(false);

  const loadPuzzle = useGameStore((s) => s.loadPuzzle);
  const userGrid = useGameStore((s) => s.userGrid);
  const mistakes = useGameStore((s) => s.mistakes);
  const filled = userGrid.length > 0 && userGrid.every((v) => v !== 0);

  const initGame = useCallback(
    async (diff: Difficulty, forceNew = false) => {
      setLoading(true);
      setCompleted(false);
      setSubmitted(false);
      setSubmitHint(null);
      setIsRestoredDraft(false);

      let draft: SavedDraftDTO | null = null;
      if (!forceNew) {
        draft = await fetchProgressDraft(typeCode, diff, !!user);
      }

      if (draft && draft.userGrid && draft.userGrid.length > 0) {
        let p: PuzzleDTO;
        if (draft.puzzleId) {
          try {
            p = await api.getPuzzle(draft.puzzleId);
          } catch {
            p = await api.generatePuzzle(typeCode, diff);
          }
        } else {
          p = await api.generatePuzzle(typeCode, diff);
        }

        p.givens = draft.givens;
        setPuzzle(p);
        loadPuzzle(p, draft);
        setElapsed(draft.elapsedMs || 0);
        setIsRestoredDraft(true);
        setLoading(false);
      } else {
        const p = await api.generatePuzzle(typeCode, diff);
        setPuzzle(p);
        loadPuzzle(p, null);
        setElapsed(0);
        setLoading(false);
      }
    },
    [typeCode, user, loadPuzzle],
  );

  const newPuzzle = useCallback(
    (diff: Difficulty) => {
      removeProgressDraft(typeCode, diff, !!user);
      initGame(diff, true);
    },
    [typeCode, user, initGame],
  );

  const handleSubmit = useCallback(async () => {
    if (submitted || loading || !puzzle) return;
    const result = useGameStore.getState().checkBoard();
    if (!result.filled) {
      setSubmitHint("还有空格没填完哦，继续加油！");
      return;
    }
    if (!result.correct) {
      setSubmitHint(`有 ${result.wrongCount} 个格子不符合规则，请检查标红格`);
      return;
    }
    setSubmitHint(null);
    setCompleted(true);
    setSubmitted(true);

    const durationMs =
      Date.now() -
      useGameStore.getState().startTime +
      useGameStore.getState().initialElapsedMs;

    removeProgressDraft(typeCode, difficulty, !!user);

    try {
      const r = await api.submitPractice({
        puzzleId: puzzle.id,
        typeCode,
        difficulty,
        durationMs,
        mistakes: useGameStore.getState().mistakes,
        hintsUsed: useGameStore.getState().hintsUsed,
        completed: true,
      });
      setXpEarned(r.xpEarned);
      updateUserXp(r.xpEarned);
    } catch {
      setXpEarned(20);
    }
  }, [submitted, loading, puzzle, typeCode, difficulty, user, updateUserXp]);

  useEffect(() => {
    initGame(difficulty);
  }, []); // eslint-disable-line

  useEffect(() => {
    setSubmitHint(null);
  }, [userGrid]);

  useEffect(() => {
    if (loading || completed) return;
    const timer = setInterval(() => {
      const store = useGameStore.getState();
      setElapsed(Date.now() - store.startTime + store.initialElapsedMs);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, completed]);

  // 键盘事件
  useEffect(() => {
    if (loading || completed) return;
    const onKey = (e: KeyboardEvent) => {
      const store = useGameStore.getState();
      const size = puzzle?.meta.size ?? 9;
      if (e.key >= "1" && e.key <= String(size)) {
        store.inputNumber(parseInt(e.key, 10));
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        store.eraseCell();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) store.redo();
        else store.undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        store.redo();
        return;
      }
      if (e.key === "n" || e.key === "N" || e.key === "m" || e.key === "M") {
        store.toggleNoteMode();
        return;
      }
      if (e.key === "h" || e.key === "H") {
        store.useHint();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }
      const sel = store.selectedCell;
      if (sel === null || !puzzle) return;
      const s = puzzle.meta.size;
      let next = sel;
      if (e.key === "ArrowUp") next = sel - s;
      else if (e.key === "ArrowDown") next = sel + s;
      else if (e.key === "ArrowLeft") next = sel - 1;
      else if (e.key === "ArrowRight") next = sel + 1;
      else return;
      if (next >= 0 && next < s * s) {
        e.preventDefault();
        store.selectCell(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, completed, puzzle, handleSubmit]);

  if (!typeDef) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-ink-muted font-bold">未知题型</p>
      </main>
    );
  }

  if (loading || !puzzle) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 px-4">
        <div className="h-12 w-12 animate-spin rounded-2xl border-3 border-ink bg-yellow shadow-[3px_3px_0_var(--color-ink)]" />
        <p className="text-sm font-bold text-ink">正在准备题目...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center px-3 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-4 md:px-6">
      <div className="shell-solver w-full max-w-xl mx-auto">
        {/* 做题专属一体化顶栏（无重叠遮挡） */}
        <header className="mb-4 flex w-full items-center justify-between gap-2 border-b-2 border-ink/15 pb-3">
          {/* 左侧：返回题库 + 0703 主站徽标 */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => nav("/practice")}
              className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-surface px-2.5 py-1 text-xs font-black text-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-yellow-soft active:translate-y-[1px] active:shadow-none"
            >
              <IconBack className="h-4 w-4" />
              <span>题库</span>
            </button>
            <a
              href="https://0703.pro/"
              target="_blank"
              rel="noopener noreferrer"
              title="前往 0703 Studio"
              className="hidden sm:inline-flex items-center gap-1 rounded-full border-2 border-ink bg-surface px-2 py-1 text-[11px] font-black text-ink shadow-[1.5px_1.5px_0_var(--color-ink)] hover:bg-yellow active:translate-y-[1px]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-orange animate-pulse" />
              <span>0703 ↗</span>
            </a>
          </div>

          {/* 中间：题型名称 + 计时器 + 状态 */}
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border-1.5 border-ink bg-yellow px-2.5 py-0.5 text-[11px] font-black text-ink shadow-[1px_1px_0_var(--color-ink)]">
              <PuzzleTypeIcon code={typeCode} size={14} />
              <span>{typeDef.name}</span>
            </div>
            <div className="tabular text-2xl font-black tracking-tight text-ink md:text-3xl leading-tight mt-0.5">
              {formatTime(elapsed)}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-ink-muted leading-none mt-0.5">
              {user ? (
                <>
                  <IconCloud className="h-3 w-3 text-blue" />
                  <span>云端已同步</span>
                </>
              ) : (
                <>
                  <IconSave className="h-3 w-3 text-ink-muted" />
                  <span>本地已存</span>
                </>
              )}
              {isRestoredDraft && <span className="text-orange font-black">· 已恢复草稿</span>}
            </div>
          </div>

          {/* 右侧：规则展开/收起 + 换一题 */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowRules((v) => !v)}
              className={`inline-flex items-center gap-0.5 rounded-full border-2 border-ink px-2.5 py-1 text-xs font-black shadow-[2px_2px_0_var(--color-ink)] transition active:translate-y-[1px] active:shadow-none ${
                showRules ? "bg-blue text-white" : "bg-surface text-ink hover:bg-blue-soft"
              }`}
            >
              <span>{showRules ? "收起" : "规则"}</span>
            </button>
            <IconButton label="换一题" onClick={() => newPuzzle(difficulty)}>
              <IconRefresh className="h-4 w-4" />
            </IconButton>
          </div>
        </header>

        {/* 题型规则说明卡片（0703 湖蓝风格） */}
        {showRules && (
          <section className="mb-3.5 rounded-2xl border-2 border-ink bg-blue-soft p-3 text-xs leading-relaxed text-ink shadow-[3px_3px_0_var(--color-ink)]">
            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink bg-blue text-white font-black">
                <IconInfo className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="font-black text-ink mb-0.5 text-xs sm:text-sm">【{typeDef.name}】规则说明</p>
                <p className="text-ink-muted font-medium">{typeDef.rules}</p>
              </div>
            </div>
          </section>
        )}

        {/* 难度选择器 */}
        <div className="mb-3.5 flex justify-center">
          <div className="flex gap-1.5 rounded-full border-2 border-ink bg-surface p-1 shadow-[2px_2px_0_var(--color-ink)]">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => {
                  setDifficulty(d.value);
                  initGame(d.value);
                }}
                className={`min-h-[1.875rem] rounded-full px-3.5 py-0.5 text-xs font-black transition-all ${
                  difficulty === d.value ? d.active : "text-ink-muted hover:text-ink"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* 盘面与键盘 */}
        <div className="solver-layout">
          <div className="solver-grid-wrap">
            <SudokuGrid puzzle={puzzle} />
          </div>
          <div className="solver-pad-wrap">
            <NumberPad size={puzzle.meta.size} />
            {submitHint && (
              <p className="mt-2 text-center text-xs font-black text-danger md:text-sm">
                {submitHint}
              </p>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!filled || submitted}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-orange py-3.5 text-base font-black text-white shadow-[3px_3px_0_var(--color-ink)] transition-all hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <IconSparkle className="h-5 w-5" />
              <span>提交验卷</span>
            </button>
          </div>
        </div>
      </div>

      {completed && (
        <CompletionModal
          xp={xpEarned}
          time={elapsed}
          mistakes={mistakes}
          onNewPuzzle={() => newPuzzle(difficulty)}
          onBack={() => nav("/practice")}
        />
      )}
    </main>
  );
}

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
  const ratingText =
    mistakes === 0 ? "零失误 · 完美解题！" : mistakes <= 2 ? "表现优异！" : "顺利通关！";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-panel max-w-sm">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border-3 border-ink bg-yellow text-ink shadow-[3px_3px_0_var(--color-ink)] animate-bounce">
          <IconTrophy className="h-9 w-9 text-ink" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-ink">太棒了！顺利解出！</h2>
        <p className="mt-1 text-xs font-black text-orange">{ratingText}</p>

        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <IconStar
              key={s}
              className={`h-8 w-8 transition-transform ${
                s <= stars ? "text-yellow scale-110 drop-shadow-[0_2px_0_rgba(43,38,34,0.3)]" : "text-ink/15"
              }`}
            />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <StatBox label="用时" value={formatTime(time)} />
          <StatBox label="失误" value={mistakes === 0 ? "0 次" : `${mistakes} 次`} />
          <StatBox label="所获经验" value={`+${xp} XP`} />
        </div>

        <div className="mt-6 flex gap-2.5">
          <Button variant="secondary" block onClick={onBack} className="font-black">
            返回题库
          </Button>
          <Button variant="primary" block onClick={onNewPuzzle} className="font-black !bg-orange">
            再做一题！
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-1.5 border-ink bg-surface py-2 shadow-[1.5px_1.5px_0_var(--color-ink)]">
      <div className="tabular text-sm font-black text-ink">{value}</div>
      <div className="text-[10px] font-bold text-ink-muted">{label}</div>
    </div>
  );
}
