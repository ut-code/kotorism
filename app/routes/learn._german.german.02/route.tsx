import { TranslationPractice } from "@/components/translation/TranslationPractice";

export const title = "翻訳";
export const description = "ドイツ語⇔日本語の訳文を書き、AIに添削してもらいましょう。";

export default function GermanTranslationPage() {
  return <TranslationPractice languageSlug="german" languageLabel="ドイツ語" />;
}
