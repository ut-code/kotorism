import { ConjugationPractice } from "@/components/verbs/ConjugationPractice";
import { spanishConjugationConfig } from "@/lib/shared/conjugation/es/config";
import { verbs } from "./verbs";

export const title = "動詞の活用";
export const description = "動詞・時制・法を選んで、活用形を入力しながら覚えましょう。";

export default function SpanishVerbConjugationPage() {
  return <ConjugationPractice verbs={verbs} language={spanishConjugationConfig} sectionSlug="03" />;
}
