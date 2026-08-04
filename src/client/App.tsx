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

const NAV_ITEMS = [
  { to: "/", label: "首页", icon: "🏠" },
  { to: "/learn", label: "学习", icon: "📚" },
  { to: "/practice", label: "练习", icon: "🎮" },
  { to: "/profile", label: "我的", icon: "📊" },
];

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto flex">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
                isActive ? "text-brand-600" : "text-slate-400"
              }`
            }
          >
            <span className="text-2xl leading-none">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function App() {
  const location = useLocation();
  const [bootError, setBootError] = useState<string | null>(null);

  // 全局错误捕获
  useEffect(() => {
    const handler = (e: ErrorEvent) => setBootError(e.message);
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  if (bootError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-4">😵</p>
          <p className="text-slate-600 mb-2">页面出了点小问题</p>
          <p className="text-sm text-slate-400 mb-4">{bootError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand-500 text-white rounded-xl"
          >
            刷新重试
          </button>
        </div>
      </div>
    );
  }

  // 练习页面不需要底部导航（全屏沉浸）
  const isPractice = location.pathname.startsWith("/practice/") && location.pathname !== "/practice";

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/learn/:id" element={<LessonDetailPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/practice/:typeCode" element={<PracticePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      {!isPractice && <BottomNav />}
      {!isPractice && <div className="h-16" />}
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
