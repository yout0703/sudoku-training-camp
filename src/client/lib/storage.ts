/**
 * 统一进度存储服务
 * 未登录用户：存取浏览器 LocalStorage
 * 已登录用户：存取后端 SQLite 数据库
 */
import { api } from "../api";
import type { SavedDraftDTO, PracticeSubmitDTO } from "../../shared/api-types";

const DRAFT_PREFIX = "sudoku_draft_";
const GUEST_RECORDS_KEY = "sudoku_guest_records";

// ─── 本地 LocalStorage 草稿操作 ───

export function getLocalDraft(typeCode: string, difficulty: string): SavedDraftDTO | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${typeCode}_${difficulty}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalDraft(draft: SavedDraftDTO): void {
  try {
    localStorage.setItem(
      `${DRAFT_PREFIX}${draft.typeCode}_${draft.difficulty}`,
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }),
    );
  } catch (e) {
    console.error("Failed to save local draft", e);
  }
}

export function deleteLocalDraft(typeCode: string, difficulty: string): void {
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${typeCode}_${difficulty}`);
  } catch (e) {
    console.error("Failed to remove local draft", e);
  }
}

export function getAllLocalDrafts(): SavedDraftDTO[] {
  const drafts: SavedDraftDTO[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            drafts.push(JSON.parse(raw));
          } catch {
            // ignore
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return drafts;
}

// ─── 本地游客练习记录 ───

export function getLocalRecords(): PracticeSubmitDTO[] {
  try {
    const raw = localStorage.getItem(GUEST_RECORDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalRecord(record: PracticeSubmitDTO): void {
  try {
    const list = getLocalRecords();
    list.unshift(record);
    localStorage.setItem(GUEST_RECORDS_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // ignore
  }
}

// ─── 综合进度读写（自动区分未登录 / 已登录）───

export async function fetchProgressDraft(
  typeCode: string,
  difficulty: string,
  isLoggedIn: boolean,
): Promise<SavedDraftDTO | null> {
  if (isLoggedIn) {
    try {
      const res = await api.getDraft(typeCode, difficulty);
      if (res.draft) return res.draft;
    } catch {
      // 网络失败时尝试读取本地兜底
    }
  }
  return getLocalDraft(typeCode, difficulty);
}

export async function persistProgressDraft(
  draft: SavedDraftDTO,
  isLoggedIn: boolean,
): Promise<void> {
  // 本地始终存一份作为即时缓存与离线可用
  saveLocalDraft(draft);

  if (isLoggedIn) {
    try {
      await api.saveDraft(draft);
    } catch (e) {
      console.warn("Failed to sync draft to server", e);
    }
  }
}

export async function removeProgressDraft(
  typeCode: string,
  difficulty: string,
  isLoggedIn: boolean,
): Promise<void> {
  deleteLocalDraft(typeCode, difficulty);
  if (isLoggedIn) {
    try {
      await api.deleteDraft(typeCode, difficulty);
    } catch {
      // ignore
    }
  }
}

/**
 * 登录成功后将本地未登录期间的草稿和历史记录合并上传
 */
export async function syncGuestDataToCloud(): Promise<void> {
  const localDrafts = getAllLocalDrafts();
  const localRecords = getLocalRecords();

  if (localDrafts.length > 0 || localRecords.length > 0) {
    try {
      await api.syncGuestData(localDrafts, localRecords);
    } catch (e) {
      console.error("Failed to sync guest data to cloud", e);
    }
  }
}
