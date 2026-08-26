/**
 * 自定义 404：找不到资源时的友好引导
 */
import { useNavigate } from "react-router-dom";
import { Page, Button } from "../components/ui/primitives";
import { IconPuzzle } from "../components/ui/Icons";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("页面走丢了 · 0703 数独", "这个页面不存在，回习题大厅挑一题继续开做。");
  const nav = useNavigate();

  return (
    <Page>
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-3 border-ink bg-yellow text-4xl font-black shadow-[4px_4px_0_var(--color-ink)]">
          404
        </div>
        <h1 className="font-display mt-5 text-2xl font-black text-ink">这道题走丢了</h1>
        <p className="mt-2 max-w-sm text-sm font-semibold leading-relaxed text-ink-muted">
          你要找的页面不在棋盘上，也可能已经在清理旧题时被移走。回到题型大厅，挑一题继续开做。
        </p>
        <div className="mt-6 flex gap-2.5">
          <Button variant="secondary" onClick={() => nav("/")} className="font-black">
            <IconPuzzle className="h-4 w-4" />
            返回首页
          </Button>
          <Button variant="primary" onClick={() => nav("/practice")} className="font-black">
            去题型大厅
          </Button>
        </div>
      </div>
    </Page>
  );
}
