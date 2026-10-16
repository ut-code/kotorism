import type { TranslationDirection, TranslationFeedback } from "./types";

// OpenRouterの無料枠モデル。無料モデルは提供元の混雑で一時的に429（レート制限）になることがあるため、
// 空き状況の良いモデルを選んでいる。より良い無料モデルが出た場合はOPENROUTER_MODEL環境変数で上書きできる
// （作文セクション lib/essay/grading.ts と同じモデル・同じ環境変数を利用する）
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export class TranslationGradingError extends Error {}

interface GradeTranslationInput {
  languageLabel: string;
  direction: TranslationDirection;
  sourceText: string;
  // カスタム題材のときはnull（模範解答が存在しないため）
  referenceTranslation: string | null;
  content: string;
  // 満点（設定画面でユーザーが選んだ点数。TRANSLATION_SCORE_OPTIONSのいずれか）
  scoreMax: number;
}

const SYSTEM_PROMPT = `あなたは外国語教育に精通した、励ましを大切にする語学教師です。
日本語話者の学習者が書いた訳文を、訳の正確さ・語彙・文法・自然さを総合的に踏まえて指定された満点で採点し、日本語で講評してください。
項目ごとに分けず、総合的な1つの点数として採点してください。
模範解答が示されている場合、それはあくまで一例であり、意味が通り自然であれば模範解答と表現が異なっていても減点しないでください。
模範解答が示されていない場合は、原文の意味に忠実で自然な訳になっているかを基準に採点してください。
学習者のやる気を削がないよう、採点はやや甘めを心がけてください。
出力は指定されたJSON形式のみとし、それ以外の文章（説明・前置き・コードブロックの記号など）は一切含めないでください。`;

function buildUserPrompt(input: GradeTranslationInput): string {
  const directionLabel =
    input.direction === "fromJapanese"
      ? `日本語 → ${input.languageLabel}`
      : `${input.languageLabel} → 日本語`;

  const referenceLine = input.referenceTranslation
    ? `【模範解答（一例）】${input.referenceTranslation}\n`
    : "";

  return `【言語】${input.languageLabel}
【学習者のレベル】初修の第二外国語として学ぶ大学1年生
【訳す方向】${directionLabel}
【原文】${input.sourceText}
${referenceLine}【学習者の訳文】
${input.content}

上記の訳文を、訳の正確さ・語彙・文法・自然さを総合的に踏まえて0〜${input.scoreMax}点の整数で採点してください。

次のJSON形式のみで出力してください（キー名・構造を変えないこと）。scoreは0〜${input.scoreMax}点の整数、commentは日本語で2〜4文の具体的な講評（良い点・改善点や文法/語彙の誤りの指摘など）です。

{
  "score": number,
  "comment": string
}`;
}

function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new TranslationGradingError("AIの応答からJSONを読み取れませんでした。");
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new TranslationGradingError("AIの応答を解析できませんでした。");
  }
}

function clampScore(value: unknown, max: number): number {
  const num = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.min(max, Math.max(0, Math.round(num)));
}

function readComment(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toFeedback(raw: unknown, scoreMax: number): TranslationFeedback {
  if (typeof raw !== "object" || raw === null) {
    throw new TranslationGradingError("AIの応答の形式が想定と異なります。");
  }
  const record = raw as Record<string, unknown>;

  return {
    max: scoreMax,
    score: clampScore(record.score, scoreMax),
    comment: readComment(record.comment),
  };
}

// OpenRouter（無料モデル）に翻訳の採点を依頼する
export async function gradeTranslation(
  input: GradeTranslationInput,
): Promise<{ feedback: TranslationFeedback; model: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new TranslationGradingError(
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
    throw new TranslationGradingError(
      "AIサーバーへの接続に失敗しました。時間をおいて再度お試しください。",
    );
  }

  if (!response.ok) {
    throw new TranslationGradingError(
      `AIによる添削に失敗しました（エラーコード: ${response.status}）。時間をおいて再度お試しください。`,
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new TranslationGradingError("AIから添削結果を取得できませんでした。");
  }

  const feedback = toFeedback(extractJsonObject(text), input.scoreMax);
  return { feedback, model };
}
