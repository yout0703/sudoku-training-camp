/**
 * 用户系统与进度持久化测试
 */
import { describe, it, expect, beforeAll } from "bun:test";
import { app } from "../src/server/index";

describe("用户认证与进度持久化 API 测试", () => {
  let userToken: string;
  let testUsername = `testuser_${Date.now()}`;

  it("支持快捷注册/登录并返回 token", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/quick-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: testUsername,
          name: "测试达人",
        }),
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.name).toBe("测试达人");
    expect(data.token).toBeDefined();
    userToken = data.token;
  });

  it("携带 token 可获取当前用户信息", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/me", {
        headers: { Authorization: `Bearer ${userToken}` },
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.username).toBe(testUsername);
  });

  it("已登录用户可保存草稿并再次读取", async () => {
    // 1. 保存草稿
    const saveRes = await app.handle(
      new Request("http://localhost/api/progress/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          typeCode: "standard_4",
          difficulty: "easy",
          givens: [1, 0, 0, 4, 0, 2, 3, 0, 0, 3, 2, 0, 4, 0, 0, 1],
          userGrid: [1, 2, 3, 4, 0, 2, 3, 0, 0, 3, 2, 0, 4, 0, 0, 1],
          candidates: [[], [], [], [], [1], [], [], [], [], [], [], [], [], [], [], []],
          elapsedMs: 15000,
          mistakes: 1,
        }),
      }),
    );
    expect(saveRes.status).toBe(200);
    const saveData = await saveRes.json();
    expect(saveData.saved).toBe(true);

    // 2. 获取草稿
    const getRes = await app.handle(
      new Request("http://localhost/api/progress/draft?typeCode=standard_4&difficulty=easy", {
        headers: { Authorization: `Bearer ${userToken}` },
      }),
    );
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.draft).toBeDefined();
    expect(getData.draft.elapsedMs).toBe(15000);
    expect(getData.draft.userGrid[1]).toBe(2);

    // 3. 获取所有草稿
    const listRes = await app.handle(
      new Request("http://localhost/api/progress/active-drafts", {
        headers: { Authorization: `Bearer ${userToken}` },
      }),
    );
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.length).toBeGreaterThanOrEqual(1);
    expect(listData.some((d: any) => d.typeCode === "standard_4")).toBe(true);
  });

  it("提交练习完成后自动清除该题型草稿并记录练习", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/practice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          typeCode: "standard_4",
          difficulty: "easy",
          durationMs: 25000,
          mistakes: 0,
          hintsUsed: 0,
          completed: true,
        }),
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.xpEarned).toBeGreaterThan(0);

    // 验证草稿已被清除
    const getRes = await app.handle(
      new Request("http://localhost/api/progress/draft?typeCode=standard_4&difficulty=easy", {
        headers: { Authorization: `Bearer ${userToken}` },
      }),
    );
    const getData = await getRes.json();
    expect(getData.draft).toBeNull();
  });
});
