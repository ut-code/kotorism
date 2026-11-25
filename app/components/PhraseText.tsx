import { Fragment } from "react";

import { splitAtPhraseBreaks } from "@/lib/shared/phrase-breaks";

// 教材名のような短い日本語を、「・」などの区切りでだけ改行して表示する（「指示詞 / の表完成演習」のような
// 語の途中の改行を防ぐ）。塊1つが幅に収まらないときだけ、はみ出さないよう塊の中でも折り返す
export function PhraseText({ children }: { children: string }) {
  return (
    <span className="break-keep wrap-anywhere">
      {splitAtPhraseBreaks(children).map((chunk, index) => (
        <Fragment key={index}>
          {index > 0 && <wbr />}
          {chunk}
        </Fragment>
      ))}
    </span>
  );
}
