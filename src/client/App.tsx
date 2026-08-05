/**
 * 应用主组件：路由 + 布局
 */
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LearnPage } from "./pages/LearnPage";
import { LessonDetailPage } from "./pages/LessonDetailPage";
import { PracticePage } from "./pages/PracticePage";
import { ProfilePage } from "./pages/ProfilePage";
import { useEffect, useState } from "react";
import { IconHome, IconBook, IconGrid, IconUser } from "./components/ui/Icons";
import { Button } from "./components/ui/primitives";

const NAV_ITEMS = [
  { to: "/", label: "首页", icon: IconHome, end: true },
  { to: "/learn", label: "学习", icon: IconBook },
  { to: "/practice", label: "练习", icon: IconGrid },
  { to: "/profile", label: "我的", icon: IconUser },
];

function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-ink/6 bg-white/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="主导航"
    >
      <div className="shell flex">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors duration-200 md:min-h-[3.75rem] md:text-xs ${
                  isActive ? "text-accent-600" : "text-ink-faint"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-1.5 h-1 w-1 rounded-full bg-accent-600 md:top-2" aria-hidden />
                  )}
                  <Icon className="h-6 w-6 md:h-7 md:w-7" />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export function App() {
  const location = useLocation();
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: ErrorEvent) => setBootError(e.message);
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  if (bootError) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4">
        <div className="max-w-xs text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger text-xl font-bold">
            !
          </div>
          <p className="mb-1 font-semibold text-ink">页面出了点问题</p>
          <p className="mb-5 text-sm text-ink-muted">{bootError}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            刷新重试
          </Button>
        </div>
      </div>
    );
  }

  const isPractice =
    location.pathname.startsWith("/practice/") && location.pathname !== "/practice";

  return (
    <div className="min-h-[100dvh] bg-surface">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/learn/:id" element={<LessonDetailPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/practice/:typeCode" element={<PracticePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      {!isPractice && <BottomNav />}
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
