// 翻訳セクションの事前用意問題（言語ごと・級ごとに10問＝方向ごとに5問）。
// levelは、その言語の検定試験（中検・仏検・独検・西検）の級に語彙・文法レベルを合わせている。
// ここに項目を追加していけば、そのまま各言語の翻訳ページの選択肢に反映される。

import type { TranslationDirection } from "./types";

export interface TranslationProblem {
  id: string;
  direction: TranslationDirection;
  // 対応する検定試験の名称・級（例: "仏検5級"）
  level: string;
  // 訳す対象の原文（fromJapaneseなら日本語、toJapaneseならその言語）
  sourceText: string;
  // 模範解答（AIによる採点の参考として使う）
  referenceTranslation: string;
}

// 1つの級につき、外国語→日本語・日本語→外国語をそれぞれ5問ずつ持つ「種データ」。
// [原文, 模範解答] のタプル配列で持つことで、大量の級×問題を見通しよく管理する。
interface LevelSeed {
  levelSlug: string;
  level: string;
  toJapanese: [string, string][];
  fromJapanese: [string, string][];
}

function buildProblems(
  toJapanesePrefix: string,
  fromJapanesePrefix: string,
  seeds: LevelSeed[],
): TranslationProblem[] {
  const problems: TranslationProblem[] = [];
  for (const seed of seeds) {
    seed.toJapanese.forEach(([sourceText, referenceTranslation], i) => {
      problems.push({
        id: `${toJapanesePrefix}-${seed.levelSlug}-${String(i + 1).padStart(2, "0")}`,
        direction: "toJapanese",
        level: seed.level,
        sourceText,
        referenceTranslation,
      });
    });
    seed.fromJapanese.forEach(([sourceText, referenceTranslation], i) => {
      problems.push({
        id: `${fromJapanesePrefix}-${seed.levelSlug}-${String(i + 1).padStart(2, "0")}`,
        direction: "fromJapanese",
        level: seed.level,
        sourceText,
        referenceTranslation,
      });
    });
  }
  return problems;
}

// ------------------------------------------------------------------
// 中国語（中検: 準4級・4級・3級・2級・準1級・1級）
// ------------------------------------------------------------------

const CHINESE_SEEDS: LevelSeed[] = [
  {
    levelSlug: "jun4kyu",
    level: "中検準4級",
    toJapanese: [
      [
        "你好，我姓田中，是日本人，今年二十岁。",
        "こんにちは、私は田中といいます。日本人で、今年20歳です。",
      ],
      ["我有一个哥哥和一个姐姐。", "私には兄が一人と姉が一人います。"],
      ["今天天气很好，我很喜欢春天。", "今日はいい天気です。私は春が好きです。"],
      ["星期天，我和朋友们一起运动。", "日曜日に、私は友達とスポーツをします。"],
      ["我妈妈是老师，我爸爸是医生。", "私の母は教師で、父は医者です。"],
    ],
    fromJapanese: [
      ["私は学生です。毎日学校で中国語を勉強しています。", "我是学生。我每天在学校学习汉语。"],
      ["これは私の犬です。名前はミロです。", "这是我的狗。它叫米洛。"],
      ["私はコーヒーが好きですが、紅茶は好きではありません。", "我喜欢咖啡，但是不喜欢红茶。"],
      ["今日は月曜日です。明日は火曜日です。", "今天是星期一。明天是星期二。"],
      ["この本はとても面白いです。", "这本书很有意思。"],
    ],
  },
  {
    levelSlug: "4kyu",
    level: "中検4級",
    toJapanese: [
      [
        "昨天，我跟妈妈一起去市场买了很多蔬菜。",
        "昨日、私は母と一緒に市場へ行き、たくさんの野菜を買いました。",
      ],
      ["这个周末，我们打算去美术馆参观。", "今週末、私たちは美術館を訪れる予定です。"],
      ["外面下着大雨，所以我带了雨伞。", "外は大雨が降っているので、傘を持っていきました。"],
      ["这件毛衣多少钱？我想买。", "このセーターはいくらですか？買いたいです。"],
      ["我每天坐公共汽车去学校。", "私は毎日バスで学校に行きます。"],
    ],
    fromJapanese: [
      ["先週、私は家族と一緒に海へ旅行しました。", "上个星期，我跟家人一起去海边旅行了。"],
      ["明日は友達の誕生日パーティーに行くつもりです。", "明天我打算去朋友的生日聚会。"],
      ["このレストランの料理はとてもおいしいです。", "这家餐厅的菜很好吃。"],
      ["駅までどうやって行けばいいですか？", "去车站怎么走？"],
      ["昨日は忙しかったので、あまり眠れませんでした。", "昨天很忙，所以没怎么睡觉。"],
    ],
  },
  {
    levelSlug: "3kyu",
    level: "中検3級",
    toJapanese: [
      [
        "小时候，我跟爷爷奶奶一起住在乡下。",
        "私が小さかった頃、祖父母と一緒に田舎に住んでいました。",
      ],
      [
        "这家餐厅比那家贵，但是菜做得更好吃。",
        "このレストランはもう一方より高いですが、料理はよりおいしいです。",
      ],
      ["我认为旅行是学习语言最好的方法。", "旅行することは言語を学ぶ最良の方法だと私は思います。"],
      ["我们在中国留学期间参观了好几个城市。", "私たちは中国留学中にいくつもの都市を訪れました。"],
      ["会议开得很长，不过内容很有意义。", "会議は長かったですが、とても有意義でした。"],
    ],
    fromJapanese: [
      ["子供の頃、私はよくこの公園で遊んでいました。", "小时候，我常常在这个公园里玩儿。"],
      ["このかばんはあのかばんよりも軽いです。", "这个包比那个包轻。"],
      [
        "彼女は毎日中国語を練習しているので、とても上手に話します。",
        "她每天练习汉语，所以说得很好。",
      ],
      [
        "私たちは去年、北京で開催された展覧会に行きました。",
        "去年，我们去参观了在北京举办的展览。",
      ],
      ["健康のために、毎日野菜を食べるべきです。", "为了健康，应该每天吃蔬菜。"],
    ],
  },
  {
    levelSlug: "2kyu",
    level: "中検2級",
    toJapanese: [
      [
        "为了保护环境，每个人都做出努力是很重要的。",
        "環境を守るために、一人一人が努力することが重要です。",
      ],
      [
        "多亏了新技术，人与人之间的交流变得比以前更方便了。",
        "新しい技術のおかげで、人々の間のコミュニケーションは以前より便利になりました。",
      ],
      [
        "年轻一代对社会问题越来越关心。",
        "若い世代は社会問題にますます関心を持つようになっています。",
      ],
      [
        "虽然改变习惯很难，但是只要有意志就是可能的。",
        "習慣を変えるのは難しいですが、意志さえあれば可能です。",
      ],
      [
        "不但物价上涨了，而且工资也没有增加，这让很多人感到不安。",
        "物価が上がっただけでなく、給料も増えていないので、多くの人が不安を感じています。",
      ],
    ],
    fromJapanese: [
      [
        "地球温暖化を止めるためには、皆が協力する必要があります。",
        "为了阻止全球变暖，大家都需要合作。",
      ],
      [
        "インターネットの普及によって、情報を得ることがとても簡単になりました。",
        "由于互联网的普及，获取信息变得非常容易。",
      ],
      [
        "この問題については、様々な意見があることを理解する必要があります。",
        "关于这个问题，需要理解存在各种各样的意见。",
      ],
      ["彼が試験に合格したことは、努力の結果だと思います。", "我认为他考试通过是努力的结果。"],
      [
        "経済が発展するにつれて、人々の生活水準も向上しました。",
        "随着经济的发展，人们的生活水平也提高了。",
      ],
    ],
  },
  {
    levelSlug: "jun1kyu",
    level: "中検準1級",
    toJapanese: [
      [
        "她并没有被失败打倒，反而从中汲取了重新开始的力量。",
        "彼女は失敗に打ちのめされるどころか、そこから再出発する力を得ました。",
      ],
      [
        "这家公司成功地把危机转化为了自我革新的契机。",
        "この企業は危機をうまく転機に変え、自らを作り変えることに成功しました。",
      ],
      [
        "认为技术进步本身就能保证幸福，未免过于天真。",
        "技術の進歩さえあれば幸福が保証されると考えるのは、あまりにも単純すぎるでしょう。",
      ],
      [
        "这位作家以细腻的笔触描绘了人性中的挣扎。",
        "その作家は繊細な筆致で、人間性の中の葛藤を描いています。",
      ],
      [
        "表面上看似简单的谈判，实际上比预想的要复杂得多。",
        "見かけ上は単純に見える交渉も、実際は予想以上に複雑でした。",
      ],
    ],
    fromJapanese: [
      [
        "彼は逆境をものともせず、むしろそれをばねにして成功を収めました。",
        "他没有被逆境击倒，反而把它当作跳板取得了成功。",
      ],
      [
        "この小説は、一見単純に見えて、実は非常に奥深いテーマを扱っています。",
        "这部小说乍看简单，实际上探讨的是非常深刻的主题。",
      ],
      [
        "経済成長だけを追い求めることの弊害が、今日ますます明らかになっています。",
        "只追求经济增长所带来的弊端，如今变得越来越明显。",
      ],
      [
        "彼女の発言は一見矛盾しているようだが、よく考えれば筋が通っている。",
        "她的话乍听矛盾，但仔细想想却很有道理。",
      ],
      [
        "交渉が難航したのは、双方が譲歩を拒んだからにほかならない。",
        "谈判之所以陷入僵局，无非是因为双方都拒绝让步。",
      ],
    ],
  },
  {
    levelSlug: "1kyu",
    level: "中検1級",
    toJapanese: [
      [
        "认为全球化能让所有国家平等受益，未免太天真了。",
        "グローバル化があらゆる国に等しく恩恵をもたらすと考えるのは、あまりにも素朴でしょう。",
      ],
      [
        "面对这样的两难境地，能够保持冷静的人少之又少。",
        "そのようなジレンマに直面して冷静さを保てる人はごくわずかです。",
      ],
      [
        "只有经过时间的沉淀，人们才能真正衡量这一事件的深远影响。",
        "時間の沈殿を経て初めて、人々はこの出来事の深遠な影響を本当に測ることができるのです。",
      ],
      [
        "这位作者不满足于揭露不公，还深入挖掘了其根源。",
        "この著者は不正を暴くだけでは満足せず、その根源までも深く掘り下げています。",
      ],
      [
        "只要根本原因得不到解决，问题的表象就会反复出现。",
        "根本的な原因が解決されない限り、問題の表れは繰り返し現れるでしょう。",
      ],
    ],
    fromJapanese: [
      [
        "この危機が浮き彫りにしたのは、既存の制度がいかに脆弱であったかという事実にほかならない。",
        "这场危机所暴露出来的，正是现有制度是多么脆弱这一事实。",
      ],
      [
        "議論を尽くしたところで、双方の溝が埋まる見込みは薄いように思われる。",
        "即使把争论进行到底，双方的分歧似乎也很难弥合。",
      ],
      [
        "彼の作品が今なお読み継がれているのは、人間性への深い洞察ゆえである。",
        "他的作品之所以至今仍被人阅读，是因为其中蕴含着对人性的深刻洞察。",
      ],
      [
        "表面上は些細に見える決定が、後になって重大な結果を招くことは少なくない。",
        "表面上看似微不足道的决定，日后招致重大后果的情况并不少见。",
      ],
      [
        "危機に際して真価を問われるのは、平時にはめったに試されない資質である。",
        "在危机中受到考验的，是那些在平时很少被检验的品质。",
      ],
    ],
  },
];

// ------------------------------------------------------------------
// フランス語（仏検: 5級・4級・3級・準2級・2級・準1級・1級）
// ------------------------------------------------------------------

const FRENCH_SEEDS: LevelSeed[] = [
  {
    levelSlug: "5kyu",
    level: "仏検5級",
    toJapanese: [
      [
        "Bonjour, je m'appelle Paul. Je suis étudiant et j'habite à Lyon.",
        "こんにちは、私はポールといいます。学生で、リヨンに住んでいます。",
      ],
      [
        "J'ai vingt ans. J'ai un frère et une sœur.",
        "私は20歳です。兄弟が一人と姉妹が一人います。",
      ],
      ["Il fait beau aujourd'hui. J'aime le printemps.", "今日はいい天気です。私は春が好きです。"],
      ["Le dimanche, je fais du sport avec mes amis.", "日曜日に、私は友達とスポーツをします。"],
      ["Ma mère est professeure et mon père est médecin.", "私の母は教師で、父は医者です。"],
    ],
    fromJapanese: [
      [
        "私は毎朝7時に起きます。それから朝食を食べます。",
        "Je me lève à sept heures tous les matins. Ensuite, je prends le petit-déjeuner.",
      ],
      ["これは私の犬です。名前はミロです。", "C'est mon chien. Il s'appelle Milo."],
      [
        "私はコーヒーが好きですが、紅茶は好きではありません。",
        "J'aime le café, mais je n'aime pas le thé.",
      ],
      ["今日は月曜日です。明日は火曜日です。", "Aujourd'hui, c'est lundi. Demain, c'est mardi."],
      ["この本はとても面白いです。", "Ce livre est très intéressant."],
    ],
  },
  {
    levelSlug: "4kyu",
    level: "仏検4級",
    toJapanese: [
      [
        "Hier, je suis allé au marché avec ma mère pour acheter des légumes.",
        "昨日、私は母と一緒に野菜を買いに市場へ行きました。",
      ],
      [
        "Ce week-end, nous allons visiter le musée du Louvre.",
        "今週末、私たちはルーヴル美術館を訪れる予定です。",
      ],
      [
        "Il pleut beaucoup, alors je prends un parapluie.",
        "雨がたくさん降っているので、傘を持っていきます。",
      ],
      [
        "Combien coûte ce pull ? Je voudrais l'acheter.",
        "このセーターはいくらですか？買いたいです。",
      ],
      ["Je prends le bus pour aller à l'école tous les jours.", "私は毎日バスで学校に行きます。"],
    ],
    fromJapanese: [
      [
        "先週、私は家族と一緒に海へ旅行しました。",
        "La semaine dernière, je suis parti(e) en voyage à la mer avec ma famille.",
      ],
      [
        "明日は友達の誕生日パーティーに行くつもりです。",
        "Demain, je vais aller à la fête d'anniversaire de mon ami(e).",
      ],
      ["このレストランの料理はとてもおいしいです。", "La cuisine de ce restaurant est très bonne."],
      ["駅までどうやって行けばいいですか？", "Comment est-ce que je peux aller à la gare ?"],
      [
        "昨日は忙しかったので、あまり眠れませんでした。",
        "Hier, j'étais occupé(e), donc je n'ai pas beaucoup dormi.",
      ],
    ],
  },
  {
    levelSlug: "3kyu",
    level: "仏検3級",
    toJapanese: [
      [
        "Quand j'étais petit, j'habitais à la campagne avec mes grands-parents.",
        "私が小さかった頃、祖父母と一緒に田舎に住んでいました。",
      ],
      [
        "Ce restaurant est plus cher que l'autre, mais la nourriture est meilleure.",
        "このレストランはもう一方より高いですが、料理はよりおいしいです。",
      ],
      [
        "Je pense que voyager est le meilleur moyen d'apprendre une langue.",
        "旅行することは言語を学ぶ最良の方法だと私は思います。",
      ],
      [
        "Nous avons visité plusieurs villes pendant notre séjour en France.",
        "私たちはフランス滞在中にいくつもの都市を訪れました。",
      ],
      [
        "La réunion a été longue, mais elle était très utile.",
        "会議は長かったですが、とても有意義でした。",
      ],
    ],
    fromJapanese: [
      [
        "子供の頃、私はよくこの公園で遊んでいました。",
        "Quand j'étais enfant, je jouais souvent dans ce parc.",
      ],
      ["このかばんはあのかばんよりも軽いです。", "Ce sac est plus léger que celui-là."],
      [
        "彼女は毎日フランス語を練習しているので、とても上手に話します。",
        "Elle pratique le français tous les jours, donc elle parle très bien.",
      ],
      [
        "私たちは去年、パリで開催された展覧会に行きました。",
        "L'année dernière, nous sommes allé(e)s à l'exposition qui a eu lieu à Paris.",
      ],
      [
        "健康のために、毎日野菜を食べるべきです。",
        "Pour la santé, il faut manger des légumes tous les jours.",
      ],
    ],
  },
  {
    levelSlug: "jun2kyu",
    level: "仏検準2級",
    toJapanese: [
      [
        "Il est important que chacun fasse des efforts pour protéger l'environnement.",
        "一人一人が環境を守るために努力することが重要です。",
      ],
      [
        "Si j'avais plus de temps, je voyagerais dans le monde entier.",
        "もし私にもっと時間があれば、世界中を旅行するのですが。",
      ],
      [
        "Grâce aux nouvelles technologies, la communication est devenue plus facile qu'avant.",
        "新しい技術のおかげで、コミュニケーションは以前より簡単になりました。",
      ],
      [
        "Les jeunes générations s'intéressent de plus en plus aux questions sociales.",
        "若い世代は社会問題にますます関心を持っています。",
      ],
      [
        "Bien qu'il soit difficile de changer ses habitudes, c'est possible avec de la volonté.",
        "習慣を変えるのは難しいけれども、意志があれば可能です。",
      ],
    ],
    fromJapanese: [
      [
        "地球温暖化を止めるためには、皆が協力する必要があります。",
        "Pour arrêter le réchauffement climatique, il faut que tout le monde coopère.",
      ],
      [
        "もし私が首相だったら、教育により多くの予算を使うでしょう。",
        "Si j'étais le premier ministre, je consacrerais plus de budget à l'éducation.",
      ],
      [
        "インターネットの普及によって、情報を得ることがとても簡単になりました。",
        "Grâce à la diffusion d'Internet, il est devenu très facile d'obtenir des informations.",
      ],
      [
        "この問題については、様々な意見があることを理解する必要があります。",
        "Il faut comprendre qu'il existe diverses opinions sur cette question.",
      ],
      [
        "彼が試験に合格したことは、努力の結果だと思います。",
        "Je pense que le fait qu'il ait réussi l'examen est le résultat de ses efforts.",
      ],
    ],
  },
  {
    levelSlug: "2kyu",
    level: "仏検2級",
    toJapanese: [
      [
        "Si nous avions pris cette décision plus tôt, la situation aurait pu être différente.",
        "もし私たちがもっと早くこの決断をしていたら、状況は違っていたかもしれません。",
      ],
      [
        "Le livre dont je vous ai parlé hier traite des inégalités sociales contemporaines.",
        "昨日お話しした本は、現代の社会的不平等について扱っています。",
      ],
      [
        "Il n'est pas rare que les entreprises modifient leur stratégie face à la concurrence internationale.",
        "企業が国際競争に直面して戦略を変更することは珍しくありません。",
      ],
      [
        "Quoi qu'on en dise, cette réforme aura des conséquences importantes sur l'économie.",
        "何と言われようとも、この改革は経済に重大な影響を及ぼすでしょう。",
      ],
      [
        "C'est un sujet sur lequel les experts eux-mêmes ne s'accordent pas toujours.",
        "これは専門家自身も必ずしも意見が一致しない話題です。",
      ],
    ],
    fromJapanese: [
      [
        "政府がもっと早く対策を取っていれば、被害はもっと少なかったでしょう。",
        "Si le gouvernement avait pris des mesures plus tôt, les dégâts auraient été moindres.",
      ],
      [
        "彼女が昨夜話していた映画は、実話に基づいているそうです。",
        "Il paraît que le film dont elle parlait hier soir est basé sur une histoire vraie.",
      ],
      [
        "少子化は多くの先進国が直面している共通の課題です。",
        "La baisse de la natalité est un défi commun auquel de nombreux pays développés sont confrontés.",
      ],
      [
        "この決定がどんな結果を招くにせよ、私たちはそれを受け入れなければなりません。",
        "Quel que soit le résultat que cette décision entraîne, nous devons l'accepter.",
      ],
      [
        "専門家の間でさえ意見が分かれているのは、この問題が複雑だからです。",
        "Si les avis divergent même parmi les experts, c'est parce que ce problème est complexe.",
      ],
    ],
  },
  {
    levelSlug: "jun1kyu",
    level: "仏検準1級",
    toJapanese: [
      [
        "Loin de se laisser abattre par l'échec, elle y a puisé la force de recommencer.",
        "彼女は失敗に打ちのめされるどころか、そこから再挑戦する力を得ました。",
      ],
      [
        "Cette entreprise a su tirer parti de la crise pour se réinventer entièrement.",
        "この企業は危機をうまく利用して、自らを完全に作り変えることに成功しました。",
      ],
      [
        "On aurait tort de croire que le progrès technique suffit à garantir le bonheur.",
        "技術の進歩さえあれば幸福が保証されると考えるのは間違いでしょう。",
      ],
      [
        "L'écrivain dépeint avec une finesse remarquable les tourments de l'âme humaine.",
        "その作家は人間の魂の苦悩を、見事な繊細さで描いています。",
      ],
      [
        "Malgré les apparences, cette négociation s'est révélée plus délicate que prévu.",
        "見かけによらず、この交渉は予想以上に繊細なものであることが明らかになりました。",
      ],
    ],
    fromJapanese: [
      [
        "彼は逆境をものともせず、むしろそれをばねにして成功を収めました。",
        "Loin de se laisser décourager par l'adversité, il s'en est plutôt servi comme tremplin vers la réussite.",
      ],
      [
        "この小説は、一見単純に見えて、実は非常に奥深いテーマを扱っています。",
        "Ce roman, qui semble simple à première vue, traite en réalité d'un thème d'une grande profondeur.",
      ],
      [
        "経済成長だけを追い求めることの弊害が、今日ますます明らかになっています。",
        "Les méfaits de la course exclusive à la croissance économique deviennent aujourd'hui de plus en plus évidents.",
      ],
      [
        "彼女の発言は一見矛盾しているようだが、よく考えれば筋が通っている。",
        "Ses propos semblent contradictoires à première vue, mais ils sont cohérents si l'on y réfléchit bien.",
      ],
      [
        "交渉が難航したのは、双方が譲歩を拒んだからにほかならない。",
        "Si les négociations ont été laborieuses, c'est uniquement parce que les deux parties ont refusé de faire des concessions.",
      ],
    ],
  },
  {
    levelSlug: "1kyu",
    level: "仏検1級",
    toJapanese: [
      [
        "Il serait naïf de penser que la mondialisation profite uniformément à tous les pays.",
        "グローバル化があらゆる国に一様に恩恵をもたらすと考えるのは、あまりにも素朴でしょう。",
      ],
      [
        "Rares sont ceux qui, confrontés à un tel dilemme, parviennent à garder la tête froide.",
        "そのようなジレンマに直面して冷静さを保てる人はほとんどいません。",
      ],
      [
        "Ce n'est qu'avec le recul que l'on mesure véritablement la portée de cet événement.",
        "この出来事の本当の意味は、時が経ってから初めて測れるものです。",
      ],
      [
        "L'auteur ne se contente pas de dénoncer l'injustice ; il en explore les racines les plus profondes.",
        "著者は不正を告発するだけでなく、その最も深い根源を掘り下げています。",
      ],
      [
        "Tant que les causes profondes ne seront pas traitées, les symptômes continueront de resurgir.",
        "根本的な原因が対処されない限り、その症状は繰り返し現れ続けるでしょう。",
      ],
    ],
    fromJapanese: [
      [
        "この危機が浮き彫りにしたのは、既存の制度がいかに脆弱であったかという事実にほかならない。",
        "Ce que cette crise a mis en lumière, c'est précisément à quel point les institutions existantes étaient fragiles.",
      ],
      [
        "議論を尽くしたところで、双方の溝が埋まる見込みは薄いように思われる。",
        "Même à force d'épuiser le débat, il semble peu probable que le fossé entre les deux parties se comble.",
      ],
      [
        "彼の作品が今なお読み継がれているのは、人間性への深い洞察ゆえである。",
        "Si son œuvre continue d'être lue aujourd'hui, c'est en raison de sa profonde perspicacité sur la nature humaine.",
      ],
      [
        "表面上は些細に見える決定が、後になって重大な結果を招くことは少なくない。",
        "Il n'est pas rare qu'une décision qui paraît anodine en surface entraîne, par la suite, des conséquences considérables.",
      ],
      [
        "危機に際して真価を問われるのは、平時にはめったに試されない資質である。",
        "Ce sont des qualités rarement mises à l'épreuve en temps normal qui sont testées en période de crise.",
      ],
    ],
  },
];

// ------------------------------------------------------------------
// ドイツ語（独検: 5級・4級・3級・準2級・2級・準1級・1級）
// ------------------------------------------------------------------

const GERMAN_SEEDS: LevelSeed[] = [
  {
    levelSlug: "5kyu",
    level: "独検5級",
    toJapanese: [
      [
        "Guten Tag, ich heiße Anna. Ich komme aus Berlin und bin Studentin.",
        "こんにちは、私はアンナといいます。ベルリン出身で、学生です。",
      ],
      [
        "Ich bin zwanzig Jahre alt. Ich habe einen Bruder und eine Schwester.",
        "私は20歳です。兄弟が一人と姉妹が一人います。",
      ],
      [
        "Heute ist das Wetter schön. Ich mag den Frühling.",
        "今日はいい天気です。私は春が好きです。",
      ],
      ["Am Sonntag mache ich Sport mit meinen Freunden.", "日曜日に、私は友達とスポーツをします。"],
      ["Meine Mutter ist Lehrerin und mein Vater ist Arzt.", "私の母は教師で、父は医者です。"],
    ],
    fromJapanese: [
      [
        "私は週末に友達と映画を見ます。とても楽しいです。",
        "Am Wochenende sehe ich mit meinen Freunden einen Film. Das macht viel Spaß.",
      ],
      ["これは私の犬です。名前はミロです。", "Das ist mein Hund. Er heißt Milo."],
      [
        "私はコーヒーが好きですが、紅茶は好きではありません。",
        "Ich mag Kaffee, aber ich mag keinen Tee.",
      ],
      ["今日は月曜日です。明日は火曜日です。", "Heute ist Montag. Morgen ist Dienstag."],
      ["この本はとても面白いです。", "Dieses Buch ist sehr interessant."],
    ],
  },
  {
    levelSlug: "4kyu",
    level: "独検4級",
    toJapanese: [
      [
        "Gestern bin ich mit meiner Mutter auf den Markt gegangen, um Gemüse zu kaufen.",
        "昨日、私は母と一緒に野菜を買いに市場へ行きました。",
      ],
      [
        "Dieses Wochenende besuchen wir das Museum in der Stadt.",
        "今週末、私たちは街の美術館を訪れる予定です。",
      ],
      [
        "Es regnet stark, deshalb nehme ich einen Regenschirm mit.",
        "雨がたくさん降っているので、傘を持っていきます。",
      ],
      [
        "Wie viel kostet dieser Pullover? Ich möchte ihn kaufen.",
        "このセーターはいくらですか？買いたいです。",
      ],
      ["Ich fahre jeden Tag mit dem Bus zur Schule.", "私は毎日バスで学校に行きます。"],
    ],
    fromJapanese: [
      [
        "先週、私は家族と一緒に海へ旅行しました。",
        "Letzte Woche bin ich mit meiner Familie ans Meer gereist.",
      ],
      [
        "明日は友達の誕生日パーティーに行くつもりです。",
        "Morgen gehe ich zur Geburtstagsparty meines Freundes.",
      ],
      [
        "このレストランの料理はとてもおいしいです。",
        "Das Essen in diesem Restaurant ist sehr lecker.",
      ],
      ["駅までどうやって行けばいいですか？", "Wie komme ich zum Bahnhof?"],
      [
        "昨日は忙しかったので、あまり眠れませんでした。",
        "Gestern war ich beschäftigt, deshalb habe ich nicht viel geschlafen.",
      ],
    ],
  },
  {
    levelSlug: "3kyu",
    level: "独検3級",
    toJapanese: [
      [
        "Als ich klein war, wohnte ich mit meinen Großeltern auf dem Land.",
        "私が小さかった頃、祖父母と一緒に田舎に住んでいました。",
      ],
      [
        "Dieses Restaurant ist teurer als das andere, aber das Essen schmeckt besser.",
        "このレストランはもう一方より高いですが、料理はよりおいしいです。",
      ],
      [
        "Ich denke, dass Reisen die beste Art ist, eine Sprache zu lernen.",
        "旅行することは言語を学ぶ最良の方法だと私は思います。",
      ],
      [
        "Wir haben während unseres Aufenthalts in Deutschland mehrere Städte besucht.",
        "私たちはドイツ滞在中にいくつもの都市を訪れました。",
      ],
      [
        "Die Besprechung war lang, aber sie war sehr nützlich.",
        "会議は長かったですが、とても有意義でした。",
      ],
    ],
    fromJapanese: [
      [
        "子供の頃、私はよくこの公園で遊んでいました。",
        "Als ich ein Kind war, spielte ich oft in diesem Park.",
      ],
      ["このかばんはあのかばんよりも軽いです。", "Diese Tasche ist leichter als jene."],
      [
        "彼女は毎日ドイツ語を練習しているので、とても上手に話します。",
        "Sie übt jeden Tag Deutsch, deshalb spricht sie sehr gut.",
      ],
      [
        "私たちは去年、ベルリンで開催された展覧会に行きました。",
        "Letztes Jahr sind wir zu der Ausstellung gegangen, die in Berlin stattfand.",
      ],
      [
        "健康のために、毎日野菜を食べるべきです。",
        "Für die Gesundheit sollte man jeden Tag Gemüse essen.",
      ],
    ],
  },
  {
    levelSlug: "jun2kyu",
    level: "独検準2級",
    toJapanese: [
      [
        "Es ist wichtig, dass sich jeder bemüht, die Umwelt zu schützen.",
        "一人一人が環境を守るために努力することが重要です。",
      ],
      [
        "Wenn ich mehr Zeit hätte, würde ich um die ganze Welt reisen.",
        "もし私にもっと時間があれば、世界中を旅行するのですが。",
      ],
      [
        "Dank der neuen Technologien ist die Kommunikation einfacher geworden als früher.",
        "新しい技術のおかげで、コミュニケーションは以前より簡単になりました。",
      ],
      [
        "Die jüngeren Generationen interessieren sich zunehmend für soziale Fragen.",
        "若い世代は社会問題にますます関心を持っています。",
      ],
      [
        "Obwohl es schwer ist, Gewohnheiten zu ändern, ist es mit Willenskraft möglich.",
        "習慣を変えるのは難しいけれども、意志があれば可能です。",
      ],
    ],
    fromJapanese: [
      [
        "地球温暖化を止めるためには、皆が協力する必要があります。",
        "Um die globale Erwärmung zu stoppen, müssen alle zusammenarbeiten.",
      ],
      [
        "もし私が首相だったら、教育により多くの予算を使うでしょう。",
        "Wenn ich Premierminister wäre, würde ich mehr Budget für die Bildung ausgeben.",
      ],
      [
        "インターネットの普及によって、情報を得ることがとても簡単になりました。",
        "Durch die Verbreitung des Internets ist es sehr einfach geworden, Informationen zu bekommen.",
      ],
      [
        "この問題については、様々な意見があることを理解する必要があります。",
        "Man muss verstehen, dass es zu diesem Thema verschiedene Meinungen gibt.",
      ],
      [
        "彼が試験に合格したことは、努力の結果だと思います。",
        "Ich denke, dass die Tatsache, dass er die Prüfung bestanden hat, das Ergebnis seiner Anstrengungen ist.",
      ],
    ],
  },
  {
    levelSlug: "2kyu",
    level: "独検2級",
    toJapanese: [
      [
        "Wenn wir diese Entscheidung früher getroffen hätten, wäre die Lage vielleicht anders gewesen.",
        "もし私たちがもっと早くこの決断をしていたら、状況は違っていたかもしれません。",
      ],
      [
        "Das Buch, von dem ich Ihnen gestern erzählt habe, behandelt die soziale Ungleichheit unserer Zeit.",
        "昨日お話しした本は、現代の社会的不平等について扱っています。",
      ],
      [
        "Es ist nicht selten, dass Unternehmen angesichts der internationalen Konkurrenz ihre Strategie ändern.",
        "企業が国際競争に直面して戦略を変更することは珍しくありません。",
      ],
      [
        "Was man auch sagen mag, diese Reform wird bedeutende Auswirkungen auf die Wirtschaft haben.",
        "何と言われようとも、この改革は経済に重大な影響を及ぼすでしょう。",
      ],
      [
        "Das ist ein Thema, bei dem sich selbst die Experten nicht immer einig sind.",
        "これは専門家自身も必ずしも意見が一致しない話題です。",
      ],
    ],
    fromJapanese: [
      [
        "政府がもっと早く対策を取っていれば、被害はもっと少なかったでしょう。",
        "Wenn die Regierung früher Maßnahmen ergriffen hätte, wären die Schäden geringer gewesen.",
      ],
      [
        "彼女が昨夜話していた映画は、実話に基づいているそうです。",
        "Der Film, von dem sie gestern Abend erzählt hat, soll auf einer wahren Geschichte beruhen.",
      ],
      [
        "少子化は多くの先進国が直面している共通の課題です。",
        "Der Geburtenrückgang ist eine gemeinsame Herausforderung, vor der viele entwickelte Länder stehen.",
      ],
      [
        "この決定がどんな結果を招くにせよ、私たちはそれを受け入れなければなりません。",
        "Welche Folgen diese Entscheidung auch immer mit sich bringt, wir müssen sie akzeptieren.",
      ],
      [
        "専門家の間でさえ意見が分かれているのは、この問題が複雑だからです。",
        "Dass die Meinungen sogar unter Experten auseinandergehen, liegt daran, dass dieses Problem komplex ist.",
      ],
    ],
  },
  {
    levelSlug: "jun1kyu",
    level: "独検準1級",
    toJapanese: [
      [
        "Statt sich vom Misserfolg entmutigen zu lassen, schöpfte sie daraus die Kraft für einen Neuanfang.",
        "彼女は失敗に落胆するどころか、そこから再出発する力を得ました。",
      ],
      [
        "Diesem Unternehmen ist es gelungen, die Krise zu nutzen, um sich völlig neu zu erfinden.",
        "この企業は危機をうまく利用して、自らを完全に作り変えることに成功しました。",
      ],
      [
        "Es wäre falsch zu glauben, dass technischer Fortschritt allein das Glück garantiert.",
        "技術の進歩さえあれば幸福が保証されると考えるのは間違いでしょう。",
      ],
      [
        "Der Schriftsteller schildert mit bemerkenswerter Feinheit die Qualen der menschlichen Seele.",
        "その作家は人間の魂の苦悩を、見事な繊細さで描いています。",
      ],
      [
        "Entgegen dem äußeren Anschein erwies sich diese Verhandlung als heikler als erwartet.",
        "見かけによらず、この交渉は予想以上に繊細なものであることが明らかになりました。",
      ],
    ],
    fromJapanese: [
      [
        "彼は逆境をものともせず、むしろそれをばねにして成功を収めました。",
        "Anstatt sich von den Widrigkeiten entmutigen zu lassen, nutzte er sie vielmehr als Sprungbrett zum Erfolg.",
      ],
      [
        "この小説は、一見単純に見えて、実は非常に奥深いテーマを扱っています。",
        "Dieser Roman, der auf den ersten Blick einfach erscheint, behandelt in Wirklichkeit ein sehr tiefgründiges Thema.",
      ],
      [
        "経済成長だけを追い求めることの弊害が、今日ますます明らかになっています。",
        "Die Schäden, die das ausschließliche Streben nach Wirtschaftswachstum verursacht, werden heute immer deutlicher.",
      ],
      [
        "彼女の発言は一見矛盾しているようだが、よく考えれば筋が通っている。",
        "Ihre Aussagen scheinen auf den ersten Blick widersprüchlich, sind aber bei genauerem Nachdenken schlüssig.",
      ],
      [
        "交渉が難航したのは、双方が譲歩を拒んだからにほかならない。",
        "Dass sich die Verhandlungen als schwierig erwiesen, lag einzig und allein daran, dass beide Seiten sich weigerten, Zugeständnisse zu machen.",
      ],
    ],
  },
  {
    levelSlug: "1kyu",
    level: "独検1級",
    toJapanese: [
      [
        "Es wäre naiv zu glauben, dass die Globalisierung allen Ländern gleichermaßen zugutekommt.",
        "グローバル化があらゆる国に一様に恩恵をもたらすと考えるのは、あまりにも素朴でしょう。",
      ],
      [
        "Nur wenige schaffen es, angesichts eines solchen Dilemmas einen kühlen Kopf zu bewahren.",
        "そのようなジレンマに直面して冷静さを保てる人はほとんどいません。",
      ],
      [
        "Erst mit zeitlichem Abstand lässt sich die wahre Tragweite dieses Ereignisses ermessen.",
        "この出来事の本当の意味は、時が経ってから初めて測れるものです。",
      ],
      [
        "Der Autor begnügt sich nicht damit, das Unrecht anzuprangern; er ergründet auch dessen tiefste Wurzeln.",
        "著者は不正を告発するだけでなく、その最も深い根源を掘り下げています。",
      ],
      [
        "Solange die tieferen Ursachen nicht angegangen werden, werden die Symptome immer wieder auftreten.",
        "根本的な原因が対処されない限り、その症状は繰り返し現れ続けるでしょう。",
      ],
    ],
    fromJapanese: [
      [
        "この危機が浮き彫りにしたのは、既存の制度がいかに脆弱であったかという事実にほかならない。",
        "Was diese Krise offengelegt hat, ist genau die Tatsache, wie zerbrechlich die bestehenden Institutionen waren.",
      ],
      [
        "議論を尽くしたところで、双方の溝が埋まる見込みは薄いように思われる。",
        "Selbst wenn man die Debatte bis zum Äußersten führt, scheint es unwahrscheinlich, dass sich die Kluft zwischen beiden Seiten schließen lässt.",
      ],
      [
        "彼の作品が今なお読み継がれているのは、人間性への深い洞察ゆえである。",
        "Dass sein Werk bis heute gelesen wird, liegt an seiner tiefen Einsicht in das Wesen des Menschen.",
      ],
      [
        "表面上は些細に見える決定が、後になって重大な結果を招くことは少なくない。",
        "Es kommt nicht selten vor, dass eine Entscheidung, die oberflächlich betrachtet unbedeutend erscheint, später schwerwiegende Folgen nach sich zieht.",
      ],
      [
        "危機に際して真価を問われるのは、平時にはめったに試されない資質である。",
        "In Krisenzeiten werden Eigenschaften auf die Probe gestellt, die in normalen Zeiten selten getestet werden.",
      ],
    ],
  },
];

// ------------------------------------------------------------------
// スペイン語（西検: 6級・5級・4級・3級・2級・1級）
// ------------------------------------------------------------------

const SPANISH_SEEDS: LevelSeed[] = [
  {
    levelSlug: "6kyu",
    level: "西検6級",
    toJapanese: [
      [
        "Hola, me llamo Carlos. Soy estudiante y vivo en Madrid.",
        "こんにちは、私はカルロスといいます。学生で、マドリードに住んでいます。",
      ],
      [
        "Tengo veinte años. Tengo un hermano y una hermana.",
        "私は20歳です。兄弟が一人と姉妹が一人います。",
      ],
      ["Hoy hace buen tiempo. Me gusta la primavera.", "今日はいい天気です。私は春が好きです。"],
      ["Los domingos hago deporte con mis amigos.", "日曜日に、私は友達とスポーツをします。"],
      ["Mi madre es profesora y mi padre es médico.", "私の母は教師で、父は医者です。"],
    ],
    fromJapanese: [
      [
        "私は毎日公園を散歩します。犬と一緒に歩くのが好きです。",
        "Todos los días paseo por el parque. Me gusta caminar con mi perro.",
      ],
      ["これは私の犬です。名前はミロです。", "Este es mi perro. Se llama Milo."],
      [
        "私はコーヒーが好きですが、紅茶は好きではありません。",
        "Me gusta el café, pero no me gusta el té.",
      ],
      ["今日は月曜日です。明日は火曜日です。", "Hoy es lunes. Mañana es martes."],
      ["この本はとても面白いです。", "Este libro es muy interesante."],
    ],
  },
  {
    levelSlug: "5kyu",
    level: "西検5級",
    toJapanese: [
      [
        "Ayer fui al mercado con mi madre para comprar verduras.",
        "昨日、私は母と一緒に野菜を買いに市場へ行きました。",
      ],
      [
        "Este fin de semana vamos a visitar el museo del centro.",
        "今週末、私たちは中心街の美術館を訪れる予定です。",
      ],
      [
        "Está lloviendo mucho, así que llevo un paraguas.",
        "雨がたくさん降っているので、傘を持っていきます。",
      ],
      [
        "¿Cuánto cuesta este suéter? Quiero comprarlo.",
        "このセーターはいくらですか？買いたいです。",
      ],
      ["Voy a la escuela en autobús todos los días.", "私は毎日バスで学校に行きます。"],
    ],
    fromJapanese: [
      [
        "先週、私は家族と一緒に海へ旅行しました。",
        "La semana pasada viajé a la playa con mi familia.",
      ],
      [
        "明日は友達の誕生日パーティーに行くつもりです。",
        "Mañana voy a ir a la fiesta de cumpleaños de mi amigo.",
      ],
      [
        "このレストランの料理はとてもおいしいです。",
        "La comida de este restaurante está muy buena.",
      ],
      ["駅までどうやって行けばいいですか？", "¿Cómo puedo llegar a la estación?"],
      [
        "昨日は忙しかったので、あまり眠れませんでした。",
        "Ayer estuve ocupado/a, así que no dormí mucho.",
      ],
    ],
  },
  {
    levelSlug: "4kyu",
    level: "西検4級",
    toJapanese: [
      [
        "Cuando era pequeño, vivía en el campo con mis abuelos.",
        "私が小さかった頃、祖父母と一緒に田舎に住んでいました。",
      ],
      [
        "Este restaurante es más caro que el otro, pero la comida es mejor.",
        "このレストランはもう一方より高いですが、料理はよりおいしいです。",
      ],
      [
        "Creo que viajar es la mejor manera de aprender un idioma.",
        "旅行することは言語を学ぶ最良の方法だと私は思います。",
      ],
      [
        "Visitamos varias ciudades durante nuestra estancia en España.",
        "私たちはスペイン滞在中にいくつもの都市を訪れました。",
      ],
      ["La reunión fue larga, pero fue muy útil.", "会議は長かったですが、とても有意義でした。"],
    ],
    fromJapanese: [
      [
        "子供の頃、私はよくこの公園で遊んでいました。",
        "Cuando era niño/a, jugaba a menudo en este parque.",
      ],
      ["このかばんはあのかばんよりも軽いです。", "Esta bolsa es más ligera que aquella."],
      [
        "彼女は毎日スペイン語を練習しているので、とても上手に話します。",
        "Ella practica español todos los días, por eso habla muy bien.",
      ],
      [
        "私たちは去年、マドリードで開催された展覧会に行きました。",
        "El año pasado fuimos a la exposición que se celebró en Madrid.",
      ],
      [
        "健康のために、毎日野菜を食べるべきです。",
        "Para la salud, hay que comer verduras todos los días.",
      ],
    ],
  },
  {
    levelSlug: "3kyu",
    level: "西検3級",
    toJapanese: [
      [
        "Es importante que cada uno haga un esfuerzo para proteger el medio ambiente.",
        "一人一人が環境を守るために努力することが重要です。",
      ],
      [
        "Si tuviera más tiempo, viajaría por todo el mundo.",
        "もし私にもっと時間があれば、世界中を旅行するのですが。",
      ],
      [
        "Gracias a las nuevas tecnologías, la comunicación se ha vuelto más fácil que antes.",
        "新しい技術のおかげで、コミュニケーションは以前より簡単になりました。",
      ],
      [
        "Las nuevas generaciones se interesan cada vez más por los problemas sociales.",
        "若い世代は社会問題にますます関心を持っています。",
      ],
      [
        "Aunque sea difícil cambiar de hábitos, es posible si hay voluntad.",
        "習慣を変えるのは難しいけれども、意志があれば可能です。",
      ],
    ],
    fromJapanese: [
      [
        "地球温暖化を止めるためには、皆が協力する必要があります。",
        "Para detener el calentamiento global, es necesario que todos cooperen.",
      ],
      [
        "もし私が首相だったら、教育により多くの予算を使うでしょう。",
        "Si yo fuera el primer ministro, dedicaría más presupuesto a la educación.",
      ],
      [
        "インターネットの普及によって、情報を得ることがとても簡単になりました。",
        "Gracias a la difusión de Internet, obtener información se ha vuelto muy fácil.",
      ],
      [
        "この問題については、様々な意見があることを理解する必要があります。",
        "Hay que entender que existen diversas opiniones sobre este tema.",
      ],
      [
        "彼が試験に合格したことは、努力の結果だと思います。",
        "Creo que el hecho de que él haya aprobado el examen es el resultado de su esfuerzo.",
      ],
    ],
  },
  {
    levelSlug: "2kyu",
    level: "西検2級",
    toJapanese: [
      [
        "Si hubiéramos tomado esta decisión antes, la situación podría haber sido diferente.",
        "もし私たちがもっと早くこの決断をしていたら、状況は違っていたかもしれません。",
      ],
      [
        "El libro del que te hablé ayer trata sobre las desigualdades sociales contemporáneas.",
        "昨日お話しした本は、現代の社会的不平等について扱っています。",
      ],
      [
        "No es raro que las empresas modifiquen su estrategia frente a la competencia internacional.",
        "企業が国際競争に直面して戦略を変更することは珍しくありません。",
      ],
      [
        "Digan lo que digan, esta reforma tendrá consecuencias importantes para la economía.",
        "何と言われようとも、この改革は経済に重大な影響を及ぼすでしょう。",
      ],
      [
        "Es un tema sobre el cual ni siquiera los expertos se ponen de acuerdo siempre.",
        "これは専門家自身も必ずしも意見が一致しない話題です。",
      ],
    ],
    fromJapanese: [
      [
        "政府がもっと早く対策を取っていれば、被害はもっと少なかったでしょう。",
        "Si el gobierno hubiera tomado medidas antes, los daños habrían sido menores.",
      ],
      [
        "彼女が昨夜話していた映画は、実話に基づいているそうです。",
        "Dicen que la película de la que hablaba ella anoche está basada en una historia real.",
      ],
      [
        "少子化は多くの先進国が直面している共通の課題です。",
        "La baja natalidad es un desafío común al que se enfrentan muchos países desarrollados.",
      ],
      [
        "この決定がどんな結果を招くにせよ、私たちはそれを受け入れなければなりません。",
        "Sea cual sea el resultado que traiga esta decisión, tenemos que aceptarlo.",
      ],
      [
        "専門家の間でさえ意見が分かれているのは、この問題が複雑だからです。",
        "Que las opiniones estén divididas incluso entre los expertos se debe a que este problema es complejo.",
      ],
    ],
  },
  {
    levelSlug: "1kyu",
    level: "西検1級",
    toJapanese: [
      [
        "Sería ingenuo pensar que la globalización beneficia a todos los países por igual.",
        "グローバル化があらゆる国に一様に恩恵をもたらすと考えるのは、あまりにも素朴でしょう。",
      ],
      [
        "Son pocos los que, ante semejante dilema, logran mantener la cabeza fría.",
        "そのようなジレンマに直面して冷静さを保てる人はほとんどいません。",
      ],
      [
        "Solo con la distancia del tiempo se puede medir verdaderamente el alcance de este acontecimiento.",
        "この出来事の本当の意味は、時が経ってから初めて測れるものです。",
      ],
      [
        "El autor no se limita a denunciar la injusticia, sino que explora sus raíces más profundas.",
        "著者は不正を告発するだけでなく、その最も深い根源を掘り下げています。",
      ],
      [
        "Mientras no se aborden las causas profundas, los síntomas seguirán reapareciendo.",
        "根本的な原因が対処されない限り、その症状は繰り返し現れ続けるでしょう。",
      ],
    ],
    fromJapanese: [
      [
        "この危機が浮き彫りにしたのは、既存の制度がいかに脆弱であったかという事実にほかならない。",
        "Lo que esta crisis ha puesto de manifiesto es precisamente lo frágiles que eran las instituciones existentes.",
      ],
      [
        "議論を尽くしたところで、双方の溝が埋まる見込みは薄いように思われる。",
        "Por más que se agote el debate, parece poco probable que se cierre la brecha entre ambas partes.",
      ],
      [
        "彼の作品が今なお読み継がれているのは、人間性への深い洞察ゆえである。",
        "Si su obra se sigue leyendo hoy en día, es por su profunda perspicacia sobre la naturaleza humana.",
      ],
      [
        "表面上は些細に見える決定が、後になって重大な結果を招くことは少なくない。",
        "No es raro que una decisión que parece insignificante en la superficie acabe teniendo consecuencias graves.",
      ],
      [
        "危機に際して真価を問われるのは、平時にはめったに試されない資質である。",
        "En tiempos de crisis se ponen a prueba cualidades que rara vez se examinan en tiempos normales.",
      ],
    ],
  },
];

export const TRANSLATION_PROBLEMS: Record<string, TranslationProblem[]> = {
  chinese: buildProblems("cn-zh2ja", "cn-ja2zh", CHINESE_SEEDS),
  french: buildProblems("fr-fr2ja", "fr-ja2fr", FRENCH_SEEDS),
  german: buildProblems("de-de2ja", "de-ja2de", GERMAN_SEEDS),
  spanish: buildProblems("es-es2ja", "es-ja2es", SPANISH_SEEDS),
};

export function getTranslationProblems(
  language: string,
  direction?: TranslationDirection,
): TranslationProblem[] {
  const problems = TRANSLATION_PROBLEMS[language] ?? [];
  return direction ? problems.filter((problem) => problem.direction === direction) : problems;
}

export function getTranslationProblem(
  language: string,
  problemId: string,
): TranslationProblem | undefined {
  return getTranslationProblems(language).find((problem) => problem.id === problemId);
}

// その言語で選べる級の一覧（易しい順）。カスタム題材を選ぶ場合も含め、設定画面で最初に選ばせる級の選択肢に使う
export function getTranslationLevels(language: string): string[] {
  const problems = TRANSLATION_PROBLEMS[language] ?? [];
  return Array.from(new Set(problems.map((problem) => problem.level)));
}
