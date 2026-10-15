"use client";

import { EssayPractice } from "@/components/essay/EssayPractice";

export const title = "作文";
export const description = "お題を選んでスペイン語で作文を書き、AIに添削してもらいましょう。";

export default function SpanishEssayPage() {
  return <EssayPractice languageSlug="spanish" languageLabel="スペイン語" />;
}
