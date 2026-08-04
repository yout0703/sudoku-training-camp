/**
 * 首页：仪表盘
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { DashboardDTO } from "../../shared/api-types";
import { getPuzzleType } from "../../shared/puzzle-types";

export function HomePage() {
  const nav = useNavigate();
  const [data, setData] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;
  if (!data || !data.user) return <ErrorScreen />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
      {/* 欢迎卡片 */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-6 text-white shadow-xl mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl">{data.user.avatarEmoji}</div>
          <div>
            <h1 className="text-2xl font-bold">你好，{data.user.name}！</h1>
            <p className="text-brand-100 text-sm">准备好今天的训练了吗？</p>
          </div>
        </div>
        <div className="flex gap-4">
          <StatBadge icon="⭐" label="经验值" value={data.user.totalXp} />
          <StatBadge icon="🔥" label="连续天数" value={data.user.streakDays} />
        </div>
      </div>

      {/* 推荐 */}
      {data.recommendations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          {data.recommendations.map((rec, i) => (
            <p key={i} className="text-amber-800 text-sm font-medium">
              {rec}
            </p>
          ))}
        </div>
      )}

      {/* 阶段卡片 */}
      <h2 className="text-lg font-bold text-slate-700 mb-3">训练路径</h2>
      <div className="space-y-3 mb-6">
        {data.phases.map((phase) => {
          const pct = phase.totalLessons > 0 ? Math.round((phase.completedLessons / phase.totalLessons) * 100) : 0;
          return (
            <div
              key={phase.phase}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => nav("/learn")}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-700">{phase.name}</h3>
                <span className="text-sm text-slate-400">
                  {phase.completedLessons}/{phase.totalLessons} 课
                </span>
              </div>
              {/* 进度条 */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {/* 题型图标 */}
              <div className="flex gap-2 flex-wrap">
                {phase.puzzleTypes.map((pt) => (
                  <span
                    key={pt.code}
                    className="px-2 py-1 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: `${pt.color}15`, color: pt.color }}
                  >
                    {pt.icon} {pt.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 最近练习 */}
      {data.recentPractice.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-slate-700 mb-3">最近练习</h2>
          <div className="space-y-2">
            {data.recentPractice.slice(0, 5).map((r) => {
              const def = getPuzzleType(r.typeCode);
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3"
                >
                  <span className="text-2xl">{def?.icon ?? "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-700 truncate">{def?.name ?? r.typeCode}</p>
                    <p className="text-xs text-slate-400">
                      {r.completed ? "✅ 已完成" : "⏳ 未完成"} · 用时 {formatTime(r.durationMs)}
                      {r.mistakes > 0 ? ` · ${r.mistakes} 次错误` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function StatBadge({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
      <span className="text-xl">{icon}</span>
      <div>
        <div className="text-lg font-bold leading-none">{value}</div>
        <div className="text-[10px] text-brand-100">{label}</div>
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl animate-bounce mb-3">🧩</div>
        <p className="text-slate-400">加载中...</p>
      </div>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-5xl mb-3">😵</p>
        <p className="text-slate-600 mb-3">连接服务器失败</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-brand-500 text-white rounded-xl">
          重试
        </button>
      </div>
    </div>
  );
}
