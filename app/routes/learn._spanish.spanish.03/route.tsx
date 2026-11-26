import { ConjugationPractice } from "@/components/verbs/ConjugationPractice";
import { spanishConjugationConfig } from "@/lib/shared/conjugation/es/config";
import { verbs } from "./verbs";
import type { PracticeKind } from "@/lib/shared/learn/practice-estimate";

// セクション一覧のカードに出す所要時間の目安に使う答え方
export const practiceKind: PracticeKind = "choice";

export const title = "動詞の活用";
export const description = "動詞・時制・法を選んで、活用形を4択や筆記で覚えましょう。";

export default function SpanishVerbConjugationPage() {
  return <ConjugationPractice verbs={verbs} language={spanishConjugationConfig} sectionSlug="03" />;
}
