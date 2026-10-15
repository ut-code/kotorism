import { EssayPractice } from "@/components/essay/EssayPractice";

export const title = "作文";

export default function FrenchEssayPage() {
  return (
    <div>
      <h1>作文</h1>
      <p>お題を選んでフランス語で作文を書き、AIに添削してもらいましょう。</p>
      <div className="mt-8">
        <EssayPractice languageSlug="french" languageLabel="フランス語" />
      </div>
    </div>
  );
}
