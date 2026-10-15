import { PinyinPractice } from "@/components/pinyin/PinyinPractice";
import { characters } from "./characters";

export const title = "漢字からピンイン";

export default function ChinesePinyinPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">漢字からピンイン</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        基本的な漢字を1字ずつ見て、ピンインを入力しましょう。四声は母音を入力した直後に
        ↑／↓キーで選べます。
      </p>
      <div className="mt-8">
        <PinyinPractice characters={characters} />
      </div>
    </div>
  );
}
