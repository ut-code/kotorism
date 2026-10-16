import { redirect } from "react-router";

import { prisma } from "@/lib/server/prisma.server";
import { requireUser } from "@/lib/server/session.server";
import { requireNotebookRole } from "@/lib/server/notebook-access.server";

// 単語帳の共同編集者を招待するリンクを新規発行する（常に編集可能）。作成者のみ実行可能
export async function createInvite(notebookId: string) {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "owner");

  await prisma.notebookInvite.create({ data: { notebookId } });
}

// 発行済みの招待リンクを1件失効させる（削除するとそのリンクはもう使えなくなる）。作成者のみ実行可能
export async function revokeInvite(inviteId: string, notebookId: string) {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "owner");

  await prisma.notebookInvite.delete({ where: { id: inviteId, notebookId } });
}

// 共同編集者を単語帳から外す。作成者のみ実行可能
export async function removeShare(shareId: string, notebookId: string) {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "owner");

  await prisma.notebookShare.delete({ where: { id: shareId, notebookId } });
}

// 招待リンクを開いたログイン済みユーザーが「参加する」を押した際に呼ぶ。
// 既に作成者/メンバーであれば何もせずそのまま単語帳へ
export async function acceptInvite(token: string) {
  const user = await requireUser();

  const invite = await prisma.notebookInvite.findUnique({
    where: { token },
    select: { notebookId: true, notebook: { select: { userId: true } } },
  });

  // 招待ページ側で存在確認済みのはずだが、直接叩かれた場合や失効直後の二重送信に備えて再確認する
  if (!invite) {
    throw redirect("/my-notebooks");
  }

  if (invite.notebook.userId !== user.id) {
    await prisma.notebookShare.upsert({
      where: { notebookId_userId: { notebookId: invite.notebookId, userId: user.id } },
      update: {},
      create: { notebookId: invite.notebookId, userId: user.id },
    });
  }

  throw redirect(`/my-notebooks/${invite.notebookId}`);
}
