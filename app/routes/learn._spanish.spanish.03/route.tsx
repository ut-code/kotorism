import { ConjugationPractice } from "@/components/verbs/ConjugationPractice";
import { spanishConjugationConfig } from "@/lib/shared/conjugation/es/config";
import { verbs } from "./verbs";

export const title = "動詞の活用";

export default function SpanishVerbConjugationPage() {
  return (
    <div>
      <h1>動詞の活用</h1>
      <p>動詞・時制・法を選んで、活用形を入力しながら覚えましょう。</p>
      <div className="mt-8">
        <ConjugationPractice verbs={verbs} language={spanishConjugationConfig} />
      </div>
    </div>
  );
}
