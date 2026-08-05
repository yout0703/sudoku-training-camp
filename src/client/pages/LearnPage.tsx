/**
 * 学习页：课程列表
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { PHASE_NAMES } from "../../shared/puzzle-types";
import type { LessonDTO } from "../../shared/api-types";
import {
  Page,
  PageHeader,
  SectionLabel,
  LoadingPage,
  ProgressBar,
} from "../components/ui/primitives";
import { IconLock, IconPlay, IconCheck, IconChevronRight, IconBook } from "../components/ui/Icons";

const STATUS: Record<
  string,
  { icon: typeof IconLock; label: string; iconClass: string; cardClass: string }
> = {
  locked: {
    icon: IconLock,
    label: "先完成前面的课程",
    iconClass: "bg-surface-sunken text-ink-faint",
    cardClass: "opacity-55",
  },
  available: {
    icon: IconPlay,
    label: "可以开始",
    iconClass: "bg-accent-50 text-accent-600",
    cardClass: "",
  },
  in_progress: {
    icon: IconBook,
    label: "学习中",
    iconClass: "bg-warning-soft text-warning",
    cardClass: "ring-1 ring-warning/25",
  },
  completed: {
    icon: IconCheck,
    label: "已完成",
    iconClass: "bg-success-soft text-success",
    cardClass: "",
  },
};

export function LearnPage() {
  const nav = useNavigate();
  const [lessons, setLessons] = useState<LessonDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLessons().then(setLessons).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;

  const phases = [1, 2, 3, 4];
  const totalCompleted = lessons.filter((l) => l.status === "completed").length;
  const pct = lessons.length > 0 ? Math.round((totalCompleted / lessons.length) * 100) : 0;

  return (
    <Page>
      <PageHeader
        title="学习课程"
        subtitle={`已完成 ${totalCompleted}/${lessons.length} 节 · 跟着路径一步步变强`}
      />

      <div className="card mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-ink-muted">总进度</span>
          <span className="tabular font-semibold text-accent-600">{pct}%</span>
        </div>
        <ProgressBar value={pct} />
      </div>

      {phases.map((phase) => {
        const phaseLessons = lessons.filter((l) => l.phase === phase);
        if (phaseLessons.length === 0) return null;

        return (
          <section key={phase} className="mb-6">
            <SectionLabel>{PHASE_NAMES[phase]}</SectionLabel>
            <div className="space-y-2">
              {phaseLessons.map((lesson, idx) => {
                const cfg = STATUS[lesson.status] ?? STATUS.locked;
                const Icon = cfg.icon;
                const isLocked = lesson.status === "locked";
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => nav(`/learn/${lesson.id}`)}
                    className={`card-interactive flex items-center gap-3 ${cfg.cardClass} ${
                      isLocked ? "cursor-not-allowed active:scale-100" : ""
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium tabular text-ink-faint">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate text-sm font-semibold text-ink">
                          {lesson.title}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-faint">{cfg.label}</p>
                    </div>
                    {!isLocked && <IconChevronRight className="h-5 w-5 shrink-0 text-ink-faint" />}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </Page>
  );
}
