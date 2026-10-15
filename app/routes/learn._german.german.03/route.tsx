import { ConjugationPractice } from "@/components/verbs/ConjugationPractice";
import { germanConjugationConfig } from "@/lib/shared/conjugation/de/config";
import { verbs } from "./verbs";

export const title = "動詞の活用";

export default function GermanVerbConjugationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">動詞の活用</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        動詞・時制・法を選んで、活用形を入力しながら覚えましょう。
      </p>
      <div className="mt-8">
        <ConjugationPractice verbs={verbs} language={germanConjugationConfig} sectionSlug="03" />
      </div>
    </div>
  );
}
