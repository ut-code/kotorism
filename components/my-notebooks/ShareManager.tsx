"use client";

import { useState } from "react";

import IntentForm from "@/components/IntentForm";
import { useIsClient } from "@/components/UseIsClient";

type Invite = { id: string; token: string };
type Share = { id: string; userName: string };

// 単語帳の共同編集者（招待リンク・参加済みメンバー）を管理するパネル。作成者にのみ表示する。
// 参加すると常に編集可能になる（閲覧のみの共有は別途「リンクで一般公開」が担う）。
// 普段は折りたたんでおき、必要なときだけ「共同編集者を管理」で開く
export default function ShareManager({
  notebookId,
  invites,
  shares,
}: {
  notebookId: string;
  invites: Invite[];
  shares: Share[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // origin はブラウザで表示が確定してから使う（サーバーでは分からず、ハイドレーションが不一致になるため）
  const isClient = useIsClient();
  const origin = isClient ? window.location.origin : "";

  async function handleCopy(token: string) {
    await navigator.clipboard.writeText(`${origin}/invite/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken((t) => (t === token ? null : t)), 2000);
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-sm text-zinc-600 transition-colors hover:underline dark:text-zinc-400"
      >
        共同編集者を管理
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-dashed border-black/[.15] p-4 dark:border-white/[.2]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">共同編集者を管理</h3>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-zinc-500 transition-colors hover:underline dark:text-zinc-500"
        >
          閉じる
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-500">
          リンクを知っていてログインしている人が「参加する」を押すと、この単語帳を編集できるようになります。
        </p>
        <IntentForm action={`/my-notebooks/${notebookId}`} intent="createInvite">
          <button
            type="submit"
            className="rounded-full border border-coral-300 px-3 py-1.5 text-xs font-medium text-coral-700 transition-colors hover:border-coral-500 hover:bg-coral-50 dark:border-coral-900/50 dark:text-coral-300 dark:hover:bg-coral-950/20"
          >
            招待リンクを発行する
          </button>
        </IntentForm>
      </div>

      {invites.length > 0 && (
        <ul className="flex flex-col gap-2">
          {invites.map((invite) => (
            <li
              key={invite.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-black/[.06] p-2 text-xs dark:border-white/[.1]"
            >
              <input
                type="text"
                readOnly
                value={`${origin}/invite/${invite.token}`}
                onFocus={(event) => event.currentTarget.select()}
                className="min-w-0 flex-1 rounded border border-black/[.08] bg-white px-2 py-1 text-zinc-600 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400"
              />
              <button
                type="button"
                onClick={() => handleCopy(invite.token)}
                className="shrink-0 text-coral-600 transition-colors hover:underline dark:text-coral-400"
              >
                {copiedToken === invite.token ? "コピーしました" : "コピー"}
              </button>
              <IntentForm
                action={`/my-notebooks/${notebookId}`}
                intent="revokeInvite"
                fields={{ inviteId: invite.id }}
              >
                <button
                  type="submit"
                  className="shrink-0 text-red-600 transition-colors hover:underline dark:text-red-400"
                >
                  失効
                </button>
              </IntentForm>
            </li>
          ))}
        </ul>
      )}

      {shares.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">共同編集者</p>
          <ul className="flex flex-col gap-2">
            {shares.map((share) => (
              <li
                key={share.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-black/[.06] p-2 text-xs dark:border-white/[.1]"
              >
                <span className="flex-1 text-zinc-700 dark:text-zinc-300">{share.userName}</span>
                <IntentForm
                  action={`/my-notebooks/${notebookId}`}
                  intent="removeShare"
                  fields={{ shareId: share.id }}
                >
                  <button
                    type="submit"
                    className="text-red-600 transition-colors hover:underline dark:text-red-400"
                  >
                    削除
                  </button>
                </IntentForm>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
