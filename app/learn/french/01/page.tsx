"use client";

import { EssayPractice } from "@/components/essay/EssayPractice";

export const title = "作文";
export const description = "お題を選んでフランス語で作文を書き、AIに添削してもらいましょう。";

export default function FrenchEssayPage() {
  return <EssayPractice languageSlug="french" languageLabel="フランス語" />;
}
