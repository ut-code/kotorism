import { useEffect, useMemo, useState } from "react";

import { CheckboxPicker } from "@/components/practice/CheckboxPicker";
import {
  AUDIO_OPTIONS,
  ChoiceChips,
  SettingRow,
  SpeakButton,
} from "@/components/practice/PracticeControls";
import { Quiz, QuizEmpty } from "@/components/practice/Quiz";
import { AccentKeyHint } from "@/components/practice/SpecialCharPalette";
import { apiPost } from "@/lib/shared/api-client";
import {
  tenseKey,
  type SixForms,
  type TenseOption,
  type VerbLike,
} from "@/lib/shared/conjugation/shared";
import { PRACTICE_LANGUAGES, type PracticeLanguageSlug } from "@/lib/shared/practice-languages";

// 言語ごとに異なる部分（人称・時制・活用エンジン・発音・入力ボタン）をまとめた設定。
// 新しい言語を追加するときは、この形にそって lib/conjugation/<lang>/config.ts を作る
export interface ConjugationLanguageConfig<V extends VerbLike, T> {
  // 特殊文字の切り替え（lib/practice-languages.ts）と、セクション単位の苦手管理で使う言語スラッグ
  languageSlug: PracticeLanguageSlug;
  persons: readonly string[];
  // 出題する動詞をまとめて選ぶためのグループ（例: 規則動詞・不規則動詞）。省略するとグループ選択は出ない
  verbGroups?: { label: string; match: (verb: V) => boolean }[];
  tenseOptions: TenseOption[];
  buildConjugation: (verb: V) => T;
  formsFor: (table: T, mood: string, tense: string) => SixForms;
  speak: (text: string, handlers: { onEnd?: () => void; onError?: () => void }) => boolean;
  // 入力欄の下に並べる特殊文字のボタン
  toolbarChars: string[];
  inputPlaceholder: string;
}

interface Question {
  id: string;
  infinitive: string;
  meaning: string;
  tenseLabel: string;
  person: string;
  answer: string;
}

interface ConjugationPracticeProps<V extends VerbLike, T> {
  verbs: V[];
  language: ConjugationLanguageConfig<V, T>;
  // このドリルが属するセクションスラッグ（例: "03"）。省略すると進捗を記録しない
  sectionSlug?: string;
}

// 動詞の活用練習。動詞と時制・法を選び、人称に合わせた活用形を入力する
export function ConjugationPractice<V extends VerbLike, T>({
  verbs,
  language,
  sectionSlug,
}: ConjugationPracticeProps<V, T>) {
  const {
    languageSlug,
    persons,
    verbGroups,
    tenseOptions,
    buildConjugation,
    formsFor,
    speak,
    toolbarChars,
    inputPlaceholder,
  } = language;
  const practiceLanguage = PRACTICE_LANGUAGES[languageSlug];

  const [selectedVerbIds, setSelectedVerbIds] = useState<Set<string>>(
    () => new Set(verbs.map((v) => v.id)),
  );
  const [selectedTenseKeys, setSelectedTenseKeys] = useState<Set<string>>(
    () => new Set(tenseOptions.map((t) => tenseKey(t.mood, t.tense))),
  );
  const [audio, setAudio] = useState<"on" | "off">("on");
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const conjugationById = useMemo(
    () => new Map(verbs.map((v) => [v.id, buildConjugation(v)])),
    [verbs, buildConjugation],
  );

  // 選んだ動詞 × 時制・法 × 人称のすべての組み合わせ
  const pool = useMemo(() => {
    const questions: Question[] = [];
    const tenses = tenseOptions.filter((t) => selectedTenseKeys.has(tenseKey(t.mood, t.tense)));
    for (const verb of verbs) {
      if (!selectedVerbIds.has(verb.id)) continue;
      const table = conjugationById.get(verb.id);
      if (!table) continue;
      for (const t of tenses) {
        formsFor(table, t.mood, t.tense).forEach((answer, personIndex) => {
          questions.push({
            id: `${verb.id}.${t.mood}.${t.tense}.${personIndex}`,
            infinitive: verb.infinitive,
            meaning: verb.meaning,
            tenseLabel: t.label,
            person: persons[personIndex],
            answer,
          });
        });
      }
    }
    return questions;
  }, [verbs, tenseOptions, persons, conjugationById, formsFor, selectedVerbIds, selectedTenseKeys]);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const speakAnswer = (text: string) => {
    const started = speak(text, {
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    if (started) setSpeaking(true);
  };

  if (verbs.length === 0) return <QuizEmpty />;

  return (
    <Quiz
      pool={pool}
      emptyMessage="動詞と時制・法を1つ以上選んでください。"
      countOptions={["5", "10", "20"]}
      lang={practiceLanguage.lang}
      settings={
        <>
          <CheckboxPicker
            title="出題する動詞"
            unit="語"
            items={verbs.map((v) => ({ id: v.id, label: v.infinitive, sub: v.meaning }))}
            selected={selectedVerbIds}
            onChange={setSelectedVerbIds}
            groups={verbGroups?.map((group) => ({
              label: group.label,
              ids: verbs.filter(group.match).map((v) => v.id),
            }))}
            searchPlaceholder="動詞を検索（原形・意味）"
            labelLang={practiceLanguage.lang}
          />
          <CheckboxPicker
            title="出題する時制・法"
            unit="個"
            items={tenseOptions.map((t) => ({ id: tenseKey(t.mood, t.tense), label: t.label }))}
            selected={selectedTenseKeys}
            onChange={setSelectedTenseKeys}
            labelClassName=""
          />
          <SettingRow label="音声">
            <ChoiceChips
              label="音声読み上げ"
              options={AUDIO_OPTIONS}
              value={audio}
              onChange={setAudio}
            />
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              答え合わせのときに、正解の活用形を読み上げます。
            </p>
          </SettingRow>
        </>
      }
      mode={{
        kind: "typing",
        accentCycles: practiceLanguage.accentCycles,
        toolbarChars,
        hint: <AccentKeyHint language={practiceLanguage} />,
        placeholder: inputPlaceholder,
      }}
      instruction="人称に合わせた活用形を入力してください"
      renderPrompt={(q) => (
        <>
          <span className="inline-block rounded-full bg-tealblue-50 px-3 py-1 text-xs font-bold text-tealblue-700 dark:bg-tealblue-950/50 dark:text-tealblue-300">
            {q.tenseLabel}
          </span>
          <p
            lang={practiceLanguage.lang}
            className="mt-4 text-4xl font-bold text-zinc-900 dark:text-zinc-50"
          >
            {q.infinitive}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{q.meaning}</p>
          <p
            lang={practiceLanguage.lang}
            className="mt-5 text-2xl font-semibold text-zinc-700 dark:text-zinc-200"
          >
            {q.person} …
          </p>
        </>
      )}
      renderMistakePrompt={(q) => (
        <>
          <span lang={practiceLanguage.lang} className="font-semibold">
            {q.infinitive}
          </span>
          <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
            {q.tenseLabel} ・ <span lang={practiceLanguage.lang}>{q.person}</span>
          </span>
        </>
      )}
      renderFeedbackExtra={(q) => (
        <SpeakButton speaking={speaking} onClick={() => speakAnswer(q.answer)} />
      )}
      onAnswered={(q, correct) => {
        if (audio === "on") speakAnswer(q.answer);
        // セクション単位の苦手管理: 1問答えるたびに反映する（未ログインならサーバー側で何もしない）
        if (sectionSlug) {
          apiPost("/api/learn", {
            intent: "quizAnswer",
            language: languageSlug,
            sectionSlug,
            correct,
          }).catch(() => {});
        }
      }}
      onLeaveQuestion={stopSpeaking}
    />
  );
}
