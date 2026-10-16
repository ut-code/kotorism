import type { QuizAnswerMode, QuizQuestion } from "@/components/practice/Quiz";
import { AccentKeyHint } from "@/components/practice/SpecialCharPalette";
import type { PracticeLanguage } from "@/lib/shared/practice-languages";

// フランス語・ドイツ語・スペイン語の入力式の答え方（特殊文字の入力補助と案内）
export function languageTypingMode<Q extends QuizQuestion>(
  language: PracticeLanguage,
  placeholder: string,
): QuizAnswerMode<Q> {
  return {
    kind: "typing",
    accentCycles: language.accentCycles,
    toolbarChars: language.specialChars,
    hint: <AccentKeyHint language={language} />,
    placeholder,
  };
}
