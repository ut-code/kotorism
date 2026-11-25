import { PinyinPractice } from "@/components/pinyin/PinyinPractice";
import { characters } from "./characters";
import type { PracticeKind } from "@/lib/shared/learn/practice-estimate";

// セクション一覧のカードに出す所要時間の目安に使う答え方
export const practiceKind: PracticeKind = "typing";

export const title = "漢字からピンイン";
export const description =
  "基本的な漢字を1字ずつ見て、ピンインを入力しましょう。四声は母音を入力した直後に↑／↓キーで選べます。";

export default function ChinesePinyinPage() {
  return <PinyinPractice characters={characters} />;
}
