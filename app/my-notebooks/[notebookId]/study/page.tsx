import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getNotebookRole } from "@/lib/notebook-access";
import StudyDeck from "./StudyDeck";
import { normalizeCardData } from "@/lib/card-data";
import { normalizeColumns } from "@/lib/notebook-columns";
import { getStudyGoalSummary } from "@/lib/study-goal";

// DBの最新状態を常に表示するため、ビルド時の静的プリレンダリングを避けてリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

export default async function StudyPage(props: PageProps<"/my-notebooks/[notebookId]/study">) {
  const user = await requireUser();
  const { notebookId } = await props.params;

  // 作成者・共同編集者（編集可/閲覧のみ）のいずれでもなければ404にする
  const role = await getNotebookRole(notebookId, user.id);
  if (!role) {
    notFound();
  }

  // 単語帳と、その中のカードをposition昇順（表側の並び順）で取得する
  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    include: { cards: { orderBy: { position: "asc" } } },
  });

  // 暗記するカードが1件も無い状態では学習モードが成立しないため、
  // 単語帳のトップページ（追加フォームがある場所）へ差し戻す
  if (notebook.cards.length === 0) {
    redirect(`/my-notebooks/${notebook.id}`);
  }

  // ★・暗記モード表示回数はユーザーごとに独立しているため、自分の進捗だけを取得してカードにマージする
  const progressRows = await prisma.cardProgress.findMany({
    where: { userId: user.id, card: { notebookId } },
  });
  const progressByCardId = new Map(progressRows.map((progress) => [progress.cardId, progress]));
  const goal = await getStudyGoalSummary(user.id);

  // シャッフルやフリップ等のインタラクションはすべてクライアント側のStudyDeckが担当するため、
  // ここではサーバーでDBから取得したデータをそのまま整形して渡すだけ
  const columns = normalizeColumns(notebook.columns);
  const cards = notebook.cards.map((card) => {
    const progress = progressByCardId.get(card.id);
    return {
      id: card.id,
      data: normalizeCardData(card.data),
      starred: progress?.starred ?? false,
      starCount: progress?.starCount ?? 0,
      viewCount: progress?.viewCount ?? 0,
      mastered: !!progress?.masteredAt,
      masteredToday: !!progress?.masteredAt && progress.masteredAt >= goal.since,
    };
  });

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        {notebook.title}
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">暗記学習モード</p>

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
