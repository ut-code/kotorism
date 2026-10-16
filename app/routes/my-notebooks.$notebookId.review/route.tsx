import { redirect, type ShouldRevalidateFunction } from "react-router";
import { notFound } from "@/lib/server/http.server";

import { prisma } from "@/lib/server/prisma.server";
import { requireUser } from "@/lib/server/session.server";
import { recordNotebookView } from "@/lib/server/recent-activity.server";
import { getNotebookRole } from "@/lib/server/notebook-access.server";
import StudyDeck from "@/components/my-notebooks/StudyDeck";
import { normalizeCardData } from "@/lib/shared/card-data";
import { normalizeColumns } from "@/lib/shared/notebook-columns";
import type { Route } from "./+types/route";

// 復習モードは★を外してもカードが一覧から抜けないよう、★の付け外し(toggleStar)では再取得しない。
// 抜けると表示中の位置がずれてしまうため。次にこのページを開いたときのDB取得に反映される
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formData,
  defaultShouldRevalidate,
}) => (formData?.get("intent") === "toggleStar" ? false : defaultShouldRevalidate);

export async function loader({ params }: Route.LoaderArgs) {
  const user = await requireUser();
  const { notebookId } = params;

  // 作成者・共同編集者（編集可/閲覧のみ）のいずれでもなければ404にする
  const role = await getNotebookRole(notebookId, user.id);
  if (!role) {
    notFound();
  }

  // 最近見た単語帳としてトップページに出すため、レスポンスを待たずに閲覧日時を記録する
  void recordNotebookView(user.id, notebookId).catch(console.error);

  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    select: { id: true, title: true, columns: true },
  });

  // ★がついたカードだけを、自分（user.id）の進捗としてposition昇順で取得する
  const progressRows = await prisma.cardProgress.findMany({
    where: { userId: user.id, starred: true, card: { notebookId } },
    include: { card: true },
    orderBy: { card: { position: "asc" } },
  });

  // ★のついた単語が1件も無い状態では復習モードが成立しないため、単語帳のトップページへ差し戻す
  if (progressRows.length === 0) {
    throw redirect(`/my-notebooks/${notebook.id}`);
  }

  // 表示・フリップ・★の付け外しはすべてクライアント側のStudyDeckが担当するため、
  // ここではサーバーでDBから取得したデータをそのまま整形して渡すだけ
  const columns = normalizeColumns(notebook.columns);
  const cards = progressRows.map((progress) => ({
    id: progress.card.id,
    data: normalizeCardData(progress.card.data),
    starred: progress.starred,
    starCount: progress.starCount,
    viewCount: progress.viewCount,
  }));

  return { notebook: { id: notebook.id, title: notebook.title }, columns, cards };
}

export default function ReviewPage({ loaderData }: Route.ComponentProps) {
  const { notebook, columns, cards } = loaderData;

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        {notebook.title}
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
        復習モード（★をつけた単語のみ）
      </p>

      <div className="mt-8 w-full">
        <StudyDeck notebookId={notebook.id} columns={columns} cards={cards} mode="review" />
      </div>
    </main>
  );
}
