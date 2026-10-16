import { useState } from "react";
import { compareList, type CharacterCompare } from "./compare-data";

export default function HanziCompare() {
  // keyword: 検索ボックスに入力されている文字列
  const [keyword, setKeyword] = useState("");
  // selected: 今クリックして選んでいる単語(まだ何も選んでいなければ null)
  const [selected, setSelected] = useState<CharacterCompare | null>(null);
  // revealed: 「簡体字を表示」ボタンを押して、答えを見た状態かどうか
  const [revealed, setRevealed] = useState(false);

  // 検索欄の入力に応じて、一覧を絞り込む処理。
  // 日本語読み・拼音・意味のどれかに、入力した文字が含まれていれば表示対象にする。
  // 検索欄が空のときは、絞り込まず全件表示する。
  const filteredList = compareList.filter((item) => {
    const target = keyword.trim().toLowerCase();
    if (target === "") return true;
    return (
      item.reading.includes(target) ||
      item.pinyin.toLowerCase().includes(target) ||
      item.meaning.includes(target)
    );
  });

  // 一覧から単語がクリックされたときの処理。
  // 選んだ単語を記録し、答え(簡体字)はまだ見せない状態(revealed: false)に戻す。
  function handleSelect(item: CharacterCompare) {
    setSelected(item);
    setRevealed(false);
  }

  return (
    <div className="mt-8 w-full max-w-3xl">
      {/* 検索ボックス。日本語読みまたは拼音で入力できる */}
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="日本語読み または 拼音 で検索"
        className="w-full rounded-xl border p-3"
      />

      {/* 検索結果の一覧。ボタンをクリックすると、その単語が選択される */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filteredList.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSelect(item)}
            // 選んでいる単語は色を変えて、どれを選んだか分かるようにする
            className={`rounded-xl border p-3 text-left transition-colors ${
              selected?.id === item.id
                ? "border-tealblue-500 bg-tealblue-50 text-tealblue-700 dark:border-tealblue-500 dark:bg-tealblue-900/30 dark:text-tealblue-300"
                : "border-zinc-200 bg-white hover:border-tealblue-300 dark:border-zinc-700 dark:bg-zinc-900/50"
            }`}
          >
            <span className="text-2xl">{item.japanese}</span>
            <span className="ml-2 text-sm text-zinc-500">{item.meaning}</span>
          </button>
        ))}
      </div>

      {/* 単語が選ばれているときだけ、下に詳細エリアを表示する */}
      {selected && (
        <div className="mt-8 rounded-2xl border p-6">
          <p className="text-sm text-zinc-500">
            {selected.pinyin} / {selected.meaning}
          </p>

          {/* まだ答えを見ていない場合: 日本語の漢字だけを大きく表示し、
              「簡体字を書こう」と促す */}
          {!revealed ? (
            <div className="mt-4 text-center">
              <p className="mb-2">簡体字を書こう</p>
              <p className="text-6xl font-bold">{selected.japanese}</p>
              <button onClick={() => setRevealed(true)} className="mt-4 underline">
                簡体字を表示
              </button>
            </div>
          ) : (
            /* 答えを見た後: 日本語の漢字と簡体字を、横に並べて大きく比較表示し、
               その下に違いを説明する文章を表示する */
            <div className="mt-4">
              <div className="flex items-center justify-center gap-12">
                <div className="text-center">
                  <p className="text-sm text-zinc-500">日本語</p>
                  <p className="text-6xl font-bold">{selected.japanese}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-zinc-500">簡体字</p>
                  <p className="text-6xl font-bold">{selected.simplified}</p>
                </div>
              </div>
              <p className="mt-6 text-center text-sm text-zinc-600">{selected.difference}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
