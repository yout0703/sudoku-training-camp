/**
 * 个人页：技能统计 + 薄弱点分析
 */
import { useEffect, useState } from "react";
import { api } from "../api";
import type { DashboardDTO } from "../../shared/api-types";
import { getPuzzleType } from "../../shared/puzzle-types";
import {
  Page,
  PageHeader,
  SectionLabel,
  ProgressBar,
  Chip,
  Button,
  LoadingPage,
  EmptyState,
  formatTime,
} from "../components/ui/primitives";
import { IconStar, IconFlame, IconSparkle } from "../components/ui/Icons";
import { PuzzleTypeIcon } from "../components/ui/PuzzleTypeIcon";

export function ProfilePage() {
  const [dashboard, setDashboard] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<{
    summary: string;
    weakPoints: string[];
    recommendations: string[];
    encouragement: string;
  } | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getDashboard().then(setDashboard).finally(() => setLoading(false));
  }, []);

  const refreshAnalysis = () => {
    setAnalysisLoading(true);
    api.getAnalysis().then(setAnalysis).finally(() => setAnalysisLoading(false));
  };

  const handleResetLessons = async () => {
    const ok = window.confirm(
      "确定要重置全部课程进度吗？\n\n学习进度会清掉，课程仍然全部开放。\n练习记录和经验值不会清空。",
    );
    if (!ok) return;

    setResetting(true);
    setResetMsg(null);
    try {
      const r = await api.resetLessons();
      setAnalysis(null);
      setResetMsg(`已重置 ${r.resetCount} 节课程，可从第一课重新开始`);
      const data = await api.getDashboard();
      setDashboard(data);
    } catch (e) {
      setResetMsg(e instanceof Error ? e.message : "重置失败，请稍后重试");
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <LoadingPage />;
  if (!dashboard?.user) return null;

  const { user, skillStats } = dashboard;
  const sortedStats = [...skillStats].sort((a, b) => b.weakScore - a.weakScore);
  const practicedTypes = sortedStats.filter((s) => s.totalAttempts > 0);
  const untriedTypes = sortedStats.filter((s) => s.totalAttempts === 0);

  return (
    <Page>
      <PageHeader title="我的" subtitle="练习数据与教练建议" />

      {/* User summary — light card to differentiate from Home hero */}
      <section className="mb-6 rounded-3xl bg-surface-elevated p-5 shadow-card ring-1 ring-ink/5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-3xl ring-1 ring-accent-600/10">
            {user.avatarEmoji}
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">{user.name}</h2>
            <p className="text-sm text-ink-muted">数独小选手</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-surface px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-ink-faint">
              <IconStar className="h-3.5 w-3.5 text-warning" />
              <span className="text-[10px]">总经验</span>
            </div>
            <div className="tabular mt-0.5 text-xl font-bold text-ink">{user.totalXp}</div>
          </div>
          <div className="rounded-xl bg-surface px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-ink-faint">
              <IconFlame className="h-3.5 w-3.5 text-streak" />
              <span className="text-[10px]">连续天数</span>
            </div>
            <div className="tabular mt-0.5 text-xl font-bold text-ink">{user.streakDays}</div>
          </div>
        </div>
      </section>

      {/* AI coach — stay on light theme (no mid-page invert) */}
      <section className="mb-6 rounded-2xl border border-accent-600/15 bg-accent-50 p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-600 text-white">
              <IconSparkle className="h-4 w-4" />
            </span>
            <h2 className="font-semibold text-ink">AI 教练</h2>
          </div>
          <button
            type="button"
            onClick={refreshAnalysis}
            disabled={analysisLoading}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-accent-700 shadow-card ring-1 ring-accent-600/10 transition active:scale-95 disabled:opacity-50"
          >
            {analysisLoading ? "分析中..." : analysis ? "刷新" : "获取分析"}
          </button>
        </div>
        {analysis ? (
          <div className="space-y-3 text-sm leading-relaxed">
            <p className="text-ink">{analysis.summary}</p>
            {analysis.weakPoints.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-ink-muted">需要注意</p>
                {analysis.weakPoints.map((wp, i) => (
                  <p key={i} className="text-ink-muted">
                    · {wp}
                  </p>
                ))}
              </div>
            )}
            {analysis.recommendations.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-ink-muted">教练建议</p>
                {analysis.recommendations.map((rec, i) => (
                  <p key={i} className="text-ink-muted">
                    · {rec}
                  </p>
                ))}
              </div>
            )}
            <p className="border-t border-accent-600/10 pt-2 text-accent-800">
              {analysis.encouragement}
            </p>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">
            {analysisLoading
              ? "正在分析你的练习数据..."
              : "点「获取分析」，根据练习记录给出专属建议"}
          </p>
        )}
      </section>

      {/* Skill analysis */}
      <section className="mb-6">
        <SectionLabel>技能分析</SectionLabel>
        {practicedTypes.length === 0 ? (
          <EmptyState
            illustration="/illustrations/empty-practice.jpg"
            title="还没有练习记录"
            description="完成一些练习后，这里会显示你的技能分析"
          />
        ) : (
          <div className="space-y-2.5">
            {practicedTypes.map((stat) => {
              const def = getPuzzleType(stat.typeCode);
              if (!def) return null;
              const weakColor =
                stat.weakScore > 60 ? "var(--color-danger)" : stat.weakScore > 40 ? "var(--color-warning)" : "var(--color-success)";
              const weakLabel =
                stat.weakScore > 60 ? "需要加强" : stat.weakScore > 40 ? "继续努力" : "掌握良好";

              return (
                <div key={stat.typeCode} className="card">
                  <div className="mb-3 flex items-center gap-3">
                    <PuzzleTypeIcon code={stat.typeCode} withBg size={20} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{def.name}</div>
                      <div className="text-xs text-ink-faint">
                        练习 {stat.totalAttempts} 次 · 完成 {stat.completedCount} 题
                        {stat.bestTimeMs ? ` · 最快 ${formatTime(stat.bestTimeMs)}` : ""}
                      </div>
                    </div>
                    <span
                      className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold"
                      style={{ backgroundColor: `${weakColor}18`, color: weakColor }}
                    >
                      {weakLabel}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <StatBar
                      label="完成率"
                      display={`${Math.round(stat.completionRate * 100)}%`}
                      pct={stat.completionRate * 100}
                      color="var(--color-success)"
                    />
                    <StatBar
                      label="平均用时"
                      display={stat.avgDurationMs > 0 ? formatTime(stat.avgDurationMs) : "—"}
                      pct={Math.min((stat.avgDurationMs / 300000) * 100, 100)}
                      color="var(--color-accent-600)"
                    />
                    <StatBar
                      label="薄弱指数"
                      display={`${stat.weakScore}`}
                      pct={stat.weakScore}
                      color={weakColor}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {untriedTypes.length > 0 && (
        <section className="mb-6">
          <SectionLabel>尚未练习</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {untriedTypes.map((stat) => {
              const def = getPuzzleType(stat.typeCode);
              if (!def) return null;
              return (
                <Chip key={stat.typeCode} color={def.color}>
                  <PuzzleTypeIcon code={stat.typeCode} color={def.color} size={12} />
                  {def.name}
                </Chip>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-6">
        <SectionLabel>训练进度</SectionLabel>
        <div className="space-y-2">
          {dashboard.phases.map((phase) => {
            const pct =
              phase.totalLessons > 0
                ? Math.round((phase.completedLessons / phase.totalLessons) * 100)
                : 0;
            return (
              <div key={phase.phase} className="card !py-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{phase.name}</span>
                  <span className="tabular text-xs text-ink-faint">{pct}%</span>
                </div>
                <ProgressBar value={pct} />
              </div>
            );
          })}
        </div>
      </section>

      {/* 设置：重置课程 */}
      <section>
        <SectionLabel>设置</SectionLabel>
        <div className="card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">重置课程进度</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                将所有课程恢复为未完成：只保留第一课可学，其余重新锁定。不影响练习记录与经验值。
              </p>
            </div>
            <Button
              variant="secondary"
              disabled={resetting}
              onClick={handleResetLessons}
              className="shrink-0 !border-danger/25 !text-danger sm:min-w-[7.5rem]"
            >
              {resetting ? "重置中..." : "重置课程"}
            </Button>
          </div>
          {resetMsg && (
            <p className="mt-3 border-t border-ink/6 pt-3 text-xs text-ink-muted" role="status">
              {resetMsg}
            </p>
          )}
        </div>
      </section>
    </Page>
  );
}

function StatBar({
  label,
  display,
  pct,
  color,
}: {
  label: string;
  display: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-xs text-ink-faint">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="tabular w-12 text-right text-xs text-ink-muted">{display}</span>
    </div>
  );
}
