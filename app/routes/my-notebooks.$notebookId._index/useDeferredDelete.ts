import { useEffect, useRef, useState } from "react";
import { useSubmit } from "react-router";

// 単語を消してから、実際にサーバーへ削除を送るまでの時間（この間は「元に戻す」で取り消せる）
export const UNDO_DELETE_MS = 5000;

type PendingDelete = { id: string; head: string; sent: boolean };

// 単語の削除を少し遅らせて、「元に戻す」を出せるようにする。確認ダイアログの代わり。
// - remove(card): すぐ表から隠し、UNDO_DELETE_MS 後に deleteCard を送る
// - undo(id): 送る前なら取り消して表に戻す
// ページを移る（コンポーネントが消える）・タブを閉じるときは、待たずにすぐ送る
export function useDeferredDelete(actionUrl: string, cardIds: string[]) {
  const submit = useSubmit();
  const [pending, setPending] = useState<PendingDelete[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  // タイマーやページを離れるときの処理から、最新の値を読むための参照
  const latest = useRef({ submit, actionUrl });
  useEffect(() => {
    latest.current = { submit, actionUrl };
  });

  function send(id: string) {
    timers.current.delete(id);
    void latest.current.submit(
      { intent: "deleteCard", cardId: id },
      {
        method: "post",
        action: latest.current.actionUrl,
        navigate: false,
        fetcherKey: `deleteCard:${id}`,
      },
    );
    setPending((list) => list.map((item) => (item.id === id ? { ...item, sent: true } : item)));
  }

  function remove(card: { id: string; head: string }) {
    if (timers.current.has(card.id)) return;
    setPending((list) => [...list, { ...card, sent: false }]);
    timers.current.set(
      card.id,
      setTimeout(() => send(card.id), UNDO_DELETE_MS),
    );
  }

  function undo(id: string) {
    const timer = timers.current.get(id);
    if (!timer) return;
    clearTimeout(timer);
    timers.current.delete(id);
    setPending((list) => list.filter((item) => item.id !== id));
  }

  // 送ったあと、再取得した単語の一覧から消えたものは覚えておく必要がない
  const stale = pending.filter((item) => item.sent && !cardIds.includes(item.id));
  if (stale.length > 0) {
    setPending((list) => list.filter((item) => !stale.some((s) => s.id === item.id)));
  }

  useEffect(() => {
    const currentTimers = timers.current;
    // タブを閉じる・別のサイトへ移るときは、ページが消える前に届く sendBeacon で送る
    const flushWithBeacon = () => {
      for (const [id, timer] of currentTimers) {
        clearTimeout(timer);
        const body = new FormData();
        body.set("intent", "deleteCard");
        body.set("cardId", id);
        navigator.sendBeacon(latest.current.actionUrl, body);
      }
      currentTimers.clear();
    };
    window.addEventListener("pagehide", flushWithBeacon);
    return () => {
      window.removeEventListener("pagehide", flushWithBeacon);
      // アプリの中で別のページへ移るときは、待っている削除をすぐ送る
      for (const [id, timer] of currentTimers) {
        clearTimeout(timer);
        void latest.current.submit(
          { intent: "deleteCard", cardId: id },
          {
            method: "post",
            action: latest.current.actionUrl,
            navigate: false,
            fetcherKey: `deleteCard:${id}`,
          },
        );
      }
      currentTimers.clear();
    };
  }, []);

  return {
    // 表から隠す単語（送る前・送ったが再取得がまだのもの）
    hiddenIds: new Set(pending.map((item) => item.id)),
    // 「元に戻す」を出す単語（まだ送っていない、いちばん最後に消したもの）
    undoable: pending.filter((item) => !item.sent).at(-1) ?? null,
    remove,
    undo,
  };
}
