import { useEffect, useState } from "react";
import { api } from "../api";
import { useUserStore } from "../stores/userStore";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getLocalRecords, getAllLocalDrafts } from "../lib/storage";
import type { DashboardDTO } from "../../shared/api-types";
import { getPuzzleType } from "../../shared/puzzle-types";
import {
  Page,
  PageHeader,
  SectionLabel,
  Button,
  LoadingPage,
  EmptyState,
  formatTime,
} from "../components/ui/primitives";
import { IconStar, IconFlame, IconUser, IconLightbulb, IconChart } from "../components/ui/Icons";
import { PuzzleTypeIcon } from "../components/ui/PuzzleTypeIcon";

export function ProfilePage() {
  useDocumentTitle(
    "我的记录 · 账号管理与技能统计",
    "查看数独做题统计、做题草稿以及各变体题型掌握度分析。"
  );
  const user = useUserStore((s) => s.user);
  const quickLogin = useUserStore((s) => s.quickLogin);
  const login = useUserStore((s) => s.login);
  const register = useUserStore((s) => s.register);
  const logout = useUserStore((s) => s.logout);

  const [dashboard, setDashboard] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // 登录/注册表单弹窗
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"quick" | "password">("quick");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const loadData = () => {
    setLoading(true);
    api
      .getDashboard()
      .then(setDashboard)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setAuthError("请输入用户名");
      return;
    }
    setAuthSubmitting(true);
    setAuthError(null);
    const res = await quickLogin(usernameInput.trim(), nameInput.trim() || undefined);
    setAuthSubmitting(false);
    if (res.success) {
      setShowAuthModal(false);
      setUsernameInput("");
      setNameInput("");
      loadData();
    } else {
      setAuthError(res.error || "登录或创建用户失败，请重试");
    }
  };

  const handlePasswordAuth = async (isRegister: boolean) => {
    if (!usernameInput.trim()) {
      setAuthError("请输入用户名");
      return;
    }
    setAuthSubmitting(true);
    setAuthError(null);
    if (isRegister) {
      const res = await register({
        username: usernameInput.trim(),
        password: passwordInput || undefined,
        name: nameInput.trim() || undefined,
      });
      setAuthSubmitting(false);
      if (res.success) {
        setShowAuthModal(false);
        setUsernameInput("");
        setPasswordInput("");
        loadData();
      } else {
        setAuthError(res.error || "注册失败");
      }
    } else {
      const res = await login(usernameInput.trim(), passwordInput || undefined);
      setAuthSubmitting(false);
      if (res.success) {
        setShowAuthModal(false);
        setUsernameInput("");
        setPasswordInput("");
        loadData();
      } else {
        setAuthError(res.error || "登录失败");
      }
    }
  };

  if (loading) return <LoadingPage />;

  const skillStats = dashboard?.skillStats ?? [];
  const sortedStats = [...skillStats].sort((a, b) => b.weakScore - a.weakScore);
  const practicedTypes = sortedStats.filter((s) => s.totalAttempts > 0);
  const localRecords = getLocalRecords();
  const localDrafts = getAllLocalDrafts();

  return (
    <Page>
      <PageHeader title="我的记录" subtitle="账号管理、做题数据与掌握度分析" />

      {/* 用户状态卡片 */}
      <section className="mb-6 rounded-3xl border-3 border-ink bg-surface p-5 shadow-[4px_4px_0_var(--color-ink)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-ink bg-yellow text-2xl shadow-[2px_2px_0_var(--color-ink)]">
              {user ? user.avatarEmoji : <IconUser className="h-7 w-7 text-ink" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-ink">
                {user ? user.name : "游客模式"}
              </h2>
              <p className="text-xs font-semibold text-ink-muted">
                {user ? `@${user.username} · 已与云端 SQLite 同步` : "未登录 · 数据保存在当前浏览器"}
              </p>
            </div>
          </div>
          <div>
            {user ? (
              <Button variant="secondary" onClick={logout} className="!py-1.5 !px-3.5 text-xs font-black">
                退出登录
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setShowAuthModal(true)}
                className="!py-1.5 !px-3.5 text-xs font-black"
              >
                登录 / 注册
              </Button>
            )}
          </div>
        </div>

        {user ? (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border-2 border-ink bg-yellow-soft px-3 py-2.5 text-center shadow-[2px_2px_0_var(--color-ink)]">
              <div className="flex items-center justify-center gap-1 text-ink-muted font-bold">
                <IconStar className="h-4 w-4 text-warning" />
                <span className="text-xs">总经验值</span>
              </div>
              <div className="tabular mt-0.5 text-xl font-black text-ink">{user.totalXp} XP</div>
            </div>
            <div className="rounded-2xl border-2 border-ink bg-orange-soft px-3 py-2.5 text-center shadow-[2px_2px_0_var(--color-ink)]">
              <div className="flex items-center justify-center gap-1 text-ink-muted font-bold">
                <IconFlame className="h-4 w-4 text-orange" />
                <span className="text-xs">连续天数</span>
              </div>
              <div className="tabular mt-0.5 text-xl font-black text-ink">{user.streakDays} 天</div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border-2 border-ink/30 bg-paper p-3 text-xs leading-relaxed text-ink-muted">
            <p className="font-bold text-ink mb-1 flex items-center gap-1">
              <IconLightbulb className="h-4 w-4 text-orange inline shrink-0" />
              <span>跨设备同步说明</span>
            </p>
            <p>
              当前为未登录模式，浏览器中已记录了 {localDrafts.length} 个未完成草稿和{" "}
              {localRecords.length} 条做题记录。
            </p>
            <p className="mt-1 font-bold text-orange">
              登录后会自动将当前浏览器的所有数据合并到云端 SQLite 数据库！
            </p>
          </div>
        )}
      </section>

      {/* 技能分析 */}
      <section className="mb-6">
        <SectionLabel>
          <IconChart className="h-4 w-4 text-orange inline" />
          <span>各题型熟练度</span>
        </SectionLabel>
        {practicedTypes.length === 0 ? (
          <EmptyState
            illustration="/illustrations/empty-practice.jpg"
            title="暂无做题数据"
            description="去题型大厅做几道题目，这里会实时展示你的完成率与掌握度"
          />
        ) : (
          <div className="space-y-2.5">
            {practicedTypes.map((stat) => {
              const def = getPuzzleType(stat.typeCode);
              if (!def) return null;
              const weakLabel =
                stat.weakScore > 60 ? "需加强" : stat.weakScore > 40 ? "良好" : "熟练";

              return (
                <div key={stat.typeCode} className="card !p-3.5">
                  <div className="mb-2.5 flex items-center gap-3">
                    <PuzzleTypeIcon code={stat.typeCode} withBg size={22} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black text-ink">{def.name}</div>
                      <div className="text-xs font-medium text-ink-muted">
                        练习 {stat.totalAttempts} 次 · 完成 {stat.completedCount} 题
                        {stat.bestTimeMs ? ` · 最快 ${formatTime(stat.bestTimeMs)}` : ""}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border-1.5 border-ink bg-yellow-soft px-2.5 py-0.5 text-[10px] font-black text-ink shadow-[1.5px_1.5px_0_var(--color-ink)]">
                      {weakLabel}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <StatBar
                      label="完成率"
                      display={`${Math.round(stat.completionRate * 100)}%`}
                      pct={stat.completionRate * 100}
                      color="var(--color-green)"
                    />
                    <StatBar
                      label="平均用时"
                      display={stat.avgDurationMs > 0 ? formatTime(stat.avgDurationMs) : "—"}
                      pct={Math.min((stat.avgDurationMs / 300000) * 100, 100)}
                      color="var(--color-orange)"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 登录/注册弹窗 */}
      {showAuthModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-panel max-w-sm">
            <h2 className="text-xl font-black text-ink mb-1">登录 / 切换账号</h2>
            <p className="text-xs font-semibold text-ink-muted mb-4">
              进度将自动同步到云端 SQLite 数据库
            </p>

            <div className="mb-4 flex rounded-full border-2 border-ink bg-surface p-1 shadow-[2px_2px_0_var(--color-ink)]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("quick");
                  setAuthError(null);
                }}
                className={`flex-1 rounded-full py-1 text-xs font-black transition-all ${
                  authMode === "quick" ? "bg-yellow text-ink border border-ink shadow-sm" : "text-ink-muted"
                }`}
              >
                一键快捷登录
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("password");
                  setAuthError(null);
                }}
                className={`flex-1 rounded-full py-1 text-xs font-black transition-all ${
                  authMode === "password" ? "bg-yellow text-ink border border-ink shadow-sm" : "text-ink-muted"
                }`}
              >
                账号密码登录
              </button>
            </div>

            {authMode === "quick" ? (
              <form onSubmit={handleQuickLogin} className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">用户名 / 账号</label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="如: player1"
                    className="w-full rounded-xl border-2 border-ink bg-surface px-3 py-2 text-sm text-ink font-bold outline-none focus:bg-yellow-soft"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">昵称（可选）</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="如: 数独小明"
                    className="w-full rounded-xl border-2 border-ink bg-surface px-3 py-2 text-sm text-ink font-bold outline-none focus:bg-yellow-soft"
                  />
                </div>
                {authError && <p className="text-xs font-bold text-danger">{authError}</p>}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    block
                    onClick={() => setShowAuthModal(false)}
                    className="font-black"
                  >
                    取消
                  </Button>
                  <Button type="submit" variant="primary" block disabled={authSubmitting} className="font-black">
                    {authSubmitting ? "进入中..." : "进入账号"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">用户名</label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="输入用户名"
                    className="w-full rounded-xl border-2 border-ink bg-surface px-3 py-2 text-sm text-ink font-bold outline-none focus:bg-yellow-soft"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">密码</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="输入密码"
                    className="w-full rounded-xl border-2 border-ink bg-surface px-3 py-2 text-sm text-ink font-bold outline-none focus:bg-yellow-soft"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    昵称（新注册需要）
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="设置昵称"
                    className="w-full rounded-xl border-2 border-ink bg-surface px-3 py-2 text-sm text-ink font-bold outline-none focus:bg-yellow-soft"
                  />
                </div>
                {authError && <p className="text-xs font-bold text-danger">{authError}</p>}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    block
                    disabled={authSubmitting}
                    onClick={() => handlePasswordAuth(false)}
                    className="font-black"
                  >
                    登录
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    block
                    disabled={authSubmitting}
                    onClick={() => handlePasswordAuth(true)}
                    className="font-black"
                  >
                    注册新账号
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
      <span className="w-14 shrink-0 text-xs font-bold text-ink-muted">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full border border-ink bg-surface-sunken">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="tabular w-12 text-right text-xs font-black text-ink">{display}</span>
    </div>
  );
}
