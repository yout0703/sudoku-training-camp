/**
 * 动态更新网页 Title 与 Description，提升 SPA 客户端 SEO 与可访问性
 */
import { useEffect } from "react";

export function useDocumentTitle(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | 0703 数独` : "0703 数独 · 在线数独题库与训练营";

    if (description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", description);
      }
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description]);
}
