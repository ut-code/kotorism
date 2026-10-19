import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "@/components/Link";
import { useLocation } from "react-router";

import { apiGet, apiPost } from "@/lib/shared/api-client";
import { AccentTextarea } from "@/components/practice/AccentTextarea";
import { getPracticeLanguage } from "@/lib/shared/practice-languages";
import type { SubmitTranslationResult } from "@/lib/server/translation/actions.server";
import { ChoiceChips, PracticeButton, SettingRow } from "@/components/practice/PracticeControls";
import {
  getTranslationProblem,
  getTranslationProblems,
  getTranslationTopics,
} from "@/lib/shared/translation/problems";
import {
  CUSTOM_SOURCE_MAX_LENGTH,
  TRANSLATION_SCORE_DEFAULT,
  TRANSLATION_SCORE_OPTIONS,
  type TranslationDirection,
  type TranslationProblemSource,
  type TranslationSubmissionDTO,
} from "@/lib/shared/translation/types";

interface ResolvedProblem {
  source: TranslationProblemSource;
  problemId?: string;
  // プリセット問題の文法項目
  topic?: string;
  direction: TranslationDirection;
  sourceText: string;
  referenceTranslation: string | null;
}

interface TranslationPracticeProps {
  languageSlug: string;
  languageLabel: string;
}

function directionLabel(direction: TranslationDirection, languageLabel: string): string {
  return direction === "fromJapanese" ? `日本語 → ${languageLabel}` : `${languageLabel} → 日本語`;
}

// 文法項目を絞り込まないときの選択肢の値
const ALL_TOPICS = "all";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function TranslationPractice({ languageSlug, languageLabel }: TranslationPracticeProps) {
  const problems = getTranslationProblems(languageSlug);
  const topics = useMemo(() => getTranslationTopics(languageSlug), [languageSlug]);
  const practiceLanguage = getPracticeLanguage(languageSlug);

  const [status, setStatus] = useState<"loading" | "guest" | "ready">("loading");
  const [phase, setPhase] = useState<"settings" | "writing" | "result">("settings");
  const [topic, setTopic] = useState(ALL_TOPICS);
  const [direction, setDirection] = useState<TranslationDirection>("fromJapanese");
  const [problemSource, setProblemSource] = useState<TranslationProblemSource>("preset");
  const [scoreMax, setScoreMax] = useState<number>(TRANSLATION_SCORE_DEFAULT);

  const problemsForSelection = useMemo(
    () =>
      problems.filter(
        (p) => p.direction === direction && (topic === ALL_TOPICS || p.topic === topic),
      ),
    [problems, topic, direction],
  );
  const [selectedProblemId, setSelectedProblemId] = useState(problemsForSelection[0]?.id ?? "");
  const [customSourceText, setCustomSourceText] = useState("");

  const [activeProblem, setActiveProblem] = useState<ResolvedProblem | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [lastSubmission, setLastSubmission] = useState<TranslationSubmissionDTO | null>(null);
  const [history, setHistory] = useState<TranslationSubmissionDTO[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ isLoggedIn: boolean; submissions: TranslationSubmissionDTO[] }>("/api/translation", {
      language: languageSlug,
    }).then((result) => {
      if (cancelled) return;
      setHistory(result.submissions);
      setStatus(result.isLoggedIn ? "ready" : "guest");
    });
    return () => {
      cancelled = true;
    };
  }, [languageSlug]);

  // 文法項目・訳す方向を変えたら、絞り込んだ問題の先頭を選び直す
  const selectFirstProblem = (nextTopic: string, nextDirection: TranslationDirection) => {
    const first = problems.find(
      (p) => p.direction === nextDirection && (nextTopic === ALL_TOPICS || p.topic === nextTopic),
    );
    setSelectedProblemId(first?.id ?? "");
  };

  const selectTopic = (nextTopic: string) => {
    setTopic(nextTopic);
    selectFirstProblem(nextTopic, direction);
  };

  const selectDirection = (nextDirection: TranslationDirection) => {
    setDirection(nextDirection);
    selectFirstProblem(topic, nextDirection);
  };

  const canStart =
    problemSource === "preset" ? selectedProblemId !== "" : customSourceText.trim() !== "";

  const startWriting = () => {
    if (problemSource === "preset") {
      const problem = problemsForSelection.find((p) => p.id === selectedProblemId);
      if (!problem) return;
      setActiveProblem({
        source: "preset",
        problemId: problem.id,
        topic: problem.topic,
        direction: problem.direction,
        sourceText: problem.sourceText,
        referenceTranslation: problem.referenceTranslation,
      });
    } else {
      const sourceText = customSourceText.trim();
      if (!sourceText) return;
      setActiveProblem({
        source: "custom",
        direction,
        sourceText,
        referenceTranslation: null,
      });
    }
    setContent("");
    setError(null);
    setLastSubmission(null);
    setPhase("writing");
  };

  const backToSettings = () => {
    setPhase("settings");
  };

  const handleSubmit = () => {
    if (!activeProblem || pending) return;
    if (!content.trim()) {
      setError("訳文を入力してください。");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await apiPost<SubmitTranslationResult>("/api/translation", {
        language: languageSlug,
        problemSource: activeProblem.source,
        problemId: activeProblem.source === "preset" ? activeProblem.problemId : undefined,
        direction: activeProblem.source === "custom" ? activeProblem.direction : undefined,
        customSourceText: activeProblem.source === "custom" ? activeProblem.sourceText : undefined,
        content,
        scoreMax,
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setLastSubmission(result.submission);
      setHistory((prev) => [result.submission, ...prev]);
      setPhase("result");
    });
  };

  if (status === "loading") {
    return <div className="py-10 text-center text-sm text-zinc-400">読み込み中…</div>;
  }

  if (status === "guest") {
    return <TranslationLoginPrompt />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {phase === "settings" && (
        <>
          <div className="space-y-5">
            <SettingRow label="訳す方向">
              <ChoiceChips
                label="訳す方向"
                options={[
                  {
                    value: "fromJapanese",
                    label: directionLabel("fromJapanese", languageLabel),
                  },
                  {
                    value: "toJapanese",
                    label: directionLabel("toJapanese", languageLabel),
                  },
                ]}
                value={direction}
                onChange={selectDirection}
              />
            </SettingRow>
            <SettingRow label="題材">
              <ChoiceChips
                label="題材"
                options={[
                  { value: "preset", label: "問題から選ぶ" },
                  { value: "custom", label: "自分で用意する" },
                ]}
                value={problemSource}
                onChange={setProblemSource}
              />
            </SettingRow>
            {problemSource === "preset" && (
              <SettingRow label="文法項目">
                <ChoiceChips
                  label="文法項目"
                  options={[
                    { value: ALL_TOPICS, label: "すべて" },
                    ...topics.map((t) => ({ value: t, label: t })),
                  ]}
                  value={topic}
                  onChange={selectTopic}
                />
              </SettingRow>
            )}
            <SettingRow label="採点の満点">
              <select
                value={scoreMax}
                onChange={(event) => setScoreMax(Number(event.target.value))}
                className="w-40 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {TRANSLATION_SCORE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}点満点
                  </option>
                ))}
              </select>
            </SettingRow>
          </div>

          <section>
            {problemSource === "preset" ? (
              <div className="space-y-2">
                {problemsForSelection.map((problem) => (
                  <label
                    key={problem.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                      selectedProblemId === problem.id
                        ? "border-tealblue-400 bg-tealblue-50/60 dark:border-tealblue-600 dark:bg-tealblue-900/20"
                        : "border-zinc-200 bg-white hover:border-tealblue-300 dark:border-zinc-700 dark:bg-zinc-900/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="translation-problem"
                      className="mt-1 h-4 w-4 accent-tealblue-600"
                      checked={selectedProblemId === problem.id}
                      onChange={() => setSelectedProblemId(problem.id)}
                    />
                    <span className="block">
                      {topic === ALL_TOPICS && (
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                          {problem.topic}
                        </span>
                      )}
                      <span className="block text-zinc-800 dark:text-zinc-100">
                        {problem.sourceText}
                      </span>
                    </span>
                  </label>
                ))}
                {problemsForSelection.length === 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    この文法項目・方向の問題はまだ用意されていません。「自分で用意する」から始めてください。
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  原文（
                  {direction === "fromJapanese"
                    ? "日本語で入力してください"
                    : `${languageLabel}で入力してください`}
                  ）
                </label>
                <AccentTextarea
                  value={customSourceText}
                  onChange={setCustomSourceText}
                  // 外国語 → 日本語のときは、原文を外国語で入力する
                  language={direction === "toJapanese" ? practiceLanguage : undefined}
                  maxLength={CUSTOM_SOURCE_MAX_LENGTH}
                  rows={3}
                  placeholder={
                    direction === "fromJapanese"
                      ? "例: 明日は友達と映画を見に行く予定です。"
                      : `例: ${languageLabel}の文章を入力してください。`
                  }
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-tealblue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <div className="text-right text-xs text-zinc-400">
                  {customSourceText.length} / {CUSTOM_SOURCE_MAX_LENGTH}
                </div>
              </div>
            )}
          </section>

          <div className="flex justify-center">
            <PracticeButton onClick={startWriting} disabled={!canStart}>
              訳し始める
            </PracticeButton>
          </div>

          {history.length > 0 && (
            <TranslationHistory
              languageLabel={languageLabel}
              history={history}
              expandedId={expandedHistoryId}
              onToggle={(id) => setExpandedHistoryId((prev) => (prev === id ? null : id))}
            />
          )}
        </>
      )}

      {phase === "writing" && activeProblem && (
        <div className="space-y-6">
          <button
            type="button"
            onClick={backToSettings}
            className="text-sm text-tealblue-600 hover:underline dark:text-tealblue-400"
          >
            ← 設定に戻る
          </button>

          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-tealblue-600 dark:text-tealblue-400">
              {activeProblem.topic && `${activeProblem.topic} ／ `}
              {directionLabel(activeProblem.direction, languageLabel)}
            </div>
            <p className="text-zinc-800 dark:text-zinc-100">{activeProblem.sourceText}</p>

            <AccentTextarea
              value={content}
              onChange={setContent}
              // 日本語 → 外国語のときは、訳文を外国語で入力する
              language={activeProblem.direction === "fromJapanese" ? practiceLanguage : undefined}
              maxLength={500}
              rows={5}
              disabled={pending}
              placeholder={
                activeProblem.direction === "fromJapanese"
                  ? `ここに${languageLabel}で訳文を書いてください…`
                  : "ここに日本語で訳文を書いてください…"
              }
              className="mt-4 w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-base text-zinc-800 outline-none transition-colors focus:border-tealblue-400 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />

            {error && (
              <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={pending}
                className="rounded-full bg-tealblue-600 px-8 py-3 font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-tealblue-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {pending ? "AIが添削中…" : "AIに添削してもらう"}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "result" && lastSubmission && (
        <div className="space-y-6">
          <TranslationFeedbackCard languageLabel={languageLabel} submission={lastSubmission} />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setPhase("settings")}
              className="rounded-full bg-tealblue-600 px-8 py-3 font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-tealblue-700"
            >
              別の問題を訳す
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TranslationFeedbackCard({
  languageLabel,
  submission,
}: {
  languageLabel: string;
  submission: TranslationSubmissionDTO;
}) {
  const { feedback } = submission;
  // 文法項目は提出に保存していないので、プリセット問題の id から引く（問題が差し替えられていれば出さない）
  const topic = submission.problemId
    ? getTranslationProblem(submission.language, submission.problemId)?.topic
    : undefined;
  return (
    <div className="border-t border-zinc-200 pt-6 dark:border-zinc-700">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-tealblue-600 dark:text-tealblue-400">
          {topic && `${topic} ／ `}
          {directionLabel(submission.direction, languageLabel)}
        </div>
        <div className="rounded-full bg-tealblue-50 px-3 py-1 text-sm font-bold text-tealblue-700 dark:bg-tealblue-900/30 dark:text-tealblue-300">
          {feedback.score} / {feedback.max}点
        </div>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">原文: {submission.sourceText}</p>

      <p className="mt-2 whitespace-pre-wrap border-l-4 border-zinc-200 pl-3 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
        {submission.content}
      </p>

      {feedback.comment && (
        <div className="mt-4 rounded-xl bg-tealblue-50/60 p-3 text-sm text-zinc-700 dark:bg-tealblue-900/20 dark:text-zinc-200">
          {feedback.comment}
        </div>
      )}

      {submission.referenceTranslation && (
        <p className="mt-4 text-xs text-zinc-400">
          模範解答（一例）: {submission.referenceTranslation}
        </p>
      )}
    </div>
  );
}

function TranslationHistory({
  languageLabel,
  history,
  expandedId,
  onToggle,
}: {
  languageLabel: string;
  history: TranslationSubmissionDTO[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="text-base font-bold text-zinc-800 dark:text-zinc-100">これまでの提出履歴</div>
      <div className="space-y-2">
        {history.map((submission) => {
          const { feedback } = submission;
          const expanded = expandedId === submission.id;
          return (
            <div
              key={submission.id}
              className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/50"
            >
              <button
                type="button"
                onClick={() => onToggle(submission.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-zinc-800 dark:text-zinc-100">
                    {submission.sourceText}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {dateFormatter.format(new Date(submission.createdAt))}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-tealblue-50 px-2.5 py-1 text-xs font-bold text-tealblue-700 dark:bg-tealblue-900/30 dark:text-tealblue-300">
                  {feedback.score} / {feedback.max}
                </span>
              </button>
              {expanded && (
                <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
                  <TranslationFeedbackCard languageLabel={languageLabel} submission={submission} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TranslationLoginPrompt() {
  const { pathname } = useLocation();
  const redirectQuery = `redirect=${encodeURIComponent(pathname)}`;
  return (
    <div className="mx-auto max-w-sm py-6 text-center">
      <p className="text-base font-medium text-zinc-800 dark:text-zinc-100">
        ログインして、翻訳セクションを使ってみましょう！
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        AIによる添削結果を保存して、いつでも見返せるようになります。
      </p>
      <div className="mt-6 flex flex-col gap-2.5">
        <Link
          href={`/login?${redirectQuery}`}
          className="rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          ログイン
        </Link>
        <Link
          href={`/signup?${redirectQuery}`}
          className="rounded-full border border-black/[.08] px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          新規登録
        </Link>
      </div>
    </div>
  );
}
