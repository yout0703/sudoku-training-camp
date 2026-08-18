/**
 * 练习页面：题型选择 / 解题
 */
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { SudokuGrid } from "../components/SudokuGrid";
import { NumberPad } from "../components/NumberPad";
import { useGameStore } from "../stores/gameStore";
import { PUZZLE_TYPES, PHASE_NAMES, getPuzzleType } from "../../shared/puzzle-types";
import type { LessonDTO, PuzzleDTO } from "../../shared/api-types";
import type { Difficulty } from "../../engine";
import {
  Page,
  PageHeader,
  SectionLabel,
  Button,
  IconButton,
  formatTime,
} from "../components/ui/primitives";
import { IconBack, IconRefresh, IconStar, IconTrophy, IconBook } from "../components/ui/Icons";
import { PuzzleTypeIcon } from "../components/ui/PuzzleTypeIcon";

const DIFFICULTIES: { value: Difficulty; label: string; active: string }[] = [
  { value: "easy", label: "简单", active: "bg-success text-white" },
  { value: "medium", label: "中等", active: "bg-warning text-white" },
  { value: "hard", label: "困难", active: "bg-danger text-white" },
];

export function PracticePage() {
  const { typeCode } = useParams();
  if (!typeCode) return <TypeSelect />;
  return <Solver typeCode={typeCode} />;
}

function TypeSelect() {
  const nav = useNavigate();
  const phases = [1, 2, 3, 4];

  return (
    <Page>
      <PageHeader
        title="选择练习题型"
        subtitle="全部题型已开放 · 可随时换难度"
        action={
          <button
            type="button"
            onClick={() => nav("/learn")}
            className="inline-flex min-h-[2.75rem] shrink-0 items-center gap-1.5 rounded-xl bg-surface-elevated px-3 text-sm font-semibold text-accent-700 shadow-card ring-1 ring-accent-600/15 active:scale-[0.98]"
          >
            <IconBook className="h-4 w-4" />
            学习课程
          </button>
        }
      />

      {phases.map((phase) => {
        const types = PUZZLE_TYPES.filter((t) => t.phase === phase);
        return (
          <section key={phase} className="mb-6">
            <SectionLabel>{PHASE_NAMES[phase]}</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
              {types.map((t) => (
                <button
                  key={t.code}
                  type="button"
                  onClick={() => nav(`/practice/${t.code}`)}
                  className="card-interactive flex flex-col items-start !p-3.5 md:!p-4"
                >
                  <PuzzleTypeIcon code={t.code} withBg size={22} className="mb-2" />
                  <span className="text-sm font-semibold leading-snug text-ink">{t.name}</span>
                  <span className="mt-0.5 text-[11px] leading-snug text-ink-faint">{t.description}</span>
                  {t.isFinals && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-danger-soft px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                      <IconTrophy className="h-3 w-3" />
                      总决赛
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
  const typeDef = getPuzzleType(typeCode);

  const [puzzle, setPuzzle] = useState<PuzzleDTO | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitHint, setSubmitHint] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(typeCode === "add_sub_4");
  const [lessonId, setLessonId] = useState<number | null>(null);

  const loadPuzzle = useGameStore((s) => s.loadPuzzle);
  const userGrid = useGameStore((s) => s.userGrid);
  const mistakes = useGameStore((s) => s.mistakes);
  const filled = userGrid.length > 0 && userGrid.every((v) => v !== 0);

  const newPuzzle = useCallback(
    (diff: Difficulty) => {
      setLoading(true);
      setCompleted(false);
      setSubmitted(false);
      setSubmitHint(null);
      api.generatePuzzle(typeCode, diff).then((p) => {
        setPuzzle(p);
        loadPuzzle(p);
        setLoading(false);
      });
    },
    [typeCode, loadPuzzle],
  );

  const handleSubmit = useCallback(() => {
    if (submitted || loading || !puzzle) return;
    const result = useGameStore.getState().checkBoard();
    if (!result.filled) {
      setSubmitHint("还有空格没填完");
      return;
    }
    if (!result.correct) {
      setSubmitHint(`${result.wrongCount} 个格子不对，改完再交`);
      return;
    }
    setSubmitHint(null);
    setCompleted(true);
    setSubmitted(true);
    const durationMs = Date.now() - useGameStore.getState().startTime;
    api
      .submitPractice({
        puzzleId: puzzle.id,
        typeCode,
        difficulty,
        durationMs,
        mistakes: useGameStore.getState().mistakes,
        hintsUsed: useGameStore.getState().hintsUsed,
        completed: true,
      })
      .then((r) => setXpEarned(r.xpEarned));
  }, [submitted, loading, puzzle, typeCode, difficulty]);

  useEffect(() => {
    newPuzzle(difficulty);
  }, []); // eslint-disable-line

  useEffect(() => {
    api.getLessons().then((lessons: LessonDTO[]) => {
      const match = [...lessons]
        .filter((l) => l.typeCode === typeCode)
        .sort((a, b) => a.sortOrder - b.sortOrder)[0];
      setLessonId(match?.id ?? null);
    });
  }, [typeCode]);

  useEffect(() => {
    setSubmitHint(null);
  }, [userGrid]);

  useEffect(() => {
    if (loading || completed) return;
    const timer = setInterval(() => {
      const start = useGameStore.getState().startTime;
      setElapsed(Date.now() - start);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, completed]);

  // 键盘：数字 / 方向 / 退格 / Ctrl+Z
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
        <p className="text-ink-muted">未知题型</p>
      </main>
    );
  }

  if (loading || !puzzle) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 px-4">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-accent-100" />
        <p className="text-sm text-ink-muted">正在生成题目...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 md:px-6">
      <div className="shell-solver w-full">
        {/* Top bar */}
        <div className="mb-3 flex w-full items-center justify-between md:mb-4">
          <IconButton label="返回" onClick={() => nav("/practice")}>
            <IconBack />
          </IconButton>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowRules((v) => !v)}
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-ink-muted md:text-sm"
            >
              <PuzzleTypeIcon code={typeCode} size={14} />
              {typeDef.name}
            </button>
            <div className="tabular text-2xl font-bold tracking-tight text-accent-600 md:text-3xl">
              {formatTime(elapsed)}
            </div>
            <button
              type="button"
              onClick={() =>
                nav(lessonId ? `/learn/${lessonId}?from=practice` : "/learn")
              }
              className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-accent-700 md:text-xs"
            >
              <IconBook className="h-3.5 w-3.5" />
              看课程
            </button>
          </div>
          <IconButton label="换一题" onClick={() => newPuzzle(difficulty)}>
            <IconRefresh />
          </IconButton>
        </div>

        {showRules && (
          <p className="mb-3 rounded-xl bg-surface-sunken px-3 py-2 text-center text-xs leading-relaxed text-ink-muted">
            {typeDef.rules}
          </p>
        )}

        {/* Difficulty */}
        <div className="mb-4 flex justify-center">
          <div className="flex gap-1.5 rounded-full bg-surface-sunken p-1">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => {
                  setDifficulty(d.value);
                  newPuzzle(d.value);
                }}
                className={`min-h-[2.25rem] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 md:min-h-[2.5rem] md:px-5 md:text-sm ${
                  difficulty === d.value ? d.active : "text-ink-muted"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* 手机上下叠；iPad 盘面 + 键盘并排 */}
        <div className="solver-layout">
          <div className="solver-grid-wrap">
            <SudokuGrid puzzle={puzzle} />
          </div>
          <div className="solver-pad-wrap">
            <NumberPad size={puzzle.meta.size} />
            {submitHint && (
              <p className="mt-2 text-center text-xs font-medium text-danger md:text-sm">{submitHint}</p>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!filled || submitted}
              className="btn btn-primary btn-block mt-2.5 disabled:opacity-40"
            >
              提交
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

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="complete-title">
      <div className="modal-panel">
        <img
          src="/illustrations/complete-celebrate.jpg"
          alt=""
          className="mx-auto mb-3 h-28 w-28 rounded-2xl object-cover shadow-card ring-1 ring-ink/5"
          width={112}
          height={112}
        />
        <h2 id="complete-title" className="text-xl font-bold tracking-tight text-ink">
          太棒了
        </h2>
        <p className="mt-1 text-sm text-ink-muted">你成功完成了这道题</p>

        <div className="mt-4 flex justify-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <IconStar
              key={s}
              className={`h-8 w-8 ${s <= stars ? "text-warning" : "text-surface-sunken"}`}
            />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <StatBox label="用时" value={formatTime(time)} />
          <StatBox label="交卷" value={mistakes === 0 ? "一次过" : `${mistakes + 1} 次`} />
          <StatBox label="经验" value={`+${xp}`} />
        </div>

        <div className="mt-6 flex gap-2.5">
          <Button variant="secondary" block onClick={onBack}>
            返回
          </Button>
          <Button variant="primary" block onClick={onNewPuzzle}>
            再来一题
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface py-2.5">
      <div className="tabular text-sm font-bold text-ink">{value}</div>
      <div className="text-[10px] text-ink-faint">{label}</div>
    </div>
  );
}
