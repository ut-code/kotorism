import { TranslationPractice } from "@/components/translation/TranslationPractice";

export const title = "翻訳";
export const description = "フランス語⇔日本語の訳文を書き、AIに添削してもらいましょう。";

export default function FrenchTranslationPage() {
  return <TranslationPractice languageSlug="french" languageLabel="フランス語" />;
}
