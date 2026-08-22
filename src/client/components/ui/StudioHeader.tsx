import { useUserStore } from "../../stores/userStore";
import { useNavigate } from "react-router-dom";
import { IconUser } from "./Icons";

export function StudioHeader() {
  const user = useUserStore((s) => s.user);
  const nav = useNavigate();

  return (
    <header className="w-full border-b-2 border-ink bg-paper/90 backdrop-blur-md sticky top-0 z-40 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4">
      <div className="shell flex items-center justify-between gap-3">
        {/* 左侧：0703 Studio 品牌跳转与应用名 */}
        <div className="flex items-center gap-2.5">
          <a
            href="https://0703.pro/"
            target="_blank"
            rel="noopener noreferrer"
            title="前往 0703 Studio 主站"
            className="group inline-flex items-center gap-1 rounded-full border-2 border-ink bg-surface px-2.5 py-1 text-xs font-black tracking-tight text-ink shadow-[2px_2px_0_var(--color-ink)] transition-all hover:bg-yellow hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none"
          >
            <span className="h-2 w-2 rounded-full bg-orange animate-pulse" />
            <span className="font-extrabold font-mono">0703</span>
            <span className="text-[10px] text-ink-muted group-hover:text-ink">Studio ↗</span>
          </a>

          <div className="h-3 w-[1.5px] bg-ink/20" />

          <button
            type="button"
            onClick={() => nav("/")}
            className="text-left font-black tracking-tight text-ink text-sm sm:text-base hover:text-orange transition-colors"
          >
            数独工坊
          </button>
        </div>

        {/* 右侧：用户状态 */}
        <div className="flex items-center gap-2">
          {user ? (
            <button
              type="button"
              onClick={() => nav("/profile")}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-surface px-2.5 py-0.5 text-xs font-bold text-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-yellow-soft transition active:translate-y-[1px] active:shadow-none"
            >
              <span>{user.avatarEmoji}</span>
              <span className="max-w-[5rem] truncate text-[11px] font-black">{user.name}</span>
              <span className="rounded-full bg-orange text-white px-1.5 py-0.2 text-[9px] font-black">
                {user.totalXp} XP
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => nav("/profile")}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-surface px-2.5 py-1 text-xs font-black text-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-yellow transition active:translate-y-[1px] active:shadow-none"
            >
              <IconUser className="h-3.5 w-3.5" />
              <span className="text-[11px]">游客 / 登录</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
