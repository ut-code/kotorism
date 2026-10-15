import { ChinesePronunciation } from "@/components/chinese/ChinesePronunciation";

export const title = "発音・四声チェック";

export default function ChinesePronunciationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">発音・四声チェック</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        単語やフレーズのお手本音声を聞き、マイクに向かって発音してみましょう。
        四声や音のズレをブラウザが判定します。（※Chrome / Edge 推奨）
      </p>

      <div className="mt-8">
        <ChinesePronunciation />
      </div>
    </div>
  );
}
