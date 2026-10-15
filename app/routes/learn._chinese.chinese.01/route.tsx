import { EssayPractice } from "@/components/essay/EssayPractice";

export const title = "作文";

export default function ChineseEssayPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">作文</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        お題を選んで中国語で作文を書き、AIに添削してもらいましょう。
      </p>
      <div className="mt-8">
        <EssayPractice languageSlug="chinese" languageLabel="中国語" />
      </div>
    </div>
  );
}
