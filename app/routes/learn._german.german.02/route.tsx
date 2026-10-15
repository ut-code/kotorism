import { TranslationPractice } from "@/components/translation/TranslationPractice";

export const title = "翻訳";

export default function GermanTranslationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">翻訳</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        ドイツ語⇔日本語の訳文を書き、AIに添削してもらいましょう。
      </p>
      <div className="mt-8">
        <TranslationPractice languageSlug="german" languageLabel="ドイツ語" />
      </div>
    </div>
  );
}
