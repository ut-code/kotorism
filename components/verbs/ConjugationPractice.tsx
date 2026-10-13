"use client";

import { useEffect, useMemo, useState } from "react";
import { tenseKey, type SixForms, type TenseOption, type VerbLike } from "@/lib/conjugation/shared";
import { recordSectionQuizAnswer } from "@/lib/learn/actions";
import { AccentInput } from "@/components/verbs/AccentInput";

// 言語ごとに異なる部分（人称・時制・活用エンジン・発音・アクセント入力）をまとめた設定。
// 新しい言語を追加するときは、この形にそって lib/conjugation/<lang>/config.ts を作る
export interface ConjugationLanguageConfig<V extends VerbLike, T> {
  // セクション単位の苦手管理（lib/learn/actions.ts）で使う言語スラッグ。省略した言語では進捗を記録しない
  languageSlug?: string;
  persons: readonly string[];
  // 出題する動詞をまとめて選ぶためのグループ（例: 規則動詞・不規則動詞）。省略するとグループ選択は出ない
  verbGroups?: { label: string; match: (verb: V) => boolean }[];
  tenseOptions: TenseOption[];
  buildConjugation: (verb: V) => T;
  formsFor: (table: T, mood: string, tense: string) => SixForms;
  speak: (text: string, handlers: { onEnd?: () => void; onError?: () => void }) => boolean;
  accentCycles: string[][];
  toolbarChars: string[];
  inputPlaceholder: string;
}

interface Question {
  verbId: string;
  infinitive: string;
  meaning: string;
  mood: string;
  tense: string;
  tenseLabel: string;
  personIndex: number;
  answer: string;
}

function normalize(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, " ");
}

interface ConjugationPracticeProps<V extends VerbLike, T> {
  verbs: V[];
  language: ConjugationLanguageConfig<V, T>;
  // このドリルが属するセクションスラッグ（例: "01"）。省略すると進捗を記録しない
  sectionSlug?: string;
}

export function ConjugationPractice<V extends VerbLike, T>({
  verbs,
  language,
  sectionSlug,
}: ConjugationPracticeProps<V, T>) {
  const {
    persons,
    verbGroups,
    tenseOptions,
    buildConjugation,
    formsFor,
    speak,
    accentCycles,
    toolbarChars,
    inputPlaceholder,
  } = language;

  const conjugationById = useMemo(
    () => new Map(verbs.map((v) => [v.id, buildConjugation(v)])),
    [verbs, buildConjugation],
  );
  const [phase, setPhase] = useState<"settings" | "practice">("settings");
  const [selectedVerbIds, setSelectedVerbIds] = useState<Set<string>>(
    () => new Set(verbs.map((v) => v.id)),
  );
  // 動詞一覧の絞り込み文字列。原形と意味（日本語）のどちらにも部分一致する
  const [verbQuery, setVerbQuery] = useState("");
  const [selectedTenseKeys, setSelectedTenseKeys] = useState<Set<string>>(
    () => new Set(tenseOptions.map((t) => tenseKey(t.mood, t.tense))),
  );

  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [recentKeys, setRecentKeys] = useState<string[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const toggleAudio = () => setAudioEnabled((prev) => !prev);

  const selectedVerbs = useMemo(
    () => verbs.filter((v) => selectedVerbIds.has(v.id)),
    [verbs, selectedVerbIds],
  );
  const selectedTenses = useMemo(
    () => tenseOptions.filter((t) => selectedTenseKeys.has(tenseKey(t.mood, t.tense))),
    [tenseOptions, selectedTenseKeys],
  );

  const toggleVerb = (id: string) => {
    setSelectedVerbIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTense = (key: string) => {
    setSelectedTenseKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const generateQuestion = (
    verbPool = selectedVerbs,
    tensePool = selectedTenses,
    history = recentKeys,
  ) => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    if (verbPool.length === 0 || tensePool.length === 0) return;

    const candidates: Question[] = [];
    for (const verb of verbPool) {
      const table = conjugationById.get(verb.id);
      if (!table) continue;
      for (const t of tensePool) {
        for (let personIndex = 0; personIndex < 6; personIndex++) {
          candidates.push({
            verbId: verb.id,
            infinitive: verb.infinitive,
            meaning: verb.meaning,
            mood: t.mood,
            tense: t.tense,
            tenseLabel: t.label,
            personIndex,
            answer: formsFor(table, t.mood, t.tense)[personIndex],
          });
        }
      }
    }
    if (candidates.length === 0) return;

    const keyOf = (q: Question) => `${q.verbId}.${q.mood}.${q.tense}.${q.personIndex}`;
    let pool = candidates.filter((q) => !history.includes(keyOf(q)));
    if (pool.length === 0) pool = candidates;

    const next = pool[Math.floor(Math.random() * pool.length)];
    setRecentKeys((prev) => [keyOf(next), ...prev].slice(0, 8));
    setQuestion(next);
    setAnswer("");
    setSubmitted(false);
    setIsCorrect(false);
  };

  const startPractice = () => {
    setScore({ correct: 0, total: 0 });
    setRecentKeys([]);
    setPhase("practice");
    generateQuestion(selectedVerbs, selectedTenses, []);
  };

  const speakAnswer = () => {
    if (!question) return;
    const started = speak(question.answer, {
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    if (started) setSpeaking(true);
  };

  const handleSubmit = () => {
    if (!question) return;
    if (!submitted) {
      const correct = normalize(answer) === normalize(question.answer);
      setIsCorrect(correct);
      setSubmitted(true);
      setScore((prev) => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
      if (audioEnabled) speakAnswer();

      // セクション単位の苦手管理: 1問答えるたびに反映する（未ログインならサーバー側で何もしない）
      if (sectionSlug && language.languageSlug) {
        recordSectionQuizAnswer(language.languageSlug, sectionSlug, correct).catch(() => {});
      }
    } else {
      generateQuestion();
    }
  };

  // 絞り込み中は、表示されている動詞だけを一括で選択・解除する（絞り込みが無ければ全件が対象）
  const normalizedQuery = verbQuery.trim().toLowerCase();
  const visibleVerbs = useMemo(
    () =>
      normalizedQuery
        ? verbs.filter(
            (v) =>
              v.infinitive.toLowerCase().includes(normalizedQuery) ||
              v.meaning.toLowerCase().includes(normalizedQuery),
          )
        : verbs,
    [verbs, normalizedQuery],
  );
  const setVerbsSelected = (targets: V[], on: boolean) =>
    setSelectedVerbIds((prev) => {
      const next = new Set(prev);
      for (const v of targets) {
        if (on) next.add(v.id);
        else next.delete(v.id);
      }
      return next;
    });
  const setAllVerbs = (on: boolean) => setVerbsSelected(visibleVerbs, on);
  const setAllTenses = (on: boolean) =>
    setSelectedTenseKeys(
      on ? new Set(tenseOptions.map((t) => tenseKey(t.mood, t.tense))) : new Set(),
    );

  if (phase === "settings") {
    const canStart = selectedVerbIds.size > 0 && selectedTenseKeys.size > 0;
    return (
      <div className="space-y-10">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-base font-bold text-zinc-800 dark:text-zinc-100">
              出題する動詞
              <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                {selectedVerbIds.size} / {verbs.length} 語を選択中
              </span>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                type="button"
                onClick={() => setAllVerbs(true)}
                className="text-tealblue-600 hover:underline dark:text-tealblue-400"
              >
                {normalizedQuery ? "表示中を全て選択" : "全て選択"}
              </button>
              <button
                type="button"
                onClick={() => setAllVerbs(false)}
                className="text-tealblue-600 hover:underline dark:text-tealblue-400"
              >
                {normalizedQuery ? "表示中を全て解除" : "全て解除"}
              </button>
            </div>
          </div>
          {verbGroups && (
            <div className="mb-3 flex flex-wrap gap-2">
              {verbGroups.map((group) => {
                const members = verbs.filter(group.match);
                const allSelected =
                  members.length > 0 && members.every((v) => selectedVerbIds.has(v.id));
                return (
                  <button
                    key={group.label}
                    type="button"
                    onClick={() => setVerbsSelected(members, !allSelected)}
                    aria-pressed={allSelected}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                      allSelected
                        ? "bg-tealblue-600 text-white hover:bg-tealblue-700"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {group.label}（{members.length}）
                  </button>
                );
              })}
            </div>
          )}
          <input
            type="search"
            value={verbQuery}
            onChange={(e) => setVerbQuery(e.target.value)}
            placeholder="動詞を検索（原形・意味）"
            aria-label="動詞を検索"
            className="mb-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-tealblue-400 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {visibleVerbs.map((v) => (
              <label
                key={v.id}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm transition-colors hover:border-tealblue-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-tealblue-600"
              >
                <input
                  type="checkbox"
                  checked={selectedVerbIds.has(v.id)}
                  onChange={() => toggleVerb(v.id)}
                  className="h-4 w-4 accent-tealblue-600"
                />
                <span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    {v.infinitive}
                  </span>
                  <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">{v.meaning}</span>
                </span>
              </label>
            ))}
          </div>
          {visibleVerbs.length === 0 && (
            <div className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              「{verbQuery.trim()}」に一致する動詞がありません。
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-base font-bold text-zinc-800 dark:text-zinc-100">
              出題する時制・法
            </div>
            <div className="flex gap-3 text-sm">
              <button
                type="button"
                onClick={() => setAllTenses(true)}
                className="text-tealblue-600 hover:underline dark:text-tealblue-400"
              >
                全て選択
              </button>
              <button
                type="button"
                onClick={() => setAllTenses(false)}
                className="text-tealblue-600 hover:underline dark:text-tealblue-400"
              >
                全て解除
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {tenseOptions.map((t) => {
              const key = tenseKey(t.mood, t.tense);
              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm transition-colors hover:border-tealblue-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-tealblue-600"
                >
                  <input
                    type="checkbox"
                    checked={selectedTenseKeys.has(key)}
                    onChange={() => toggleTense(key)}
                    className="h-4 w-4 accent-tealblue-600"
                  />
                  <span className="text-zinc-800 dark:text-zinc-100">{t.label}</span>
                </label>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/50">
            <div>
              <div className="font-bold text-zinc-800 dark:text-zinc-100">音声読み上げ</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                答え合わせのときに、正解の活用形を自動で読み上げます。
              </div>
            </div>
            <button
              type="button"
              onClick={toggleAudio}
              aria-pressed={audioEnabled}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                audioEnabled
                  ? "bg-tealblue-600 text-white hover:bg-tealblue-700"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {audioEnabled ? "🔊 音声オン" : "🔇 音声オフ"}
            </button>
          </div>
        </section>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={startPractice}
            disabled={!canStart}
            className="rounded-full bg-tealblue-600 px-10 py-3 font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-tealblue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            練習を始める
          </button>
        </div>
        {!canStart && (
          <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            動詞と時制・法を1つ以上選んでください。
          </div>
        )}
      </div>
    );
  }

  if (!question) {
    return (
      <div className="py-16 text-center text-zinc-500 dark:text-zinc-400">
        <div>出題できる組み合わせがありません。設定を見直してください。</div>
        <button
          type="button"
          onClick={() => setPhase("settings")}
          className="mt-4 text-tealblue-600 hover:underline dark:text-tealblue-400"
        >
          設定に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <button
          type="button"
          onClick={() => setPhase("settings")}
          className="text-tealblue-600 hover:underline dark:text-tealblue-400"
        >
          設定に戻る
        </button>
        <span>
          正解: {score.correct} / {score.total}
        </span>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900/50">
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="rounded-full bg-tealblue-50 px-3 py-1 text-xs font-bold text-tealblue-700 dark:bg-tealblue-900/30 dark:text-tealblue-300">
            {question.tenseLabel}
          </span>
        </div>

        <div className="mb-6 text-center">
          <div className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            {question.infinitive}
          </div>
          <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{question.meaning}</div>
        </div>

        <div className="mb-4 text-center">
          <span className="rounded-full border border-zinc-300 px-4 py-1 text-lg font-semibold text-zinc-700 dark:border-zinc-600 dark:text-zinc-200">
            {persons[question.personIndex]}
          </span>
        </div>

        <AccentInput
          value={answer}
          onChange={setAnswer}
          onSubmit={handleSubmit}
          disabled={submitted}
          autoFocus
          placeholder={inputPlaceholder}
          accentCycles={accentCycles}
          toolbarChars={toolbarChars}
          className={`w-full rounded-xl border-2 px-4 py-3 text-center text-xl font-medium text-zinc-800 outline-none transition-colors dark:text-zinc-100 ${
            !submitted
              ? "border-zinc-200 bg-white focus:border-tealblue-400 dark:border-zinc-700 dark:bg-zinc-800"
              : isCorrect
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-red-500 bg-red-50 dark:bg-red-900/20"
          }`}
        />

        {submitted && (
          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            {isCorrect ? (
              <div className="font-bold text-emerald-600 dark:text-emerald-400">正解！</div>
            ) : (
              <div className="font-bold text-red-600 dark:text-red-400">
                不正解 — 正解は「{question.answer}」
              </div>
            )}
            <button
              type="button"
              onClick={speakAnswer}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-tealblue-400 hover:text-tealblue-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-tealblue-500 dark:hover:text-tealblue-400"
            >
              {speaking ? "🔊 再生中…" : "🔊 発音を聞く"}
            </button>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-full bg-tealblue-600 px-8 py-3 font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-tealblue-700"
          >
            {submitted ? "次の問題へ" : "答え合わせ"}
          </button>
        </div>
      </div>
    </div>
  );
}
