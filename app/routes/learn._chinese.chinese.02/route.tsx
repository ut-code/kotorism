import { TranslationPractice } from "@/components/translation/TranslationPractice";

export const title = "翻訳";
export const description = "中国語⇔日本語の訳文を書き、AIに添削してもらいましょう。";

export default function ChineseTranslationPage() {
  return <TranslationPractice languageSlug="chinese" languageLabel="中国語" />;
}
