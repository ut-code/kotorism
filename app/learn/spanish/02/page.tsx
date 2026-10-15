"use client";

import { TranslationPractice } from "@/components/translation/TranslationPractice";

export const title = "翻訳";
export const description = "スペイン語⇔日本語の訳文を書き、AIに添削してもらいましょう。";

export default function SpanishTranslationPage() {
  return <TranslationPractice languageSlug="spanish" languageLabel="スペイン語" />;
}
