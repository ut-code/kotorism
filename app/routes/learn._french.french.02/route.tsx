import { TranslationPractice } from "@/components/translation/TranslationPractice";

export const title = "翻訳";

export default function FrenchTranslationPage() {
  return (
    <div>
      <h1>翻訳</h1>
      <p>フランス語⇔日本語の訳文を書き、AIに添削してもらいましょう。</p>
      <div className="mt-8">
        <TranslationPractice languageSlug="french" languageLabel="フランス語" />
      </div>
    </div>
  );
}
