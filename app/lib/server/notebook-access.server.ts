import { prisma } from "@/lib/server/prisma.server";

// "owner": 作成者。"editor": 招待リンク経由で参加した共同編集者（常に編集可能。
// 閲覧のみの共有は別途 isPublic の公開リンクが担うため、ここに"viewer"は無い）
export type NotebookRole = "owner" | "editor";

// 単語帳に対するユーザーの権限を判定する。
// 作成者なら"owner"、NotebookShareに登録されていれば"editor"、
// どちらでもなければnull（アクセス権無し、または単語帳自体が存在しない）を返す
export async function getNotebookRole(
  notebookId: string,
  userId: string,
): Promise<NotebookRole | null> {
  const notebook = await prisma.notebook.findUnique({
    where: { id: notebookId },
    select: { userId: true },
  });
  if (!notebook) return null;
  if (notebook.userId === userId) return "owner";

  const share = await prisma.notebookShare.findUnique({
    where: { notebookId_userId: { notebookId, userId } },
    select: { id: true },
  });
  return share ? "editor" : null;
}

// 単語帳を操作する権限が無ければ例外を投げる。Server Action専用（ページ側はnotFound()を使う）
// - "member": owner/editorのいずれか（カードの閲覧・編集・★の付け外しなど）
// - "owner":  作成者のみ（単語帳削除・公開設定・共有管理など）
export async function requireNotebookRole(
  notebookId: string,
  userId: string,
  minRole: "member" | "owner",
): Promise<NotebookRole> {
  const role = await getNotebookRole(notebookId, userId);

  const ok = role === "owner" || (minRole === "member" && role === "editor");

  if (!ok || !role) {
    throw new Error("この単語帳を操作する権限がありません。");
  }
  return role;
}
