# 数独训练营 · UI 设计标准

> 给女儿的「奔跑吧·少年」数独之星备赛工具。  
> 设计原则：清晰、可触、鼓励、不花哨。

## Design Read

- **类型**：移动优先的教育产品 App（非 landing page）
- **受众**：10–12 岁选手 + 家长陪练
- **气质**：温暖、鼓励、冷静专注（不是炫技、不是 AI 紫渐变）
- **参考族**：Duolingo 的节奏感 + Notion 的清晰结构 + 儿童教育产品的亲和力

## 三旋钮

| 旋钮 | 值 | 含义 |
|------|-----|------|
| VARIANCE | 4 | 布局可预期，适合学习场景 |
| MOTION | 4 | 轻反馈（按下、完成），无花哨滚动动画 |
| DENSITY | 5 | App 密度，信息够用但不拥挤 |

## 色彩

### 语义 token

| Token | 用途 | 浅色值 |
|-------|------|--------|
| `--surface` | 页面底 | `#f4f7f5` 冷暖中性的浅灰绿 |
| `--surface-elevated` | 卡片 | `#ffffff` |
| `--ink` | 主文字 | `#1a2e28` |
| `--ink-muted` | 次要文字 | `#5c6f68` |
| `--ink-faint` | 辅助/占位 | `#8a9b94` |
| `--accent` | 主行动 | `#0d9488` (teal-600) |
| `--accent-strong` | 强调/按下 | `#0f766e` |
| `--accent-soft` | 浅底 | `#ccfbf1` |
| `--success` | 正确/完成 | `#16a34a` |
| `--warning` | 注意 | `#d97706` |
| `--danger` | 错误 | `#dc2626` |
| `--streak` | 连续天数暖色 | `#ea580c` |

### 规则

1. **单一主色**：teal。不要再混 indigo / violet 作为品牌色。
2. **中性灰带绿调**：所有 slate 类中性色改用 `ink-*` 体系，避免冷灰与暖灰混用。
3. **题型色**：仅用在题型标签小色块上，不污染全局。
4. **禁止**：纯黑 `#000`、AI 紫蓝大渐变、每张卡片不同主色按钮。

## 字体

- **显示/标题**：`"Plus Jakarta Sans"`, system-ui
- **正文**：同上
- **数字（计时、分数）**：`ui-monospace, "SF Mono", Menlo, monospace` + `tabular-nums`
- 字重：400 / 500 / 600 / 700，避免只有 400+700

### 字号阶梯

| 角色 | 类 | 说明 |
|------|-----|------|
| Display | `text-2xl` / `text-3xl` font-bold tracking-tight | 页面大标题 |
| Title | `text-lg` font-semibold | 区块标题 |
| Body | `text-sm` leading-relaxed | 正文 |
| Caption | `text-xs` text-ink-muted | 辅助说明 |
| Micro | `text-[11px]` | 标签 |

## 圆角

| 元素 | 半径 |
|------|------|
| 页面大卡片 / 欢迎区 | `rounded-3xl` (24px) |
| 列表项 / 中卡片 | `rounded-2xl` (16px) |
| 按钮 / 输入 | `rounded-xl` (12px) |
| 小标签 / 徽章 | `rounded-lg` (8px) |
| 圆形图标按钮 | `rounded-full` |

规则：**外大内小**。嵌套容器内层半径 = 外层 - padding。

## 阴影

- 卡片默认：`shadow-card` = `0 1px 2px rgb(26 46 40 / 0.04), 0 4px 16px rgb(26 46 40 / 0.06)`
- 浮层/弹窗：`shadow-float` = 更深一层
- **禁止**纯黑大阴影、`shadow-xl` 默认黑影

## 间距与断点（手机 + iPad）

| 断点 | 宽度 | 页面 max-width | 说明 |
|------|------|----------------|------|
| 手机 | &lt; 768 | 32rem (512px) | 单列 |
| iPad 竖 | ≥ 768 | 44rem (704px) | 题型 3 列、解题并排 |
| iPad 横 | ≥ 1024 | 56rem (896px) | 更宽内容区 |

- 页面壳：`.page` / `.shell`（导航、吸底按钮同宽）
- 解题壳：`.shell-solver` + `.solver-layout`（手机上下、平板左右）
- 盘面：`ResizeObserver` 按容器宽算格子边长
- safe-area：`env(safe-area-inset-*)` 处理刘海 / Home 条
- 触控：按钮 min-height 手机 44px、平板 48px+

## 组件约定

### 按钮

| 变体 | 样式 |
|------|------|
| Primary | `bg-accent text-white`，按下 `scale-[0.98]` |
| Secondary | `bg-white text-ink` + 细边框 `border-ink/8` |
| Ghost | 透明底，文字 `text-ink-muted` |
| Danger soft | `bg-danger/10 text-danger` |

最小触控高度：**44px**（移动端）。

### 卡片

- 默认：`bg-surface-elevated rounded-2xl p-4 shadow-card`
- 可点击：`active:scale-[0.98] transition-transform`，不要加厚边框 hover
- 状态色卡片（课程章节）用 **左侧色条** 或 **浅底**，不要彩虹 border-2

### 底部导航

- 固定底栏，毛玻璃 `bg-white/85 backdrop-blur-xl`
- 选中：accent 色 + 轻微上浮圆点指示
- 图标优先用 **线性 SVG**，emoji 仅作装饰（欢迎头像可保留）

### 加载 / 空 / 错

- Loading：骨架屏（与最终布局同形），禁止整页大 emoji bounce 作为唯一反馈
- Empty：插画位 + 一句话 + 一个主 CTA
- Error：直接说明 + 重试按钮

### 解题区

- 盘面为视觉中心，数字清晰
- 给定数字：深色 ink；用户填入：accent
- 错误：danger 轻底 + 数字 danger（瞬时反馈）
- 键盘：大触控、剩余计数、候选模式高亮

## 动效

- 默认曲线：`cubic-bezier(0.32, 0.72, 0, 1)`，时长 200–300ms
- 仅 `transform` / `opacity`
- 完成弹窗：scale + fade 入场
- 尊重 `prefers-reduced-motion`

## 图标

- 导航/操作：`src/client/components/ui/Icons.tsx` 线性 SVG，stroke 1.75
- 题型：`PuzzleTypeIcon` 按 `typeCode` / `variantType` 映射，可上色
- Favicon：`public/favicon.svg`（teal 宫格）
- 插画：`public/illustrations/`（空状态 empty-practice、完成庆祝 complete-celebrate）
- Emoji 仅用于：用户头像（`avatarEmoji`）；题型数据里的 emoji 字段可作兼容，UI 以 SVG 为准

## 页面结构模板

```
<main class="page">           // max-w-lg mx-auto px-4 pt-6 pb-24
  <header class="page-header"> // 标题 + 可选副标题
  <section>...</section>
</main>
```

## 禁止清单（AI Tell / 廉价感）

- [ ] indigo/violet 品牌渐变欢迎卡
- [ ] 每节课不同彩虹色大 border
- [ ] 满屏 emoji 当图标系统
- [ ] `animate-bounce` 整页 loading
- [ ] 无按下态的按钮
- [ ] 触控区 < 40px
- [ ] 中英文混排无理由的 Title Case 标签
- [ ] 纯黑阴影、纯黑文字

## 文件约定

| 路径 | 职责 |
|------|------|
| `src/client/styles/index.css` | Token + 基础工具类 |
| `src/client/components/ui/*` | 通用 UI 原语 |
| `src/client/pages/*` | 页面，只组合原语 |
| `DESIGN.md` | 本标准（改视觉先改这里） |
