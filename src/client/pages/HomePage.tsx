/**
 * 首页：今日任务 + 训练路径
 */
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { DashboardDTO } from "../../shared/api-types";
import { getPuzzleType } from "../../shared/puzzle-types";
import {
  Page,
  SectionLabel,
  Card,
  ProgressBar,
  Chip,
  Button,
  LoadingPage,
  ErrorPage,
  formatTime,
} from "../components/ui/primitives";
import { IconStar, IconFlame, IconPlay } from "../components/ui/Icons";
import { PuzzleTypeIcon } from "../components/ui/PuzzleTypeIcon";

export function HomePage() {
  const nav = useNavigate();
  const [data, setData] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    api
      .getDashboard()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingPage />;
  if (error || !data?.user) return <ErrorPage onRetry={load} />;

  const mission = data.todayMission;
  const missionPct = mission
    ? Math.min(100, Math.round((mission.todayCompleted / mission.todayTarget) * 100))
    : 0;

  return (
    <Page>
      {/* Welcome — solid brand block, not AI gradient mesh */}
      <section className="relative mb-5 overflow-hidden rounded-3xl bg-accent-700 p-5 text-white shadow-card">
        <div className="relative flex items-center gap-3.5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl ring-1 ring-white/20">
            {data.user.avatarEmoji}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-accent-100">你好</p>
            <h1 className="truncate text-xl font-bold tracking-tight">{data.user.name}</h1>
          </div>
        </div>
        <div className="relative mt-4 flex gap-2">
          <StatPill icon={<IconStar className="h-4 w-4" />} label="经验" value={data.user.totalXp} />
          <StatPill
            icon={<IconFlame className="h-4 w-4" />}
            label="连续"
            value={`${data.user.streakDays} 天`}
          />
        </div>
      </section>

      {/* Today mission - primary CTA */}
      {mission && (
        <section className="mb-5">
          <SectionLabel>今日任务</SectionLabel>
          <div className="card !p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-accent-600">
                  {mission.done ? "今日已打卡" : mission.kind === "lesson" ? "学习" : mission.kind === "weak" ? "薄弱加强" : "练习"}
                </p>
                <h3 className="mt-0.5 font-bold text-ink">{mission.title}</h3>
                <p className="mt-0.5 text-sm text-ink-muted">{mission.subtitle}</p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <IconPlay className="h-5 w-5" />
              </div>
            </div>
            <div className="mb-3">
              <div className="mb-1 flex justify-between text-xs text-ink-faint">
                <span>今日完成</span>
                <span className="tabular">
                  {mission.todayCompleted}/{mission.todayTarget} 题
                </span>
              </div>
              <ProgressBar value={missionPct} />
            </div>
            <Button variant="primary" block onClick={() => nav(mission.href)}>
              {mission.done ? "再练几题" : "开始任务"}
            </Button>
          </div>
        </section>
      )}

      {/* Weak one-click */}
      {data.weakTypes && data.weakTypes.length > 0 && (
        <section className="mb-5">
          <SectionLabel>薄弱一键练</SectionLabel>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-2.5">
            {data.weakTypes.map((w) => (
              <button
                key={w.typeCode}
                type="button"
                onClick={() => nav(`/practice/${w.typeCode}`)}
                className="card-interactive flex flex-col items-start !p-3 md:!p-3.5"
              >
                <PuzzleTypeIcon code={w.typeCode} withBg size={20} className="mb-1.5" />
                <span className="line-clamp-2 text-left text-xs font-semibold text-ink">{w.name}</span>
                <span className="mt-1 text-[10px] font-medium text-danger">薄弱 {w.weakScore}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {data.recommendations.length > 0 && (
        <section className="mb-5 rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3">
          {data.recommendations.map((rec, i) => (
            <p key={i} className="text-sm font-medium leading-relaxed text-warning">
              {rec}
            </p>
          ))}
        </section>
      )}

      {/* Path */}
      <section className="mb-5">
        <SectionLabel>训练路径</SectionLabel>
        <div className="space-y-2.5">
          {data.phases.map((phase) => {
            const pct =
              phase.totalLessons > 0
                ? Math.round((phase.completedLessons / phase.totalLessons) * 100)
                : 0;
            return (
              <Card key={phase.phase} onClick={() => nav("/learn")}>
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink">{phase.name}</h3>
                  <span className="tabular text-xs text-ink-faint">
                    {phase.completedLessons}/{phase.totalLessons}
                  </span>
                </div>
                <ProgressBar value={pct} className="mb-3" />
                <div className="flex flex-wrap gap-1.5">
                  {phase.puzzleTypes.map((pt) => (
                    <Chip key={pt.code} color={pt.color}>
                      <PuzzleTypeIcon code={pt.code} color={pt.color} size={12} />
                      {pt.name}
                    </Chip>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {data.recentPractice.length > 0 && (
        <section>
          <SectionLabel>最近练习</SectionLabel>
          <div className="space-y-2">
            {data.recentPractice.slice(0, 5).map((r) => {
              const def = getPuzzleType(r.typeCode);
              return (
                <div key={r.id} className="card flex items-center gap-3 !py-3">
                  <PuzzleTypeIcon code={r.typeCode} withBg size={18} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {def?.name ?? r.typeCode}
                    </p>
                    <p className="text-xs text-ink-faint">
                      {r.completed ? "已完成" : "未完成"} · 用时 {formatTime(r.durationMs)}
                      {r.mistakes > 0 ? ` · ${r.mistakes} 次错误` : ""}
                    </p>
                  </div>
                  {r.completed && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </Page>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/12 px-3 py-2 ring-1 ring-white/15">
      <span className="text-accent-100">{icon}</span>
      <div>
        <div className="tabular text-base font-bold leading-none">{value}</div>
        <div className="mt-0.5 text-[10px] text-accent-100">{label}</div>
      </div>
    </div>
  );
}
