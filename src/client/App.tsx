/**
 * 应用主组件：路由 + 布局 + 0703 品牌协同
 */
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { PracticePage } from "./pages/PracticePage";
import { ProfilePage } from "./pages/ProfilePage";
import { StudioHeader } from "./components/ui/StudioHeader";
import { useEffect, useState } from "react";
import { IconHome, IconGrid, IconUser } from "./components/ui/Icons";
import { Button } from "./components/ui/primitives";
import { useUserStore } from "./stores/userStore";

const NAV_ITEMS = [
  { to: "/", label: "题型大厅", icon: IconHome, end: true },
  { to: "/practice", label: "在线做题", icon: IconGrid },
  { to: "/profile", label: "我的记录", icon: IconUser },
];

function BottomNav() {
  return (
    <nav
      className="fixed bottom-3 left-0 right-0 z-50 px-3 pb-[env(safe-area-inset-bottom)] pointer-events-none"
      aria-label="主导航"
    >
      <div className="shell flex pointer-events-auto">
        <div className="mx-auto flex w-full max-w-sm items-center justify-around rounded-full border-2 border-ink bg-surface/95 px-2 py-1.5 shadow-[4px_4px_0_var(--color-ink)] backdrop-blur-md">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex min-h-[2.75rem] flex-1 flex-col items-center justify-center rounded-full py-1 text-[11px] font-extrabold transition-all ${
                    isActive
                      ? "bg-orange text-white shadow-[2px_2px_0_var(--color-ink)] border-1.5 border-ink"
                      : "text-ink-muted hover:text-ink"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span className="leading-none mt-0.5">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function App() {
  const location = useLocation();
  const [bootError, setBootError] = useState<string | null>(null);
  const initAuth = useUserStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    const handler = (e: ErrorEvent) => setBootError(e.message);
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  if (bootError) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4 bg-paper">
        <div className="max-w-xs text-center card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger text-2xl font-black border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]">
            !
          </div>
          <p className="mb-1 font-bold text-ink text-base">页面出了点问题</p>
          <p className="mb-5 text-xs text-ink-muted">{bootError}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            刷新重试
          </Button>
        </div>
      </div>
    );
  }

  const isPracticeSolver =
    location.pathname.startsWith("/practice/") && location.pathname !== "/practice";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-paper">
      <a href="#main" className="skip-link">
        跳到主要内容
      </a>
      {!isPracticeSolver && <StudioHeader />}
      <div id="main" tabIndex={-1} className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/practice/:typeCode" element={<PracticePage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
      {!isPracticeSolver && <BottomNav />}
    </div>
  );
}

export default function AppRoot() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
