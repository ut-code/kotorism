import { useMemo, useState } from "react";

import { loadFillInItems, type FillInItem } from "@/components/practice/data";
import { CollapsibleChoice, type ChoiceOption } from "@/components/practice/PracticeControls";
import { Quiz, QuizEmpty } from "@/components/practice/Quiz";
import { languageTypingMode } from "@/components/practice/typing-mode";
import { PRACTICE_LANGUAGES, type PracticeLanguageSlug } from "@/lib/shared/practice-languages";

type AnswerMode = "choice" | "typing";

// 初学者には綴りを一から書くのは難しいので、4択を初めの答え方にする
const ANSWER_MODE_OPTIONS: ChoiceOption<AnswerMode>[] = [
  { value: "choice", label: "4択" },
  { value: "typing", label: "筆記" },
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 穴埋め演習。例文の空欄（_）に入る語形を4択で選ぶか入力する。
// 出題データはこのセクションの MDX にある表から読み取り、表の上の見出し（###）を出題範囲にする。
// 4択の誤答は表の5列目に書く。誤答の無い問題は、4択にしていても入力式で出す
export default function FillInPractice({
  language,
  section,
}: {
  language: PracticeLanguageSlug;
  section: string;
}) {
  const lang = PRACTICE_LANGUAGES[language];
  const items = useMemo(() => loadFillInItems(language, section), [language, section]);
  const categories = useMemo(() => [...new Set(items.map((item) => item.category))], [items]);
  // 選択肢の並びは問題ごとに一度だけ決める（描き直すたびに並びが変わらないように）
  const choicesById = useMemo(
    () => new Map(items.map((item) => [item.id, shuffle([item.answer, ...item.distractors])])),
    [items],
  );
  const [scope, setScope] = useState("all");
  const [answerMode, setAnswerMode] = useState<AnswerMode>("choice");
  const isChoice = (item: FillInItem) => answerMode === "choice" && item.distractors.length > 0;
  const typingMode = languageTypingMode<FillInItem>(lang, "語形を入力…");
  const pool = scope === "all" ? items : items.filter((item) => item.category === scope);

  if (items.length === 0) return <QuizEmpty />;

  return (
    <Quiz
      pool={pool}
      settings={
        <>
          <CollapsibleChoice
            title="答え方"
            options={ANSWER_MODE_OPTIONS}
            value={answerMode}
            onChange={setAnswerMode}
          />
          <CollapsibleChoice
            title="出題範囲"
            options={[
              { value: "all", label: "すべて" },
              ...categories.map((category) => ({ value: category, label: category })),
            ]}
            value={scope}
            onChange={setScope}
          />
        </>
      }
      timer
      lang={lang.lang}
      mode={(item) =>
        isChoice(item)
          ? { kind: "choice", choices: (q) => choicesById.get(q.id) ?? [q.answer] }
          : typingMode
      }
      instruction={(item) =>
        isChoice(item) ? "空欄に入る語形を選んでください" : "空欄に入る語形を入力してください"
      }
      renderPrompt={(item) => (
        <>
          <span className="inline-block rounded-full bg-tealblue-50 px-3 py-1 text-xs font-bold text-tealblue-700 dark:bg-tealblue-950/50 dark:text-tealblue-300">
            {item.category}
          </span>
          <p
            lang={lang.lang}
            className="mt-4 text-xl font-bold leading-snug text-zinc-900 md:text-2xl dark:text-zinc-50"
          >
            {item.sentence}
          </p>
          <p className="mt-3 text-base text-zinc-600 md:text-lg dark:text-zinc-400">
            {item.translation}
          </p>
        </>
      )}
      renderMistakePrompt={(item) => (
        <>
          <span lang={lang.lang} className="font-semibold">
            {item.sentence}
          </span>
          <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">{item.translation}</span>
        </>
      )}
    />
  );
}
