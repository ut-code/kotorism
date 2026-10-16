import { ConjugationPractice } from "@/components/verbs/ConjugationPractice";
import { germanConjugationConfig } from "@/lib/shared/conjugation/de/config";
import { verbs } from "./verbs";

export const title = "動詞の活用";
export const description = "動詞・時制・法を選んで、活用形を入力しながら覚えましょう。";

export default function GermanVerbConjugationPage() {
  return <ConjugationPractice verbs={verbs} language={germanConjugationConfig} sectionSlug="03" />;
}
