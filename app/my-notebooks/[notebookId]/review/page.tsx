import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getNotebookRole } from "@/lib/notebook-access";
import StudyDeck from "../study/StudyDeck";
import { normalizeCardData } from "@/lib/card-data";
import { normalizeColumns } from "@/lib/notebook-columns";
import { getStudyGoalSummary } from "@/lib/study-goal";

export default async function ReviewPage(props: PageProps<"/my-notebooks/[notebookId]/review">) {
  const user = await requireUser();
  const { notebookId } = await props.params;

  // 作成者・共同編集者（編集可/閲覧のみ）のいずれでもなければ404にする
  const role = await getNotebookRole(notebookId, user.id);
  if (!role) {
    notFound();
  }

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
    redirect(`/my-notebooks/${notebook.id}`);
  }

  // 表示・フリップ・★の付け外しはすべてクライアント側のStudyDeckが担当するため、
  // ここではサーバーでDBから取得したデータをそのまま整形して渡すだけ
  const columns = normalizeColumns(notebook.columns);
  const goal = await getStudyGoalSummary(user.id);
  const cards = progressRows.map((progress) => ({
    id: progress.card.id,
    data: normalizeCardData(progress.card.data),
    starred: progress.starred,
    starCount: progress.starCount,
    viewCount: progress.viewCount,
    mastered: !!progress.masteredAt,
    masteredToday: !!progress.masteredAt && progress.masteredAt >= goal.since,
  }));

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        {notebook.title}
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
        復習モード（★をつけた単語のみ）
      </p>

      <div className="mt-8 w-full">
        <StudyDeck
          notebookId={notebook.id}
          columns={columns}
          cards={cards}
          dailyGoal={goal.dailyGoal}
          masteredToday={goal.masteredToday}
        />
      </div>
    </main>
  );
}
