import { useEffect, useState } from "react";

function readSession(key: string): unknown {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    // プライベートブラウズ等で使えない・壊れたJSONが入っているときは、保存が無いものとして扱う
    return undefined;
  }
}

function writeSession(key: string, json: string | null) {
  try {
    if (json === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, json);
  } catch {
    // 容量超過・使えない環境では保存を諦める（リロードで最初からになるだけ）
  }
}

// 暗記学習・クイズの途中経過を sessionStorage に保存し、リロードしたときに読み戻す。
// - restore: 保存されていた値（未検証）を受け取り、検証して state に戻す。保存が無ければ呼ばれない
// - snapshot: 今の途中経過。null のときは保存を消す（設定画面に戻った等）
// サーバーでの描画とハイドレーションの不一致を避けるため、読み戻しは表示が確定したあと（effect）で行う。
// 返り値の restored は読み戻しが終わったかどうかで、それまでに起きた記録（表示回数など）を止めるのに使う
export function useSessionProgress(
  key: string,
  snapshot: unknown,
  restore: (saved: unknown) => void,
): { restored: boolean } {
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const saved = readSession(key);
    if (saved !== undefined) restore(saved);
    setRestored(true);
    // 読み戻しはページを開いたとき（キーが変わったとき）の1回だけ
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 読み戻す前に初期状態で上書きしないよう、読み戻しが終わってから保存を始める
  const json = snapshot === null ? null : JSON.stringify(snapshot);
  useEffect(() => {
    if (!restored) return;
    writeSession(key, json);
  }, [restored, key, json]);

  return { restored };
}
