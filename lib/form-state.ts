// フォーム送信(route の action)の結果。error があれば入力欄の下に表示する。
// added: 直前に追加できた単語（見出し語）。連続登録時の成功表示に使う
export type FormState = { error?: string; added?: string };
