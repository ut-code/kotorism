// 単語帳の表をまとめて編集するとき（intent=updateCards）の入力欄の名前。
// 1つの単語の入力欄（head・row:番号:列名。1件ずつ追加するときと同じ）の前に `card:<単語のid>:` を付けて、
// 全部の単語を1つのフォームで送る。サーバー側は単語ごとに元の名前へ戻して、1件ずつの更新と同じ読み取り方をする
export function bulkCardFieldName(cardId: string, field: string): string {
  return `card:${cardId}:${field}`;
}

// まとめて送られた入力欄から、1つの単語ぶんだけを元の名前で取り出す
export function pickCardFields(formData: FormData, cardId: string): FormData {
  const prefix = bulkCardFieldName(cardId, "");
  const picked = new FormData();
  for (const [name, value] of formData.entries()) {
    if (name.startsWith(prefix)) picked.append(name.slice(prefix.length), value);
  }
  return picked;
}

// まとめて編集中に足した新しい行のうち、何も入力されていない行か。保存のときは単語にせず飛ばす
export function isBlankCardFields(fields: FormData): boolean {
  return [...fields.values()].every((value) => typeof value === "string" && value.trim() === "");
}
