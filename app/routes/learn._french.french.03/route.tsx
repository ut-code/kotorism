import { ConjugationPractice } from "@/components/verbs/ConjugationPractice";
import { frenchConjugationConfig } from "@/lib/shared/conjugation/fr/config";
import { verbs } from "./verbs";

export const title = "動詞の活用";
export const description = "動詞・時制・法を選んで、活用形を4択や筆記で覚えましょう。";

export default function FrenchVerbConjugationPage() {
  return <ConjugationPractice verbs={verbs} language={frenchConjugationConfig} sectionSlug="03" />;
}
