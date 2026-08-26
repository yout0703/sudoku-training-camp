/**
 * 首页：0703 Studio · 数独在线工坊
 * 涵盖全部 23 个数独题型，直接挑题即开即做，支持草稿快速恢复与规格筛选
 */
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useUserStore } from "../stores/userStore";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getAllLocalDrafts } from "../lib/storage";
import type { DashboardDTO, SavedDraftDTO } from "../../shared/api-types";
import { PUZZLE_TYPES, getPuzzleType } from "../../shared/puzzle-types";
import {
  Page,
  SectionLabel,
  Button,
  LoadingPage,
  ErrorPage,
  formatTime,
} from "../components/ui/primitives";
import {
  IconFlame,
  IconStar,
  IconPlay,
  IconClock,
  IconTarget,
  IconSave,
  IconCloud,
  IconLightbulb,
  IconPuzzle,
} from "../components/ui/Icons";
import { PuzzleTypeIcon } from "../components/ui/PuzzleTypeIcon";

type FilterTab = "all" | 4 | 6 | 9;

export function HomePage() {
  useDocumentTitle(
    "数独工坊 · 23 种变体数独在线题库",
    "0703 Studio 免费专业数独做题工坊，包含标准四/六/九宫，对角线、奇偶、杀手、加减、不规则、连续、五六、堡垒、比例、无马数独等 23 种题型。"
  );
  const nav = useNavigate();
  const user = useUserStore((s) => s.user);
  const [data, setData] = useState<DashboardDTO | null>(null);
  const [localDrafts, setLocalDrafts] = useState<SavedDraftDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const load = () => {
    setLoading(true);
    setError(false);
    setLocalDrafts(getAllLocalDrafts());
    api
      .getDashboard()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [user]);

  const filteredTypes = useMemo(() => {
    if (activeTab === "all") return PUZZLE_TYPES;
    return PUZZLE_TYPES.filter((t) => t.gridSize === activeTab);
  }, [activeTab]);

  if (loading) return <LoadingPage />;
  if (error || !data) return <ErrorPage onRetry={load} />;

  // 综合草稿
  const activeDrafts =
    data.activeDrafts && data.activeDrafts.length > 0
      ? data.activeDrafts
      : localDrafts.map((d) => ({
          typeCode: d.typeCode,
          difficulty: d.difficulty,
          puzzleId: d.puzzleId,
          elapsedMs: d.elapsedMs,
          updatedAt: d.updatedAt || "",
        }));

  return (
    <Page>
      {/* 头部 0703 Studio 工坊 Hero 卡片 */}
      <section className="relative mb-6 overflow-hidden rounded-3xl border-3 border-ink bg-gradient-to-br from-yellow via-yellow-soft to-orange-soft p-5 text-ink shadow-[4px_4px_0_var(--color-ink)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-surface text-2xl shadow-[2px_2px_0_var(--color-ink)]">
              {user ? user.avatarEmoji : <IconPuzzle className="h-7 w-7 text-ink" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-black tracking-tight text-ink">
                  {user ? user.name : "0703 数独工坊"}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border-1.5 border-ink bg-surface px-2.5 py-0.5 text-[10px] font-black shadow-[1px_1px_0_var(--color-ink)]">
                  {user ? (
                    <>
                      <IconCloud className="h-3 w-3 text-blue inline" />
                      <span>云端已同步</span>
                    </>
                  ) : (
                    <>
                      <IconSave className="h-3 w-3 text-ink-muted inline" />
                      <span>本地已存</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs font-bold text-ink-muted mt-0.5">
                全 23 题型即选即做 · 自动生成唯一解 · 规则全内置
              </p>
            </div>
          </div>
        </div>

        {user ? (
          <div className="mt-4 flex gap-2.5">
            <div className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-surface px-3 py-1 text-xs font-black shadow-[2px_2px_0_var(--color-ink)]">
              <IconStar className="h-4 w-4 text-warning" />
              <span className="tabular">{user.totalXp} XP</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-surface px-3 py-1 text-xs font-black shadow-[2px_2px_0_var(--color-ink)]">
              <IconFlame className="h-4 w-4 text-orange" />
              <span className="tabular">连做 {user.streakDays} 天</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between rounded-xl border-2 border-ink/40 bg-surface/80 px-3 py-2 text-xs font-bold text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <IconLightbulb className="h-4 w-4 text-orange shrink-0" />
              <span>想要在手机与电脑间无缝同步进度？</span>
            </span>
            <button
              type="button"
              onClick={() => nav("/profile")}
              className="font-black text-orange hover:underline ml-2 shrink-0"
            >
              登录账号 →
            </button>
          </div>
        )}
      </section>

      {/* 进行中的题目草稿 */}
      {activeDrafts.length > 0 && (
        <section className="mb-6">
          <SectionLabel>
            <IconClock className="h-4 w-4 text-orange inline" />
            <span>继续解题（未完成草稿）</span>
          </SectionLabel>
          <div className="space-y-2.5">
            {activeDrafts.slice(0, 3).map((draft) => {
              const def = getPuzzleType(draft.typeCode);
              const diffLabel =
                draft.difficulty === "easy"
                  ? "简单"
                  : draft.difficulty === "hard"
                  ? "困难"
                  : "中等";
              return (
                <div
                  key={`${draft.typeCode}_${draft.difficulty}`}
                  className="card flex items-center justify-between gap-3 !p-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <PuzzleTypeIcon code={draft.typeCode} withBg size={24} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-black text-ink">
                          {def?.name ?? draft.typeCode}
                        </h3>
                        <span className="rounded-full border border-ink bg-yellow px-2 py-0.2 text-[10px] font-black">
                          {diffLabel}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-ink-muted mt-0.5">
                        已用时 {formatTime(draft.elapsedMs)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => nav(`/practice/${draft.typeCode}?diff=${draft.difficulty}`)}
                    className="shrink-0 !py-1.5 !px-3.5 text-xs font-black"
                  >
                    <IconPlay className="h-3.5 w-3.5" />
                    <span>继续</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 题型大厅与规格过滤 */}
      <section className="mb-6">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <SectionLabel className="!mb-0">
            <IconTarget className="h-4 w-4 text-orange inline" />
            <span>题型大厅（挑一题开做）</span>
          </SectionLabel>
          {/* 尺寸过滤胶囊 */}
          <div className="flex gap-1 rounded-full border-2 border-ink bg-surface p-1 shadow-[2px_2px_0_var(--color-ink)]">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`rounded-full px-2.5 py-0.5 text-xs font-black transition ${
                activeTab === "all" ? "bg-yellow text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              全部 (23)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(4)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-black transition ${
                activeTab === 4 ? "bg-green text-white" : "text-ink-muted hover:text-ink"
              }`}
            >
              4×4 四宫
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(6)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-black transition ${
                activeTab === 6 ? "bg-blue text-white" : "text-ink-muted hover:text-ink"
              }`}
            >
              6×6 六宫
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(9)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-black transition ${
                activeTab === 9 ? "bg-purple text-white" : "text-ink-muted hover:text-ink"
              }`}
            >
              9×9 九宫
            </button>
          </div>
        </div>

        {/* 题型卡片网格列表 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredTypes.map((typeDef) => {
            const sizeBadgeColor =
              typeDef.gridSize === 4
                ? "bg-green text-white"
                : typeDef.gridSize === 6
                ? "bg-blue text-white"
                : "bg-purple text-white";

            return (
              <div
                key={typeDef.code}
                className="card-interactive flex flex-col justify-between gap-3 !p-4"
                onClick={() => nav(`/practice/${typeDef.code}`)}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <PuzzleTypeIcon code={typeDef.code} withBg size={22} />
                      <h3 className="font-black text-ink text-sm sm:text-base">
                        {typeDef.name}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full border border-ink px-2 py-0.2 text-[10px] font-black ${sizeBadgeColor}`}
                    >
                      {typeDef.gridSize}×{typeDef.gridSize}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink-muted leading-relaxed line-clamp-2">
                    {typeDef.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-ink/10 pt-2 text-xs font-bold text-orange">
                  <span className="text-[11px] text-ink-faint">规则全内置 · 即开即做</span>
                  <span className="inline-flex items-center gap-1 font-black hover:translate-x-0.5 transition">
                    立即开题 →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Page>
  );
}
