import type { NumberItem, TimeItem } from "./practice-data";

// 数字・時間表現の演習の問題。数字は「21」、時刻は「7:30」のように出し、その言語の言い方を答える
export type NumberPracticeItem = {
  id: string;
  kind: "number" | "time";
  // 問題として大きく出す文字列（「21」「7:30」）
  prompt: string;
  // 似た問題を選ぶための値（数字はその数、時刻は0時からの分）
  value: number;
  // 正解（4択ではこの言い方を正解の選択肢にする）
  answer: string;
  // 入力式で正解にする別の言い方（「halb acht」に対する「sieben Uhr dreißig」など）
  alternatives: string[];
  // 問題の下に出す補足（「正午」など）
  note?: string;
  // 答え合わせのあとに出す別の言い方
  explanation?: string;
};

// 数字（全セクションの「数字 | つづり」）と時刻（「時刻 | 言い方 | 補足」）を、1つの演習の問題にまとめる
export function buildNumberPracticeItems(
  numbers: NumberItem[],
  times: TimeItem[],
): NumberPracticeItem[] {
  return [
    ...numbers.map(({ num, spelling }, i): NumberPracticeItem => ({
      id: `number-${num}-${i}`,
      kind: "number",
      prompt: String(num),
      value: num,
      answer: spelling,
      alternatives: [],
    })),
    ...times.map(({ time, answers: [answer, ...alternatives], note }, i): NumberPracticeItem => {
      const [hour, minute] = time.split(":").map(Number);
      return {
        id: `time-${time}-${i}`,
        kind: "time",
        prompt: time,
        value: hour * 60 + minute,
        answer,
        alternatives,
        note: note || undefined,
        explanation:
          alternatives.length > 0 ? `ほかの言い方: ${alternatives.join(" / ")}` : undefined,
      };
    }),
  ];
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function matchesAnyAnswer(given: string, item: NumberPracticeItem): boolean {
  const answer = normalize(given);
  return [item.answer, ...item.alternatives].some((a) => normalize(a) === answer);
}

// まぎらわしさ。数字は一の位・十の位が同じものや近い数、時刻は時（12時間制）か分が同じもの
function similarity(a: NumberPracticeItem, b: NumberPracticeItem): number {
  if (a.kind === "number") {
    return (
      (a.value % 10 === b.value % 10 ? 2 : 0) +
      (Math.floor(a.value / 10) === Math.floor(b.value / 10) ? 2 : 0) +
      (Math.abs(a.value - b.value) <= 10 ? 1 : 0)
    );
  }
  const hour = (v: number) => Math.floor(v / 60) % 12;
  return (hour(a.value) === hour(b.value) ? 2 : 0) + (a.value % 60 === b.value % 60 ? 2 : 0);
}

// 4択の誤答。同じ種類の問題の正解から、まぎらわしいものを優先して count 個選ぶ（同点は random で混ぜる）
export function pickDistractors(
  target: NumberPracticeItem,
  items: NumberPracticeItem[],
  count: number,
  random: () => number = Math.random,
): string[] {
  const seen = new Set([normalize(target.answer)]);
  const candidates = items
    .filter((item) => item.kind === target.kind && item.id !== target.id)
    .map((item) => ({ item, score: similarity(target, item), tiebreak: random() }))
    .sort((a, b) => b.score - a.score || a.tiebreak - b.tiebreak);
  const picked: string[] = [];
  for (const { item } of candidates) {
    if (picked.length >= count) break;
    const key = normalize(item.answer);
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(item.answer);
  }
  return picked;
}
