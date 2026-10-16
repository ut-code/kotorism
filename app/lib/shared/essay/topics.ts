// 作文セクションの事前用意お題（言語ごとに数個）。
// お題文はどの言語で書く場合も日本語の指示文で統一し、targetWordCountはその言語で書く際の目安の字数。
// ここに項目を追加していけば、そのまま各言語の作文ページの選択肢に反映される。

export interface EssayTopic {
  id: string;
  prompt: string;
  targetWordCount: number;
}

const COMMON_TOPICS: EssayTopic[] = [
  {
    id: "self-introduction",
    prompt: "名前・出身・年齢・趣味など、自己紹介の文章を書いてください。",
    targetWordCount: 40,
  },
  {
    id: "daily-routine",
    prompt:
      "あなたのある1日の生活（起きる時間、学校や仕事ですること、夜にすることなど）について書いてください。",
    targetWordCount: 60,
  },
  {
    id: "favorite-food",
    prompt: "好きな食べ物と、それが好きな理由について書いてください。",
    targetWordCount: 50,
  },
  {
    id: "weekend-plan",
    prompt: "今度の週末にしたいことについて、理由も含めて書いてください。",
    targetWordCount: 50,
  },
  {
    id: "favorite-season",
    prompt: "好きな季節と、その季節によくすることについて書いてください。",
    targetWordCount: 60,
  },
];

export const ESSAY_TOPICS: Record<string, EssayTopic[]> = {
  chinese: COMMON_TOPICS,
  french: COMMON_TOPICS,
  german: COMMON_TOPICS,
  spanish: COMMON_TOPICS,
};

export function getEssayTopics(language: string): EssayTopic[] {
  return ESSAY_TOPICS[language] ?? [];
}

export function getEssayTopic(language: string, topicId: string): EssayTopic | undefined {
  return getEssayTopics(language).find((topic) => topic.id === topicId);
}
