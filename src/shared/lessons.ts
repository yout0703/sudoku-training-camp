/**
 * 课程内容目录
 * 每节课包含：规则讲解、技巧演示、引导练习
 */

export interface LessonSection {
  type: "intro" | "rule" | "technique" | "tip" | "practice";
  title: string;
  content: string;
}

export interface LessonDef {
  typeCode: string | null;
  phase: number;
  title: string;
  sortOrder: number;
  sections: LessonSection[];
  prerequisiteTitle?: string;
}

export const LESSONS: LessonDef[] = [
  // ─── Phase 1: 入门 ───
  {
    typeCode: "standard_4",
    phase: 1,
    title: "第一课：认识数独",
    sortOrder: 1,
    sections: [
      {
        type: "intro",
        title: "什么是数独？",
        content: "数独是一种好玩的数字填空游戏！规则很简单：在格子里填数字，让每一行、每一列、每一个粗线框里的数字都不重复。\n\n我们先从最小的 4×4 数独开始，只需要填 1、2、3、4 四个数字。",
      },
      {
        type: "rule",
        title: "三条黄金规则",
        content: "1️⃣ 每一行的数字不能重复（1-4 各出现一次）\n2️⃣ 每一列的数字不能重复（1-4 各出现一次）\n3️⃣ 每个粗线框里的数字不能重复（1-4 各出现一次）\n\n记住这三条，你就能解数独了！",
      },
      {
        type: "technique",
        title: "秘诀一：找唯一数",
        content: "看一个格子，如果它所在的行、列、框里已经出现了 1、2、3，那这个格子只能填 4！\n\n这就是「唯一数法」——数独最基本也最重要的技巧。",
      },
      {
        type: "technique",
        title: "秘诀二：宫摒除法",
        content: "先看一个粗线框（宫）。如果这一宫里已经有了数字 3，那么这一宫的其他格子就不能再填 3 了。\n\n再看看这一宫里还缺哪些数字，缺的数字只能填在还没有被排除的空格里。",
      },
      {
        type: "tip",
        title: "小窍门",
        content: "💡 从数字最多的地方开始看！如果一行已经填了 3 个数字，只剩 1 个空格，那马上就能填出来。\n\n💡 不要急着猜！每一步都要有理由，确定能填才填。",
      },
      {
        type: "practice",
        title: "动手试试吧！",
        content: "现在来做一道简单的四宫数独练习题。不着急，慢慢来，享受解题的乐趣！",
      },
    ],
  },
  {
    typeCode: "standard_4",
    phase: 1,
    title: "第二课：四宫提速",
    sortOrder: 2,
    prerequisiteTitle: "第一课：认识数独",
    sections: [
      {
        type: "technique",
        title: "快速扫描法",
        content: "想做得快？学会「扫描」！\n\n选一个数字（比如 1），然后一行一行地扫：这个数字在这一行出现了吗？在这一列出现了吗？在这一宫出现了吗？\n\n通过排除，很快就能找到这个数字应该填在哪里。",
      },
      {
        type: "technique",
        title: "行列交叉法",
        content: "有时候一个格子不能直接确定唯一答案，但可以通过行和列的交叉来排除。\n\n比如某格在的行已经排除了 1、2，在的列排除了 3，那这格只能填 4！",
      },
      {
        type: "practice",
        title: "限时挑战",
        content: "现在来挑战几道四宫题，试试能不能在 2 分钟内完成！",
      },
    ],
  },
  {
    typeCode: "standard_6",
    phase: 1,
    title: "第三课：六宫数独",
    sortOrder: 3,
    prerequisiteTitle: "第二课：四宫提速",
    sections: [
      {
        type: "intro",
        title: "更大的挑战来了",
        content: "六宫数独有 6×6 = 36 个格子，要填 1-6。\n\n每个宫是 2 行 × 3 列的长方形。规则和四宫完全一样，只是格子更多了，需要更仔细地观察。",
      },
      {
        type: "technique",
        title: "数数法升级",
        content: "在六宫里，每一宫缺的数字可能更多。先看哪个宫填得最多，缺的数字最少，从那里开始。\n\n然后对每个缺的数字，用行和列排除，看它只能填在宫里的哪个位置。",
      },
      {
        type: "practice",
        title: "六宫练习",
        content: "来做几道六宫题，巩固学到的技巧！",
      },
    ],
  },
  {
    typeCode: "standard_9",
    phase: 1,
    title: "第四课：九宫标准数独",
    sortOrder: 4,
    prerequisiteTitle: "第三课：六宫数独",
    sections: [
      {
        type: "intro",
        title: "终极标准数独",
        content: "九宫数独是最经典的数独！9×9 = 81 个格子，填 1-9。\n\n每个宫是 3×3 的正方形。虽然格子多，但你已经掌握的方法完全适用！",
      },
      {
        type: "technique",
        title: "系统扫描",
        content: "面对 81 个格子，要有系统地扫描：\n\n1. 先从提示数最多的行、列、宫开始\n2. 对每个数字 1-9 做一遍扫描\n3. 用「宫摒除 + 行列摒除」找出确定的位置\n\n耐心 + 系统 = 速度！",
      },
      {
        type: "technique",
        title: "候选数笔记",
        content: "在九宫里，有时候一个格子暂时不能确定唯一答案。这时候可以在格子角落记下可能的候选数字。\n\n随着其他格子被填入，候选数会逐渐减少，最终确定。",
      },
      {
        type: "tip",
        title: "比赛策略",
        content: "⏱️ 比赛时先做简单题，把难题留到最后！\n⏱️ 卡住了不要死磕，换一道题或换个区域看！\n⏱️ 做完后一定要检查一遍！",
      },
      {
        type: "practice",
        title: "九宫实战",
        content: "来做九宫题吧！先从简单的开始，逐渐提高难度。",
      },
    ],
  },

  // ─── Phase 2: 基础变体 ───
  {
    typeCode: "diagonal_6",
    phase: 2,
    title: "第五课：对角线数独",
    sortOrder: 5,
    prerequisiteTitle: "第四课：九宫标准数独",
    sections: [
      {
        type: "rule",
        title: "多了一条规则",
        content: "对角线数独 = 标准规则 + 两条对角线也不能重复！\n\n看盘面上两条交叉的虚线（X 形），从左上到右下、从右上到左下。这两条线上的格子，也必须 1-6 各出现一次。",
      },
      {
        type: "technique",
        title: "利用对角线",
        content: "对角线是额外的信息来源！\n\n当你在对角线上的格子填数时，除了看行、列、宫，还要看对角线。\n\n反过来，对角线上已有的数字也能帮你排除其他格子的候选数。",
      },
      {
        type: "practice",
        title: "对角线练习",
        content: "试试六宫对角线数独，感受多一条规则带来的变化！",
      },
    ],
  },
  {
    typeCode: "odd_even_6",
    phase: 2,
    title: "第六课：奇偶数独",
    sortOrder: 6,
    prerequisiteTitle: "第五课：对角线数独",
    sections: [
      {
        type: "rule",
        title: "方块和圆圈",
        content: "奇偶数独中，有些格子有特殊标记：\n\n🔷 正方形格子 → 只能填偶数（2、4、6）\n⭕ 圆形格子 → 只能填奇数（1、3、5）\n\n没有标记的格子没有限制。标准规则依然适用。",
      },
      {
        type: "technique",
        title: "奇偶排除法",
        content: "看到正方形格，马上知道它不可能是 1、3、5。\n看到圆形格，马上知道它不可能是 2、4、6。\n\n这个信息很宝贵！它能帮你快速排除候选数。",
      },
      {
        type: "practice",
        title: "奇偶练习",
        content: "来做一道六宫奇偶数独，体验方圆标记带来的推理乐趣！",
      },
    ],
  },
  {
    typeCode: "killer_4",
    phase: 2,
    title: "第七课：杀手数独",
    sortOrder: 7,
    prerequisiteTitle: "第六课：奇偶数独",
    sections: [
      {
        type: "rule",
        title: "虚线笼子和",
        content: "杀手数独没有给定数字！取而代之的是虚线框（笼子）：\n\n📦 每个虚线框左上角有一个小数字 = 框内所有数字之和\n📦 同一个虚线框内的数字不能重复\n\n标准规则（行、列、宫不重复）依然适用。",
      },
      {
        type: "technique",
        title: "数字组合",
        content: "杀手数独的核心技巧是「数字组合」：\n\n比如提示数是 3 的两格笼子，只能是 1+2。\n提示数是 7 的三格笼子，可能是 1+2+4。\n\n记住常见的组合，推理就会更快！",
      },
      {
        type: "tip",
        title: "45 法则",
        content: "💡 每一行/列/宫的数字之和是固定的！\n\n4×4：每行 = 1+2+3+4 = 10\n6×6：每行 = 1+2+3+4+5+6 = 21\n9×9：每行 = 1+2+...+9 = 45\n\n利用这个，可以反推出某个区域的数字和！",
      },
      {
        type: "practice",
        title: "杀手练习",
        content: "来做一道四宫杀手数独，没有给定数字也能推理出来！",
      },
    ],
  },

  // ─── Phase 3: 进阶变体 ───
  {
    typeCode: "irregular_6",
    phase: 3,
    title: "第八课：不规则数独",
    sortOrder: 8,
    prerequisiteTitle: "第七课：杀手数独",
    sections: [
      {
        type: "rule",
        title: "形状奇怪的宫",
        content: "不规则数独的宫不是方方正正的长方形，而是各种不规则的形状（由粗线划分）！\n\n规则不变：每行、每列、每个粗线围成的不规则宫内数字不重复。",
      },
      {
        type: "technique",
        title: "仔细看宫的边界",
        content: "做不规则数独，最重要的是看清每个宫的范围！\n\n先用手指或目光沿粗线描一遍每个宫的边界，确认每个宫有 6 个格子。\n\n然后用和标准数独一样的方法，只是「宫」的形状变了。",
      },
      {
        type: "practice",
        title: "不规则练习",
        content: "来挑战六宫不规则数独！",
      },
    ],
  },
  {
    typeCode: "consecutive_6",
    phase: 3,
    title: "第九课：连续数独",
    sortOrder: 9,
    prerequisiteTitle: "第八课：不规则数独",
    sections: [
      {
        type: "rule",
        title: "粗线 = 连续",
        content: "连续数独中，相邻两格之间如果有粗线，表示这两格的数字连续（差值为 1），比如 2 和 3、5 和 6。\n\n⚠️ 重要：所有连续关系都已标出！没有粗线 = 差值不是 1。",
      },
      {
        type: "technique",
        title: "正反推理",
        content: "正向推理：看到粗线连接的两格，如果已知一个是 3，另一个一定是 2 或 4。\n\n反向推理（很强大）：看到没有粗线的相邻两格，它们的差值一定不是 1！比如已知一个是 3，另一个一定不是 2 也不是 4。",
      },
      {
        type: "practice",
        title: "连续练习",
        content: "来做六宫连续数独，利用正反两种推理！",
      },
    ],
  },
  {
    typeCode: "sum56_6",
    phase: 3,
    title: "第十课：五六数独",
    sortOrder: 10,
    prerequisiteTitle: "第九课：连续数独",
    sections: [
      {
        type: "rule",
        title: "圆圈和数",
        content: "五六数独中，相邻两格之间可能有小圆圈，里面写着 5 或 6：\n\n⭕5 = 两格数字之和 = 5（比如 1+4、2+3）\n⭕6 = 两格数字之和 = 6（比如 1+5、2+4）\n\n⚠️ 没有圆圈的相邻两格，数字之和不能是 5 或 6！",
      },
      {
        type: "technique",
        title: "组合分析",
        content: "和为 5 的组合（1-6 内）：1+4、2+3\n和为 6 的组合（1-6 内）：1+5、2+4\n\n这些组合很少！知道了和数，候选数就大幅减少。",
      },
      {
        type: "practice",
        title: "五六数独练习",
        content: "来做六宫五六数独！",
      },
    ],
  },
  {
    typeCode: "fortress_6",
    phase: 3,
    title: "第十一课：堡垒数独",
    sortOrder: 11,
    prerequisiteTitle: "第十课：五六数独",
    sections: [
      {
        type: "rule",
        title: "灰色堡垒",
        content: "堡垒数独中有些格子是灰色的（堡垒）：\n\n🏰 灰色格子的数字必须大于它上下左右相邻的白色格子的数字。\n\n标准规则依然适用。",
      },
      {
        type: "technique",
        title: "大小推理",
        content: "如果灰格旁边是白格，那灰格 > 白格。\n\n比如灰格旁边白格填了 4，那灰格一定是 5 或 6。\n反过来，如果灰格填了 2，旁边的白格一定是 1。",
      },
      {
        type: "practice",
        title: "堡垒练习",
        content: "来挑战六宫堡垒数独！",
      },
    ],
  },

  // ─── Phase 4: 高阶 ───
  {
    typeCode: "antiknight_6",
    phase: 4,
    title: "第十二课：无马数独",
    sortOrder: 12,
    prerequisiteTitle: "第十一课：堡垒数独",
    sections: [
      {
        type: "rule",
        title: "马步约束",
        content: "国际象棋中，马走「日」字（二拐一）。\n\n无马数独中，任何两个呈马步关系的格子不能填相同的数字！\n\n比如某格向右 2 格再向下 1 格的位置，这两个格子不能相同。",
      },
      {
        type: "technique",
        title: "识别马步位置",
        content: "对于每个格子，它的马步位置最多有 8 个（上下左右各两个方向）。\n\n填入一个数字后，要排除所有马步位置的相同候选数。这比标准数独的排除范围更大！",
      },
      {
        type: "practice",
        title: "无马练习",
        content: "来做六宫无马数独，这是总决赛的高阶题型！",
      },
    ],
  },
];
