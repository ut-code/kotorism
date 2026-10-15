import Link from "@/components/Link";
import { redirect, useFetcher } from "react-router";

import { prisma } from "@/lib/server/prisma.server";
import { getCurrentUser } from "@/lib/server/session.server";
import { acceptInvite } from "@/lib/server/my-notebooks/sharing-actions.server";
import type { Route } from "./+types/route";

// 「参加する」ボタンからの送信を受ける。参加を確定して単語帳ページへ redirect する
export async function action({ params }: Route.ActionArgs) {
  return acceptInvite(params.token);
}

export async function loader({ params }: Route.LoaderArgs) {
  const { token } = params;

  const user = await getCurrentUser();
  if (!user) {
    throw redirect(`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const invite = await prisma.notebookInvite.findUnique({
    where: { token },
    select: {
      notebook: { select: { id: true, title: true, userId: true } },
    },
  });

  // 無効な招待リンク。ページ側で案内を表示する
  if (!invite) return { notebookTitle: null };

  // 既に作成者本人、または共同編集者として参加済みなら、確認なしでそのまま単語帳へ
  if (invite.notebook.userId === user.id) {
    throw redirect(`/my-notebooks/${invite.notebook.id}`);
  }
  const existingShare = await prisma.notebookShare.findUnique({
    where: { notebookId_userId: { notebookId: invite.notebook.id, userId: user.id } },
    select: { id: true },
  });
  if (existingShare) {
    throw redirect(`/my-notebooks/${invite.notebook.id}`);
  }

  return { notebookTitle: invite.notebook.title };
}

// 招待リンクの受け口。GETだけで参加が確定しないよう、ここでは招待内容を表示するだけにし、
// 実際の参加（NotebookShareの作成）は「参加する」ボタンから action を呼んだときに行う
export default function InvitePage({ loaderData }: Route.ComponentProps) {
  const { notebookTitle } = loaderData;
  const fetcher = useFetcher();

  if (notebookTitle === null) {
    return (
      <main className="flex flex-1 flex-col items-center px-6 py-24 text-center">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            この招待リンクは無効です
          </h1>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-500">
            リンクが失効しているか、URLが正しくない可能性があります。単語帳の作成者に、招待リンクの再発行を依頼してください。
          </p>
          <Link
            href="/my-notebooks"
            className="mt-6 inline-block text-sm text-coral-600 hover:underline dark:text-coral-400"
          >
            My単語帳へ戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24 text-center">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">単語帳への招待</h1>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          「{notebookTitle}」に
          <br />
          <span className="font-medium text-black dark:text-zinc-50">共同編集者</span>
          として参加します。
        </p>

        <fetcher.Form method="post" className="mt-8">
          <button
            type="submit"
            className="rounded-full bg-coral-500 px-6 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-200 dark:hover:shadow-none"
          >
            参加する
          </button>
        </fetcher.Form>

        <Link
          href="/my-notebooks"
          className="mt-6 inline-block text-sm text-zinc-500 hover:underline dark:text-zinc-500"
        >
          キャンセルしてMy単語帳へ戻る
        </Link>
      </div>
    </main>
  );
}
