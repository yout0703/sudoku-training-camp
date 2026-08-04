/**
 * 课程详情页
 */
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { getPuzzleType } from "../../shared/puzzle-types";

interface LessonSection {
  type: string;
  title: string;
  content: string;
}

interface LessonDetail {
  id: number;
  typeCode: string | null;
  phase: number;
  title: string;
  sortOrder: number;
  sections: LessonSection[];
  status: string;
}

const SECTION_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  intro: { bg: "bg-blue-50", border: "border-blue-200", icon: "💡" },
  rule: { bg: "bg-purple-50", border: "border-purple-200", icon: "📋" },
  technique: { bg: "bg-green-50", border: "border-green-200", icon: "🎯" },
  tip: { bg: "bg-amber-50", border: "border-amber-200", icon: "⚡" },
  practice: { bg: "bg-pink-50", border: "border-pink-200", icon: "✏️" },
};

export function LessonDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.getLesson(parseInt(id!)).then((l) => {
      setLesson(l as LessonDetail);
      setLoading(false);
      // 自动标记为进行中
      if (l.status === "available") {
        api.updateLesson(l.id, "in_progress");
      }
    });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleComplete = () => {
    if (!lesson) return;
    api.updateLesson(lesson.id, "completed").then(() => {
      // 跳转到对应题型的练习
      if (lesson.typeCode) {
        nav(`/practice/${lesson.typeCode}`);
      } else {
        nav("/learn");
      }
    });
  };

  if (loading || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">📖</div>
      </div>
    );
  }

  const typeDef = lesson.typeCode ? getPuzzleType(lesson.typeCode) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* 返回 */}
      <button
        onClick={() => nav("/learn")}
        className="mb-4 flex items-center gap-1 text-slate-500 text-sm active:scale-95"
      >
        ← 返回课程列表
      </button>

      {/* 标题 */}
      <div className="mb-6">
        {typeDef && <div className="text-4xl mb-2">{typeDef.icon}</div>}
        <h1 className="text-2xl font-bold text-slate-800">{lesson.title}</h1>
        {typeDef && (
          <p className="text-sm text-slate-400 mt-1">
            {typeDef.name} · {typeDef.description}
          </p>
        )}
      </div>

      {/* 课程内容 */}
      <div className="space-y-4 mb-8">
        {lesson.sections.map((section, i) => {
          const style = SECTION_STYLES[section.type] ?? SECTION_STYLES.intro;
          return (
            <div key={i} className={`${style.bg} ${style.border} border-2 rounded-2xl p-5`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{style.icon}</span>
                <h3 className="font-bold text-slate-700">{section.title}</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          );
        })}
      </div>

      {/* 完成按钮 */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleComplete}
            className="w-full py-4 rounded-2xl bg-brand-500 text-white font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {lesson.typeCode ? `完成课程，开始练习 →` : "完成课程 ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
