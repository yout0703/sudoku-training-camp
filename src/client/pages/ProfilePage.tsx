/**
 * 个人页：技能统计 + 薄弱点分析
 */
import { useEffect, useState } from "react";
import { api } from "../api";
import type { DashboardDTO, SkillStatDTO } from "../../shared/api-types";
import { getPuzzleType, PHASE_NAMES } from "../../shared/puzzle-types";

export function ProfilePage() {
  const [analysis, setAnalysis] = useState<{
    summary: string;
    weakPoints: string[];
    recommendations: string[];
    encouragement: string;
  } | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    api.getDashboard().then(setDashboard).finally(() => setLoading(false));
  }, []);

  const refreshAnalysis = () => {
    setAnalysisLoading(true);
    api.getAnalysis().then(setAnalysis).finally(() => setAnalysisLoading(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">📊</div>
      </div>
    );
  }

  if (!dashboard?.user) return null;
  const { user, skillStats } = dashboard;

  // 按薄弱分排序
  const sortedStats = [...skillStats].sort((a, b) => b.weakScore - a.weakScore);
  const practicedTypes = sortedStats.filter((s) => s.totalAttempts > 0);
  const untriedTypes = sortedStats.filter((s) => s.totalAttempts === 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
      {/* 用户卡片 */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-6 text-white shadow-xl mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl">{user.avatarEmoji}</div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-brand-100 text-sm">数独小选手</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{user.totalXp}</div>
            <div className="text-xs text-brand-100">⭐ 总经验值</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{user.streakDays}</div>
            <div className="text-xs text-brand-100">🔥 连续天数</div>
          </div>
        </div>
      </div>

      {/* AI 教练分析 */}
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h2 className="font-bold">AI 教练分析</h2>
          </div>
          <button
            onClick={refreshAnalysis}
            disabled={analysisLoading}
            className="text-xs bg-white/20 px-3 py-1.5 rounded-lg active:scale-95 disabled:opacity-50"
          >
            {analysisLoading ? "分析中..." : analysis ? "刷新" : "获取分析"}
          </button>
        </div>
        {analysis ? (
          <div className="space-y-3">
            <p className="text-sm text-purple-50">{analysis.summary}</p>
            {analysis.weakPoints.length > 0 && (
              <div>
                <p className="text-xs text-purple-200 mb-1">⚠️ 需要注意</p>
                {analysis.weakPoints.map((wp, i) => (
                  <p key={i} className="text-sm text-white">· {wp}</p>
                ))}
              </div>
            )}
            {analysis.recommendations.length > 0 && (
              <div>
                <p className="text-xs text-purple-200 mb-1">💡 教练建议</p>
                {analysis.recommendations.map((rec, i) => (
                  <p key={i} className="text-sm text-white">· {rec}</p>
                ))}
              </div>
            )}
            <p className="text-sm text-amber-200 italic border-t border-white/20 pt-2 mt-2">
              {analysis.encouragement}
            </p>
          </div>
        ) : (
          <p className="text-sm text-purple-100">
            {analysisLoading ? "正在分析你的练习数据..." : "点击「获取分析」，让 AI 教练给你专属建议！"}
          </p>
        )}
      </div>

      {/* 薄弱点分析 */}
      <h2 className="text-lg font-bold text-slate-700 mb-3">📊 技能分析</h2>

      {practicedTypes.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-slate-500 text-sm">还没有练习记录</p>
          <p className="text-slate-400 text-xs mt-1">完成一些练习后，这里会显示你的技能分析</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {practicedTypes.map((stat) => {
            const def = getPuzzleType(stat.typeCode);
            if (!def) return null;
            const weakColor =
              stat.weakScore > 60 ? "#ef4444" : stat.weakScore > 40 ? "#f59e0b" : "#22c55e";
            const weakLabel = stat.weakScore > 60 ? "需要加强" : stat.weakScore > 40 ? "继续努力" : "掌握良好";

            return (
              <div key={stat.typeCode} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{def.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-slate-700 text-sm">{def.name}</div>
                    <div className="text-xs text-slate-400">
                      练习 {stat.totalAttempts} 次 · 完成 {stat.completedCount} 题
                      {stat.bestTimeMs ? ` · 最快 ${formatTime(stat.bestTimeMs)}` : ""}
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={{ backgroundColor: `${weakColor}15`, color: weakColor }}
                  >
                    {weakLabel}
                  </span>
                </div>

                {/* 统计条 */}
                <div className="space-y-1.5">
                  <StatBar label="完成率" value={stat.completionRate} max={1} color="#22c55e" display={`${Math.round(stat.completionRate * 100)}%`} />
                  <StatBar
                    label="平均用时"
                    value={Math.min(stat.avgDurationMs / 300000, 1)}
                    max={1}
                    color="#3b82f6"
                    display={stat.avgDurationMs > 0 ? formatTime(stat.avgDurationMs) : "—"}
                  />
                  <StatBar
                    label="薄弱指数"
                    value={stat.weakScore / 100}
                    max={1}
                    color={weakColor}
                    display={`${stat.weakScore}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 未练习的题型 */}
      {untriedTypes.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-slate-500 mb-2">尚未练习</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {untriedTypes.map((stat) => {
              const def = getPuzzleType(stat.typeCode);
              if (!def) return null;
              return (
                <span
                  key={stat.typeCode}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-400"
                >
                  {def.icon} {def.name}
                </span>
              );
            })}
          </div>
        </>
      )}

      {/* 阶段进度总览 */}
      <h2 className="text-lg font-bold text-slate-700 mb-3">🏁 训练进度</h2>
      <div className="space-y-2">
        {dashboard.phases.map((phase) => {
          const pct = phase.totalLessons > 0 ? Math.round((phase.completedLessons / phase.totalLessons) * 100) : 0;
          return (
            <div key={phase.phase} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium text-slate-600">{phase.name}</span>
                <span className="text-xs text-slate-400">{pct}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBar({
  label,
  value,
  max,
  color,
  display,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  display: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-slate-500 w-16 text-right font-mono">{display}</span>
    </div>
  );
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
