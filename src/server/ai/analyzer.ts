/**
 * DeepSeek AI 薄弱点分析器
 * 基于练习数据生成个性化训练建议
 */

interface PracticeStat {
  typeCode: string;
  typeName: string;
  icon: string;
  totalAttempts: number;
  completedCount: number;
  completionRate: number;
  avgDurationMs: number;
  avgMistakes: number;
  bestTimeMs: number | null;
  weakScore: number;
}

export interface AnalysisResult {
  summary: string;
  weakPoints: string[];
  recommendations: string[];
  encouragement: string;
  generatedAt: string;
}

const SYSTEM_PROMPT = `你是一位专业的数独教练，专门辅导小学生（10-12岁）备战数独速度比赛。你的风格温暖、鼓励、具体，就像一个亲切的老师。

请基于学生的练习数据，给出分析。要求：
1. 语言简单易懂，适合五年级学生理解
2. 多用鼓励性语言，不要打击信心
3. 具体指出哪个题型/技巧需要加强，给出可操作的建议
4. 推荐下一步该练什么
5. 用 emoji 增加趣味性

请返回 JSON 格式（不要返回其他内容）：
{
  "summary": "一句话总结学生的整体表现",
  "weakPoints": ["薄弱点1", "薄弱点2"],
  "recommendations": ["建议1", "建议2", "建议3"],
  "encouragement": "一段鼓励的话"
}`;

function formatStatsForPrompt(stats: PracticeStat[]): string {
  const practiced = stats.filter((s) => s.totalAttempts > 0);
  if (practiced.length === 0) {
    return "学生还没有开始练习，这是第一次使用。请鼓励他从四宫标准数独开始。";
  }

  const lines = practiced.map((s) => {
    const time = s.avgDurationMs > 0 ? `${Math.round(s.avgDurationMs / 1000)}秒` : "未知";
    return `${s.icon} ${s.typeName}：练习${s.totalAttempts}次，完成${s.completedCount}题，完成率${Math.round(s.completionRate * 100)}%，平均用时${time}，平均错误${s.avgMistakes.toFixed(1)}次，薄弱指数${s.weakScore}/100`;
  });

  return `以下是学生最近的练习数据：\n${lines.join("\n")}\n\n薄弱指数越高表示越需要加强（>60为薄弱，<30为掌握良好）。`;
}

export async function analyzeWeakness(stats: PracticeStat[]): Promise<AnalysisResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-xxx")) {
    // 无 API key，返回基于规则的后备分析
    return fallbackAnalysis(stats);
  }

  const userPrompt = formatStatsForPrompt(stats);

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek API error:", response.status, errText);
      return fallbackAnalysis(stats);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return fallbackAnalysis(stats);
    }

    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary ?? "",
      weakPoints: parsed.weakPoints ?? [],
      recommendations: parsed.recommendations ?? [],
      encouragement: parsed.encouragement ?? "",
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("AI analysis failed:", err);
    return fallbackAnalysis(stats);
  }
}

/** 基于规则的后备分析（无 API key 时使用） */
function fallbackAnalysis(stats: PracticeStat[]): AnalysisResult {
  const practiced = stats.filter((s) => s.totalAttempts > 0);

  if (practiced.length === 0) {
    return {
      summary: "还没有开始练习，从第一课开始你的数独之旅吧！",
      weakPoints: ["所有题型都需要从头学起"],
      recommendations: ["🌱 先完成「认识数独」课程", "⭐ 从四宫标准数独开始练习", "📈 每天坚持练习 15-20 分钟"],
      encouragement: "每个数独高手都是从零开始的，相信你一定能行！加油！💪",
      generatedAt: new Date().toISOString(),
    };
  }

  const sorted = [...practiced].sort((a, b) => b.weakScore - a.weakScore);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  const weakPoints: string[] = [];
  const recommendations: string[] = [];

  if (weakest.weakScore > 60) {
    weakPoints.push(`${weakest.icon} ${weakest.typeName}：完成率${Math.round(weakest.completionRate * 100)}%，需要重点加强`);
    recommendations.push(`🎯 多练习 ${weakest.typeName}，先从简单难度开始`);
  }
  if (weakest.avgDurationMs > 120000) {
    weakPoints.push("⏱️ 整体速度需要提升");
    recommendations.push("⚡ 做题时先找唯一数，不要在一格上纠结太久");
  }
  if (weakest.avgMistakes > 2) {
    weakPoints.push("❌ 错误次数偏多，需要更仔细");
    recommendations.push("✏️ 填数前先检查同行同列同宫有没有冲突");
  }

  if (recommendations.length === 0) {
    recommendations.push("💪 继续保持，挑战更高难度！", "🏆 尝试总决赛题型，为比赛做准备");
  }

  const encouragement =
    strongest.completionRate > 0.7
      ? `你在 ${strongest.typeName} 上表现很好！继续保持，把同样的方法用到其他题型上！🌟`
      : "每一步练习都在进步，坚持就是胜利！加油！💪";

  return {
    summary: `已练习 ${practiced.length} 种题型，共 ${practiced.reduce((a, s) => a + s.totalAttempts, 0)} 次`,
    weakPoints: weakPoints.length > 0 ? weakPoints : ["继续巩固已学的题型"],
    recommendations,
    encouragement,
    generatedAt: new Date().toISOString(),
  };
}
