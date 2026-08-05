# 数独训练营

面向 10–12 岁选手的「奔跑吧·少年」数独之星备赛 Web 应用。  
支持系统课程、多题型练习、即时对错反馈、薄弱分析与 iPad / 手机响应式界面。

线上地址（Cloudflare 隧道）：

- https://sudoku.773387.xyz
- https://sd.0703.pro（若 DNS/证书正常，指向同一服务）

---

## 功能概览

| 模块 | 说明 |
|------|------|
| **首页** | 今日任务、薄弱一键练、训练路径、最近练习 |
| **学习** | 分阶段课程、锁定/进度、课程内交互演示 |
| **练习** | 17 种题型、三档难度、盘面 + 数字键盘 |
| **解题** | 填错高亮、撤销/重做、提示、键盘操作、完成弹窗 |
| **我的** | 经验/连续天数、AI 教练、技能统计、**重置课程** |
| **适配** | 手机单列；iPad 加宽内容区，解题页盘面与键盘可并排 |

### 题型覆盖（对齐赛题说明，偏 10–12 岁）

入门：四宫 / 六宫 / 九宫标准  
变体：对角线、奇偶、杀手、大小数、不等号、温度计、不规则、连续、五六、堡垒、比例、无马等  

详情见 `src/shared/puzzle-types.ts` 与 `src/shared/lessons.ts`。

### 账号说明

- **无登录**。服务端固定用户 `id = 1`（种子用户「小选手」）。
- 课程进度、练习记录、经验值存在**服务器 SQLite**，多端访问同一环境时**共享同一份进度**。
- 本地 `localhost` 与线上是**两套数据库**，互不同步。

---

## 技术栈

| 层 | 技术 |
|----|------|
| 运行时 | [Bun](https://bun.sh) |
| 前端 | React 19、Vite 6、Tailwind CSS 4、React Router 7、Zustand |
| 后端 | Elysia（`src/server`） |
| 数据库 | SQLite + Drizzle ORM（`data/sudoku.db`） |
| AI 教练 | DeepSeek API（可选；无 key 时用规则分析） |
| 引擎 | 自研数独生成/求解（`src/engine`） |

生产模式下，Elysia 同时提供 `/api/*` 与 `dist/` 静态前端（SPA 回退）。

---

## 目录结构

```
sudoku-training-camp/
├── src/
│   ├── client/          # React 前端
│   │   ├── pages/       # 首页 / 学习 / 练习 / 我的
│   │   ├── components/  # 盘面、键盘、题型图标、UI 原语
│   │   ├── stores/      # 游戏状态（撤销、错误、提示等）
│   │   └── styles/      # 设计 token + 响应式布局
│   ├── server/          # API、DB、题目服务、AI 分析
│   ├── engine/          # 数独引擎
│   └── shared/          # 题型目录、课程、API 类型
├── public/              # favicon、插画
├── data/                # SQLite（本地/部署时生成，勿提交密钥）
├── DESIGN.md            # UI 设计标准
├── .env.example         # 环境变量模板
└── package.json
```

UI 约定见 [DESIGN.md](./DESIGN.md)。

---

## 本地开发

### 要求

- Bun（推荐 1.1+）
- 可选：DeepSeek API Key（AI 教练）

### 初始化

```bash
# 安装依赖
bun install

# 环境变量
cp .env.example .env
# 编辑 .env，填入 DEEPSEEK_API_KEY 等

# 建表 + 种子数据（题型、课程、默认用户）
bun src/server/db/migrate.ts
bun src/server/db/seed.ts
```

### 启动

```bash
# 推荐：API + 前端一起
bunx concurrently -n server,client -c blue,green \
  "bun run dev:server" "bun run dev:client"

# 或
bun run dev
```

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:5173 |
| API | http://localhost:3000 |

Vite 已将 `/api` 代理到 `3000`。

### 常用脚本

| 命令 | 说明 |
|------|------|
| `bun run dev:server` | 仅 API（watch） |
| `bun run dev:client` | 仅 Vite |
| `bun run build` | 前端构建到 `dist/` |
| `bun run start` | 生产模式启动（需先 build） |
| `bun src/server/db/migrate.ts` | 建表 |
| `bun src/server/db/seed.ts` | 同步题型/课程（可重复执行） |
| `bun test` | 引擎测试 |

### 环境变量

写在项目根目录 **`.env`**（已被 gitignore）。模板：`.env.example`。

| 变量 | 说明 | 默认 |
|------|------|------|
| `DEEPSEEK_API_KEY` | AI 教练；无 key 则规则分析 | — |
| `PORT` | 服务端口 | `3000`（本地）/ 线上常用 `3001` |
| `DB_PATH` | SQLite 路径 | `./data/sudoku.db` |
| `NODE_ENV` | `production` 时托管 `dist` 静态资源 | — |

Bun 会自动加载根目录 `.env`。

---

## 生产部署（cloudblast）

当前线上部署方式：

| 项 | 值 |
|----|-----|
| SSH Host | `cloudblast`（`~/.ssh/config`） |
| 应用目录 | `/home/damei/sudoku-training-camp` |
| 进程 | systemd：`sudoku-training.service` |
| 端口 | `3001` |
| 入口 | Cloudflare Tunnel → `localhost:3001` |
| 域名 | `sudoku.773387.xyz`、`sd.0703.pro` |

### 一键更新流程（本机执行）

```bash
# 1. 本地构建校验（可选）
bun run build

# 2. 打包上传（不带 data、.env、node_modules）
tar czf /tmp/sudoku-deploy.tgz \
  --exclude=node_modules --exclude=data --exclude=.env \
  --exclude=.git --exclude=dist --exclude=.agents --exclude=.claude \
  --exclude=.DS_Store --exclude='._*' --exclude=skills-lock.json \
  .
scp /tmp/sudoku-deploy.tgz cloudblast:~/sudoku-deploy.tgz

# 3. 远端安装、构建、重启（保留 .env 与数据库）
ssh cloudblast 'set -e
  export PATH="$HOME/.bun/bin:$PATH"
  cd ~
  cp -a sudoku-training-camp/.env /tmp/sudoku.env.bak
  cp -a sudoku-training-camp/data /tmp/sudoku-data.bak
  tar xzf sudoku-deploy.tgz -C sudoku-training-camp
  cp -a /tmp/sudoku.env.bak sudoku-training-camp/.env
  rm -rf sudoku-training-camp/data
  cp -a /tmp/sudoku-data.bak sudoku-training-camp/data
  cd sudoku-training-camp
  bun install
  bun run build
  bun src/server/db/migrate.ts
  bun src/server/db/seed.ts
  sudo systemctl restart sudoku-training
  sleep 2
  systemctl is-active sudoku-training
  curl -s http://localhost:3001/api/health
'
```

### systemd 要点

- 单元文件：`/etc/systemd/system/sudoku-training.service`
- `WorkingDirectory=/home/damei/sudoku-training-camp`
- `ExecStart=/home/damei/.bun/bin/bun src/server/index.ts`
- 环境：`NODE_ENV=production`、`PORT=3001`、`DB_PATH=.../data/sudoku.db`

常用运维：

```bash
ssh cloudblast 'systemctl status sudoku-training'
ssh cloudblast 'sudo systemctl restart sudoku-training'
ssh cloudblast 'journalctl -u sudoku-training -n 50 --no-pager'
```

### 部署注意

1. **不要覆盖** 线上 `.env` 与 `data/sudoku.db`（练习与进度在库里）。
2. `seed` 会同步题型/课程定义，用户进度用 upsert，一般不丢。
3. 不要对生产随意 `POST /api/lessons/reset`（会清空课程进度）。
4. 前端构建在**服务器上**执行，避免本机与 Linux 环境差异问题。

---

## 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/dashboard` | 首页聚合（含今日任务） |
| GET | `/api/lessons` | 课程列表 + 进度状态 |
| GET | `/api/lessons/:id` | 课程详情 |
| PATCH | `/api/lessons/:id` | 更新单课状态 |
| POST | `/api/lessons/reset` | **重置全部课程进度** |
| POST | `/api/puzzles/generate` | 按题型/难度生成题 |
| POST | `/api/practice` | 提交练习结果 |
| GET | `/api/stats` | 技能统计 |
| GET | `/api/analysis` | AI / 规则薄弱分析 |

---

## UI / 响应式

- 设计标准：`DESIGN.md`（色板 teal、token、组件约定）
- 断点：
  - 手机 `<768`：内容 max ≈ 32rem，解题上下叠
  - iPad 竖 `≥768`：max ≈ 44rem，题型多列、解题可左右分栏
  - iPad 横 `≥1024`：max ≈ 56rem
- 盘面格子：按容器宽度 `ResizeObserver` 计算
- 题型图标：`PuzzleTypeIcon`（SVG）；插画：`public/illustrations/`

---

## 测试

```bash
bun test
```

覆盖引擎结构、求解、生成与校验（`tests/engine.test.ts`）。

---

## 许可证

私人项目（给女儿的训练工具），未开源授权说明。
