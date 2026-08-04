/**
 * 学习页：课程列表
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { PHASE_NAMES } from "../../shared/puzzle-types";
import type { LessonDTO } from "../../shared/api-types";

const STATUS_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  locked: { icon: "🔒", color: "text-slate-300", bg: "bg-slate-50" },
  available: { icon: "▶️", color: "text-brand-600", bg: "bg-white" },
  in_progress: { icon: "📖", color: "text-amber-600", bg: "bg-amber-50" },
  completed: { icon: "✅", color: "text-green-600", bg: "bg-green-50" },
};

export function LearnPage() {
  const nav = useNavigate();
  const [lessons, setLessons] = useState<LessonDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLessons().then(setLessons).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">📚</div>
      </div>
    );
  }

  const phases = [1, 2, 3, 4];
  const totalCompleted = lessons.filter((l) => l.status === "completed").length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">学习课程</h1>
      <p className="text-slate-400 text-sm mb-6">
        已完成 {totalCompleted}/{lessons.length} 节课
      </p>

      {phases.map((phase) => {
        const phaseLessons = lessons.filter((l) => l.phase === phase);
        if (phaseLessons.length === 0) return null;

        return (
          <div key={phase} className="mb-6">
            <h2 className="text-lg font-bold text-slate-700 mb-3">{PHASE_NAMES[phase]}</h2>
            <div className="space-y-2">
              {phaseLessons.map((lesson) => {
                const cfg = STATUS_CONFIG[lesson.status] ?? STATUS_CONFIG.locked;
                const isLocked = lesson.status === "locked";
                return (
                  <button
                    key={lesson.id}
                    disabled={isLocked}
                    onClick={() => nav(`/learn/${lesson.id}`)}
                    className={`w-full ${cfg.bg} rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 transition-all
                      ${isLocked ? "opacity-60" : "active:scale-[0.98]"}`}
                  >
                    <span className="text-2xl">{cfg.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-slate-700 text-sm">{lesson.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {lesson.status === "completed"
                          ? "已完成"
                          : lesson.status === "in_progress"
                            ? "学习中..."
                            : lesson.status === "available"
                              ? "可以开始学习"
                              : "需要先完成前面的课程"}
                      </div>
                    </div>
                    {!isLocked && <span className="text-slate-300">›</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
