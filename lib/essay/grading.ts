import { essayLengthUnitLabel, type EssayLengthUnit } from "./length";
import {
  ESSAY_CRITERIA,
  type EssayCriteriaMax,
  type EssayCriterionKey,
  type EssayFeedback,
} from "./types";

// OpenRouterの無料枠モデル。無料モデルは提供元の混雑で一時的に429（レート制限）になることがあるため、
// 空き状況の良いモデルを選んでいる。より良い無料モデルが出た場合はOPENROUTER_MODEL環境変数で上書きできる
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export class EssayGradingError extends Error {}

interface GradeEssayInput {
  languageLabel: string;
  topicPrompt: string;
  targetWordCount: number;
  lengthUnit: EssayLengthUnit;
  actualLength: number;
  content: string;
  criteriaMax: EssayCriteriaMax;
}

const SYSTEM_PROMPT = `あなたは外国語教育に精通した、励ましを大切にする語学教師です。
日本語話者の学習者が外国語で書いた作文を、与えられた基準に沿って採点し、日本語で講評してください。
学習者のやる気を削がないよう、採点はやや甘めを心がけてください。特に「構成」は、文章が短い場合や
日常的で身近なお題の場合には厳しくしすぎず、文の数が少なくても内容が自然につながっていれば
大きく減点しないでください。「構成」を大きく減点してよいのは、話の内容が矛盾していたり、
文同士のつながりが不自然だったりする場合に限ります。
出力は指定されたJSON形式のみとし、それ以外の文章（説明・前置き・コードブロックの記号など）は一切含めないでください。`;

function buildUserPrompt(input: GradeEssayInput): string {
  const unitLabel = essayLengthUnitLabel(input.lengthUnit);
  const criteriaLines = ESSAY_CRITERIA.map(({ key, label }) => {
    const hint =
      key === "structure"
        ? "（文章が短い/日常的な内容でも、話の流れが自然なら大きく減点しない）"
        : "";
    return `- ${label}（${key}）: 0〜${input.criteriaMax[key]}点${hint}`;
  }).join("\n");

  return `【言語】${input.languageLabel}
【お題】${input.topicPrompt}
【目安の${unitLabel}数】${input.targetWordCount}${unitLabel}程度
【学習者の作文の実際の${unitLabel}数】${input.actualLength}${unitLabel}
【学習者の作文】
${input.content}

上記の作文を、以下の基準で採点してください。
${criteriaLines}

次のJSON形式のみで出力してください（キー名・構造を変えないこと）。scoreは各基準の配点内の整数、commentは日本語で1〜2文の具体的な講評（良い点・改善点や文法/語彙の誤りの指摘など）です。overallCommentは作文全体への日本語の講評を2〜3文で書いてください。

{
  "vocabulary": { "score": number, "comment": string },
  "grammar": { "score": number, "comment": string },
  "structure": { "score": number, "comment": string },
  "content": { "score": number, "comment": string },
  "overallComment": string
}`;
}

function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new EssayGradingError("AIの応答からJSONを読み取れませんでした。");
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new EssayGradingError("AIの応答を解析できませんでした。");
  }
}

function clampScore(value: unknown, max: number): number {
  const num = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.min(max, Math.max(0, Math.round(num)));
}

function readComment(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toFeedback(raw: unknown, criteriaMax: EssayCriteriaMax): EssayFeedback {
  if (typeof raw !== "object" || raw === null) {
    throw new EssayGradingError("AIの応答の形式が想定と異なります。");
  }
  const record = raw as Record<string, unknown>;

  const criteria = Object.fromEntries(
    ESSAY_CRITERIA.map(({ key }) => {
      const entry = record[key];
      const entryObj =
        typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : {};
      return [
        key,
        {
          max: criteriaMax[key],
          score: clampScore(entryObj.score, criteriaMax[key]),
          comment: readComment(entryObj.comment),
        },
      ];
    }),
  ) as Record<EssayCriterionKey, EssayFeedback[EssayCriterionKey]>;

  return {
    ...criteria,
    overallComment: readComment(record.overallComment),
  };
}

// OpenRouter（無料モデル）にエッセイの採点を依頼する
export async function gradeEssay(
  input: GradeEssayInput,
): Promise<{ feedback: EssayFeedback; model: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new EssayGradingError(
      "AI添削の設定が完了していません（OPENROUTER_API_KEYが未設定です）。管理者に連絡してください。",
    );
  }
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });
  } catch {
    throw new EssayGradingError(
      "AIサーバーへの接続に失敗しました。時間をおいて再度お試しください。",
    );
  }

  if (!response.ok) {
    throw new EssayGradingError(
      `AIによる添削に失敗しました（エラーコード: ${response.status}）。時間をおいて再度お試しください。`,
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new EssayGradingError("AIから添削結果を取得できませんでした。");
  }

  const feedback = toFeedback(extractJsonObject(text), input.criteriaMax);
  return { feedback, model };
}
