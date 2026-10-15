"use client";

import { EssayPractice } from "@/components/essay/EssayPractice";

export const title = "作文";
export const description = "お題を選んで中国語で作文を書き、AIに添削してもらいましょう。";

export default function ChineseEssayPage() {
  return <EssayPractice languageSlug="chinese" languageLabel="中国語" />;
}
