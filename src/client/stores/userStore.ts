/**
 * 用户状态管理（Zustand）
 */
import { create } from "zustand";
import { api, getAuthToken, setAuthToken } from "../api";
import { syncGuestDataToCloud } from "../lib/storage";
import type { UserDTO } from "../../shared/api-types";

interface UserState {
  user: UserDTO | null;
  loading: boolean;
  initialized: boolean;
  initAuth: () => Promise<void>;
  quickLogin: (username: string, name?: string) => Promise<boolean>;
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    username: string;
    password?: string;
    name?: string;
    avatarEmoji?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserXp: (xpEarned: number) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  initAuth: async () => {
    const token = getAuthToken();
    if (!token) {
      set({ user: null, loading: false, initialized: true });
      return;
    }
    try {
      const res = await api.getMe();
      set({ user: res.user, loading: false, initialized: true });
    } catch {
      setAuthToken(null);
      set({ user: null, loading: false, initialized: true });
    }
  },

  quickLogin: async (username: string, name?: string) => {
    try {
      const res = await api.quickLogin(username, name);
      if (res.success && res.user) {
        setAuthToken(res.token);
        set({ user: res.user });
        await syncGuestDataToCloud();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  login: async (username: string, password?: string) => {
    try {
      const res = await api.login(username, password);
      if (res.error) return { success: false, error: res.error };
      if (res.user && res.token) {
        setAuthToken(res.token);
        set({ user: res.user });
        await syncGuestDataToCloud();
        return { success: true };
      }
      return { success: false, error: "登录失败" };
    } catch (e: any) {
      return { success: false, error: e.message || "网络请求失败" };
    }
  },

  register: async (data) => {
    try {
      const res = await api.register(data);
      if (res.error) return { success: false, error: res.error };
      if (res.user && res.token) {
        setAuthToken(res.token);
        set({ user: res.user });
        await syncGuestDataToCloud();
        return { success: true };
      }
      return { success: false, error: "注册失败" };
    } catch (e: any) {
      return { success: false, error: e.message || "网络请求失败" };
    }
  },

  logout: () => {
    setAuthToken(null);
    set({ user: null });
  },

  updateUserXp: (xpEarned: number) => {
    const u = get().user;
    if (u) {
      set({
        user: {
          ...u,
          totalXp: u.totalXp + xpEarned,
        },
      });
    }
  },
}));
