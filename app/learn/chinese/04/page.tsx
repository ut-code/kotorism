"use client";

import { ChinesePronunciation } from "@/components/chinese/ChinesePronunciation";

export const title = "発音・四声チェック";
export const description =
  "単語やフレーズのお手本音声を聞き、マイクに向かって発音してみましょう。四声や音のズレをブラウザが判定します。（※Chrome / Edge 推奨）";

export default function ChinesePronunciationPage() {
  return <ChinesePronunciation />;
}
