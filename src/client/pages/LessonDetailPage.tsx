/**
 * 课程详情 + 交互演示
 */
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { getPuzzleType } from "../../shared/puzzle-types";
import { Page, Button, LoadingPage } from "../components/ui/primitives";
import { IconBack } from "../components/ui/Icons";
import { PuzzleTypeIcon } from "../components/ui/PuzzleTypeIcon";
import { LessonDemo, getDemoForLesson } from "../components/LessonDemo";

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

/** 统一浅色系 + 左侧色条区分类型，避免彩虹卡片 */
const SECTION_META: Record<string, { label: string; bar: string }> = {
  intro: { label: "导入", bar: "bg-accent-400" },
  rule: { label: "规则", bar: "bg-accent-600" },
  technique: { label: "技巧", bar: "bg-accent-700" },
  tip: { label: "窍门", bar: "bg-warning" },
  practice: { label: "练习", bar: "bg-success" },
};

export function LessonDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [search] = useSearchParams();
  const fromPractice = search.get("from") === "practice";
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.getLesson(parseInt(id!)).then((l) => {
      setLesson(l as LessonDetail);
      setLoading(false);
      if (l.status === "available" || l.status === "locked") {
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
      if (lesson.typeCode) {
        nav(`/practice/${lesson.typeCode}`);
      } else {
        nav("/learn");
      }
    });
  };

  if (loading || !lesson) return <LoadingPage />;

  const typeDef = lesson.typeCode ? getPuzzleType(lesson.typeCode) : null;
  const demo = getDemoForLesson(lesson.typeCode, lesson.title);

  // 在第一段 technique 后插入演示
  const techIdx = lesson.sections.findIndex((s) => s.type === "technique");
  const insertAfter = techIdx >= 0 ? techIdx : Math.min(1, lesson.sections.length - 1);

  return (
    <Page className="!pb-32">
      <button
        type="button"
        onClick={() => {
          if (fromPractice && lesson.typeCode) nav(`/practice/${lesson.typeCode}`);
          else nav("/learn");
        }}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition-colors active:text-ink"
      >
        <IconBack className="h-4 w-4" />
        {fromPractice && lesson.typeCode ? "返回练习" : "返回课程列表"}
      </button>

      <header className="mb-6">
        {typeDef && (
          <div className="mb-2">
            <PuzzleTypeIcon code={typeDef.code} withBg size={28} />
          </div>
        )}
        <h1 className="page-title">{lesson.title}</h1>
        {typeDef && (
          <p className="page-subtitle">
            {typeDef.name} · {typeDef.description}
          </p>
        )}
      </header>

      <div className="mb-8 space-y-3">
        {lesson.sections.map((section, i) => {
          const meta = SECTION_META[section.type] ?? SECTION_META.intro;
          return (
            <div key={i}>
              <article className="overflow-hidden rounded-2xl bg-surface-elevated shadow-card">
                <div className="flex">
                  <div className={`w-1 shrink-0 ${meta.bar}`} aria-hidden />
                  <div className="flex-1 p-4">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink-faint">{meta.label}</span>
                      <h3 className="text-sm font-bold text-ink">{section.title}</h3>
                    </div>
                    <p className="select-text whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                      {section.content}
                    </p>
                  </div>
                </div>
              </article>
              {demo && i === insertAfter && (
                <div className="mt-3">
                  <LessonDemo demo={demo} />
                </div>
              )}
            </div>
          );
        })}
        {demo && lesson.sections.length === 0 && <LessonDemo demo={demo} />}
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pb-[env(safe-area-inset-bottom)] md:bottom-24">
        <div className="shell">
          {fromPractice && lesson.typeCode ? (
            <div className="flex gap-2.5">
              <Button
                variant="secondary"
                block
                onClick={() => nav(`/practice/${lesson.typeCode}`)}
                className="shadow-float !py-3.5 text-base md:!py-4 md:text-lg"
              >
                返回练习
              </Button>
              <Button
                variant="primary"
                block
                onClick={handleComplete}
                className="shadow-float !py-3.5 text-base md:!py-4 md:text-lg"
              >
                学完了
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              block
              onClick={handleComplete}
              className="shadow-float !py-3.5 text-base md:!py-4 md:text-lg"
            >
              {lesson.typeCode ? "完成课程，开始练习" : "完成课程"}
            </Button>
          )}
        </div>
      </div>
    </Page>
  );
}
