import { useEffect, useState, useTransition } from "react";
import Link from "@/components/Link";
import { useLocation } from "react-router";

import { apiGet, apiPost } from "@/lib/shared/api-client";
import type { SubmitEssayResult } from "@/lib/server/essay/actions.server";
import { getEssayTopics } from "@/lib/shared/essay/topics";
import {
  countEssayLength,
  essayLengthGuideLabel,
  essayLengthUnitLabel,
  getEssayLengthUnit,
} from "@/lib/shared/essay/length";
import {
  CRITERION_MAX_MAX,
  CRITERION_MIN_MAX,
  DEFAULT_CRITERIA_MAX,
  ESSAY_CRITERIA,
  ESSAY_LENGTH_OPTIONS,
  type EssayCriteriaMax,
  type EssayCriterionKey,
  type EssayFeedback,
  type EssaySubmissionDTO,
  type EssayTopicSource,
} from "@/lib/shared/essay/types";

interface ResolvedTopic {
  source: EssayTopicSource;
  topicId?: string;
  prompt: string;
  targetWordCount: number;
}

interface EssayPracticeProps {
  languageSlug: string;
  languageLabel: string;
}

function totalOf(feedback: EssayFeedback): { score: number; max: number } {
  return ESSAY_CRITERIA.reduce(
    (acc, { key }) => ({
      score: acc.score + feedback[key].score,
      max: acc.max + feedback[key].max,
    }),
    { score: 0, max: 0 },
  );
}

const CRITERION_MAX_SELECT_OPTIONS = Array.from(
  { length: CRITERION_MAX_MAX - CRITERION_MIN_MAX + 1 },
  (_, i) => CRITERION_MIN_MAX + i,
);

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function EssayPractice({ languageSlug, languageLabel }: EssayPracticeProps) {
  const lengthUnit = getEssayLengthUnit(languageSlug);
  const unitLabel = essayLengthUnitLabel(lengthUnit);
  const topics = getEssayTopics(languageSlug);

  const [status, setStatus] = useState<"loading" | "guest" | "ready">("loading");
  const [phase, setPhase] = useState<"settings" | "writing" | "result">("settings");
  const [topicSource, setTopicSource] = useState<EssayTopicSource>("preset");
  const [selectedTopicId, setSelectedTopicId] = useState(topics[0]?.id ?? "");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customWordCount, setCustomWordCount] = useState(
    ESSAY_LENGTH_OPTIONS[Math.floor(ESSAY_LENGTH_OPTIONS.length / 2)],
  );
  const [criteriaMax, setCriteriaMax] = useState<EssayCriteriaMax>(DEFAULT_CRITERIA_MAX);

  const [activeTopic, setActiveTopic] = useState<ResolvedTopic | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [lastSubmission, setLastSubmission] = useState<EssaySubmissionDTO | null>(null);
  const [history, setHistory] = useState<EssaySubmissionDTO[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ isLoggedIn: boolean; submissions: EssaySubmissionDTO[] }>("/api/essay", {
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

  const setCriterionMax = (key: EssayCriterionKey, value: number) => {
    setCriteriaMax((prev) => ({ ...prev, [key]: value }));
  };

  const canStart = topicSource === "preset" ? selectedTopicId !== "" : customPrompt.trim() !== "";

  const startWriting = () => {
    const topic =
      topicSource === "preset" ? topics.find((t) => t.id === selectedTopicId) : undefined;

    if (topicSource === "preset") {
      if (!topic) return;
      setActiveTopic({
        source: "preset",
        topicId: topic.id,
        prompt: topic.prompt,
        targetWordCount: topic.targetWordCount,
      });
    } else {
      const prompt = customPrompt.trim();
      if (!prompt) return;
      setActiveTopic({ source: "custom", prompt, targetWordCount: customWordCount });
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
    if (!activeTopic || pending) return;
    if (!content.trim()) {
      setError("作文を入力してください。");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await apiPost<SubmitEssayResult>("/api/essay", {
        language: languageSlug,
        topicSource: activeTopic.source,
        topicId: activeTopic.topicId,
        customTopicPrompt: activeTopic.source === "custom" ? activeTopic.prompt : undefined,
        customTargetWordCount:
          activeTopic.source === "custom" ? activeTopic.targetWordCount : undefined,
        content,
        criteriaMax,
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
    return <EssayLoginPrompt />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {phase === "settings" && (
        <>
          <section className="space-y-4">
            <div className="text-base font-bold text-zinc-800 dark:text-zinc-100">お題</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTopicSource("preset")}
                className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                  topicSource === "preset"
                    ? "border-tealblue-500 bg-tealblue-50 text-tealblue-700 dark:border-tealblue-500 dark:bg-tealblue-900/30 dark:text-tealblue-300"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-tealblue-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300"
                }`}
              >
                お題から選ぶ
              </button>
              <button
                type="button"
                onClick={() => setTopicSource("custom")}
                className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                  topicSource === "custom"
                    ? "border-tealblue-500 bg-tealblue-50 text-tealblue-700 dark:border-tealblue-500 dark:bg-tealblue-900/30 dark:text-tealblue-300"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-tealblue-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300"
                }`}
              >
                自分でお題を決める
              </button>
            </div>

            {topicSource === "preset" ? (
              <div className="space-y-2">
                {topics.map((topic) => (
                  <label
                    key={topic.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                      selectedTopicId === topic.id
                        ? "border-tealblue-400 bg-tealblue-50/60 dark:border-tealblue-600 dark:bg-tealblue-900/20"
                        : "border-zinc-200 bg-white hover:border-tealblue-300 dark:border-zinc-700 dark:bg-zinc-900/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="essay-topic"
                      className="mt-1 h-4 w-4 accent-tealblue-600"
                      checked={selectedTopicId === topic.id}
                      onChange={() => setSelectedTopicId(topic.id)}
                    />
                    <span>
                      <span className="block text-zinc-800 dark:text-zinc-100">{topic.prompt}</span>
                      <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                        目安: {topic.targetWordCount}
                        {unitLabel}
                      </span>
                    </span>
                  </label>
                ))}
                {topics.length === 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    この言語にはまだお題が用意されていません。「自分でお題を決める」から始めてください。
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    お題（日本語で入力してください）
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(event) => setCustomPrompt(event.target.value)}
                    maxLength={200}
                    rows={2}
                    placeholder="例: 好きな映画について書いてください。"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-tealblue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {essayLengthGuideLabel(lengthUnit)}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ESSAY_LENGTH_OPTIONS.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setCustomWordCount(count)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          customWordCount === count
                            ? "border-tealblue-500 bg-tealblue-600 text-white"
                            : "border-zinc-200 text-zinc-600 hover:border-tealblue-300 dark:border-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {count}
                        {unitLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="text-base font-bold text-zinc-800 dark:text-zinc-100">
              採点基準ごとの配点（各{CRITERION_MIN_MAX}〜{CRITERION_MAX_MAX}点）
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ESSAY_CRITERIA.map(({ key, label }) => (
                <div
                  key={key}
                  className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700"
                >
                  <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {label}
                  </div>
                  <select
                    value={criteriaMax[key]}
                    onChange={(event) => setCriterionMax(key, Number(event.target.value))}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    {CRITERION_MAX_SELECT_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}点満点
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={startWriting}
              disabled={!canStart}
              className="rounded-full bg-tealblue-600 px-10 py-3 font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-tealblue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              書き始める
            </button>
          </div>

          {history.length > 0 && (
            <EssayHistory
              history={history}
              expandedId={expandedHistoryId}
              onToggle={(id) => setExpandedHistoryId((prev) => (prev === id ? null : id))}
            />
          )}
        </>
      )}

      {phase === "writing" && activeTopic && (
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
              お題
            </div>
            <p className="text-zinc-800 dark:text-zinc-100">{activeTopic.prompt}</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {languageLabel}で、目安{activeTopic.targetWordCount}
              {unitLabel}程度で書いてください。
            </p>

            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={2000}
              rows={8}
              disabled={pending}
              placeholder={`ここに${languageLabel}で作文を書いてください…`}
              className="mt-4 w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-base text-zinc-800 outline-none transition-colors focus:border-tealblue-400 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <div className="mt-1 text-right text-xs text-zinc-400">
              {countEssayLength(content, lengthUnit)}
              {unitLabel}
            </div>

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
          <EssayFeedbackCard submission={lastSubmission} />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setPhase("settings")}
              className="rounded-full bg-tealblue-600 px-8 py-3 font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-tealblue-700"
            >
              新しい作文を書く
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EssayFeedbackCard({ submission }: { submission: EssaySubmissionDTO }) {
  const total = totalOf(submission.feedback);
  return (
    <div className="border-t border-zinc-200 pt-6 dark:border-zinc-700">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-tealblue-600 dark:text-tealblue-400">
          お題: {submission.topicPrompt}
        </div>
        <div className="rounded-full bg-tealblue-50 px-3 py-1 text-sm font-bold text-tealblue-700 dark:bg-tealblue-900/30 dark:text-tealblue-300">
          {total.score} / {total.max}点
        </div>
      </div>

      <p className="whitespace-pre-wrap border-l-4 border-zinc-200 pl-3 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
        {submission.content}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ESSAY_CRITERIA.map(({ key, label }) => {
          const result = submission.feedback[key];
          return (
            <div key={key} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{label}</span>
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {result.score} / {result.max}点
                </span>
              </div>
              {result.comment && (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{result.comment}</p>
              )}
            </div>
          );
        })}
      </div>

      {submission.feedback.overallComment && (
        <div className="mt-4 rounded-xl bg-tealblue-50/60 p-3 text-sm text-zinc-700 dark:bg-tealblue-900/20 dark:text-zinc-200">
          {submission.feedback.overallComment}
        </div>
      )}
    </div>
  );
}

function EssayHistory({
  history,
  expandedId,
  onToggle,
}: {
  history: EssaySubmissionDTO[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="text-base font-bold text-zinc-800 dark:text-zinc-100">これまでの提出履歴</div>
      <div className="space-y-2">
        {history.map((submission) => {
          const total = totalOf(submission.feedback);
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
                    {submission.topicPrompt}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {dateFormatter.format(new Date(submission.createdAt))}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-tealblue-50 px-2.5 py-1 text-xs font-bold text-tealblue-700 dark:bg-tealblue-900/30 dark:text-tealblue-300">
                  {total.score} / {total.max}
                </span>
              </button>
              {expanded && (
                <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
                  <EssayFeedbackCard submission={submission} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EssayLoginPrompt() {
  const { pathname } = useLocation();
  const redirectQuery = `redirect=${encodeURIComponent(pathname)}`;
  return (
    <div className="mx-auto max-w-sm py-6 text-center">
      <p className="text-base font-medium text-zinc-800 dark:text-zinc-100">
        ログインして、作文セクションを使ってみましょう！
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
