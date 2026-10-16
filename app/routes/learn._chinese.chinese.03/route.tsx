import { PinyinPractice } from "@/components/pinyin/PinyinPractice";
import { characters } from "./characters";

export const title = "漢字からピンイン";
export const description =
  "基本的な漢字を1字ずつ見て、ピンインを入力しましょう。四声は母音を入力した直後に↑／↓キーで選べます。";

export default function ChinesePinyinPage() {
  return <PinyinPractice characters={characters} />;
}
