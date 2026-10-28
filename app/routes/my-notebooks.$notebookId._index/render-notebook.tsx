import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";
import { createRoutesStub } from "react-router";

import { prisma } from "@/lib/server/prisma.server";

import NotebookPage, { action, loader } from "./route";

// 単語帳のページのテスト用。本物の loader・action をインメモリ DB につないで描画する。
// ブラウザ・サーバーを立てずに、表の操作から保存・再取得までを確かめられる。
// そうしないと1画面の操作でも e2e に頼ることになり、CI が遅くなる。
// 使う側のテストでは requireUser と recordNotebookView を vi.mock で差し替える(vi.mock はファイルごとにしか効かない)

type Row = Record<string, string>;

export async function seedNotebook(
  notebookId: string,
  { columns, cards }: { columns?: string[]; cards: [head: string, ...rows: Row[]][] },
) {
  if (columns) await prisma.notebook.update({ where: { id: notebookId }, data: { columns } });
  await prisma.card.createMany({
    data: cards.map(([head, ...rows], position) => ({
      notebookId,
      position,
      data: { head, rows },
    })),
  });
}

export async function savedCards(notebookId: string) {
  const cards = await prisma.card.findMany({ where: { notebookId }, orderBy: { position: "asc" } });
  return cards.map((card) => card.data as { head: string; rows: Row[] });
}

// search は一覧の「新しい単語帳」から開いたときの ?new=1 など
export async function renderNotebook(notebookId: string, search = "") {
  const Stub = createRoutesStub([
    {
      path: "/my-notebooks/:notebookId",
      Component: NotebookPage as ComponentType,
      loader: loader as never,
      action: action as never,
    },
  ]);
  render(<Stub initialEntries={[`/my-notebooks/${notebookId}${search}`]} />);
  // ページ下の「単語を追加」フォームの中にも表があるため、単語帳の表（最初の表）に絞る
  const tableElement = (await screen.findAllByRole("table"))[0];
  return { user: userEvent.setup(), table: within(tableElement), tableElement };
}
