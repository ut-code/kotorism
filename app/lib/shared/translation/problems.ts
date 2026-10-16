// 翻訳セクションの事前用意問題。
// 初修の第二外国語（大学1年生）で学ぶ範囲の文法項目を網羅するよう、文法項目ごとに
// 外国語→日本語・日本語→外国語をそれぞれ2問ずつ用意している。
// ここに項目を追加していけば、そのまま各言語の翻訳ページの選択肢に反映される。

import type { TranslationDirection } from "./types";

export interface TranslationProblem {
  id: string;
  direction: TranslationDirection;
  // 主に練習する文法項目（例: "複合過去"）
  topic: string;
  // 訳す対象の原文（fromJapaneseなら日本語、toJapaneseならその言語）
  sourceText: string;
  // 模範解答（AIによる採点の参考として使う）
  referenceTranslation: string;
}

// 1つの文法項目の「種データ」。[原文, 模範解答] のタプル配列で持ち、見通しよく管理する
interface TopicSeed {
  topicSlug: string;
  topic: string;
  toJapanese: [string, string][];
  fromJapanese: [string, string][];
}

function buildProblems(
  toJapanesePrefix: string,
  fromJapanesePrefix: string,
  seeds: TopicSeed[],
): TranslationProblem[] {
  const problems: TranslationProblem[] = [];
  for (const seed of seeds) {
    seed.toJapanese.forEach(([sourceText, referenceTranslation], i) => {
      problems.push({
        id: `${toJapanesePrefix}-${seed.topicSlug}-${String(i + 1).padStart(2, "0")}`,
        direction: "toJapanese",
        topic: seed.topic,
        sourceText,
        referenceTranslation,
      });
    });
    seed.fromJapanese.forEach(([sourceText, referenceTranslation], i) => {
      problems.push({
        id: `${fromJapanesePrefix}-${seed.topicSlug}-${String(i + 1).padStart(2, "0")}`,
        direction: "fromJapanese",
        topic: seed.topic,
        sourceText,
        referenceTranslation,
      });
    });
  }
  return problems;
}

// ------------------------------------------------------------------
// 中国語
// ------------------------------------------------------------------

const CHINESE_SEEDS: TopicSeed[] = [
  {
    topicSlug: "shi",
    topic: "「是」の文",
    toJapanese: [
      ["我是大学一年级的学生。", "私は大学1年生です。"],
      ["今天星期三，明天星期四。", "今日は水曜日で、明日は木曜日です。"],
    ],
    fromJapanese: [
      ["彼は私の中国語の先生です。", "他是我的汉语老师。"],
      ["私は日本人で、中国人ではありません。", "我是日本人，不是中国人。"],
    ],
  },
  {
    topicSlug: "adjective",
    topic: "形容詞述語文",
    toJapanese: [
      ["这个菜很好吃。", "この料理はとてもおいしいです。"],
      ["北京的冬天非常冷。", "北京の冬はとても寒いです。"],
    ],
    fromJapanese: [
      ["今日はあまり忙しくありません。", "今天不太忙。"],
      ["彼女の部屋は大きくてきれいです。", "她的房间又大又干净。"],
    ],
  },
  {
    topicSlug: "question",
    topic: "動詞述語文と疑問文",
    toJapanese: [
      ["你喝咖啡吗？", "コーヒーを飲みますか？"],
      ["你们明天来不来？", "君たちは明日来るの？来ないの？"],
    ],
    fromJapanese: [
      ["私は毎朝パンを食べます。", "我每天早上吃面包。"],
      ["あなたは中国語を勉強していますか？", "你学习汉语吗？"],
    ],
  },
  {
    topicSlug: "interrogative",
    topic: "疑問詞",
    toJapanese: [
      ["你叫什么名字？", "お名前は何といいますか？"],
      ["图书馆在哪儿？", "図書館はどこにありますか？"],
    ],
    fromJapanese: [
      ["これはいくらですか？", "这个多少钱？"],
      ["あなたはいつ中国へ行きますか？", "你什么时候去中国？"],
    ],
  },
  {
    topicSlug: "measure-word",
    topic: "量詞と指示詞",
    toJapanese: [
      ["我有三本汉语书。", "私は中国語の本を3冊持っています。"],
      ["那件衣服很漂亮。", "あの服はとてもきれいです。"],
    ],
    fromJapanese: [
      ["この傘は私のです。", "这把伞是我的。"],
      ["うちには猫が2匹います。", "我家有两只猫。"],
    ],
  },
  {
    topicSlug: "you-zai",
    topic: "「有」と「在」",
    toJapanese: [
      ["我家有四口人。", "私の家は4人家族です。"],
      ["邮局在银行旁边。", "郵便局は銀行の隣にあります。"],
    ],
    fromJapanese: [
      ["机の上にパソコンが1台あります。", "桌子上有一台电脑。"],
      ["お母さんは家にいますか？", "你妈妈在家吗？"],
    ],
  },
  {
    topicSlug: "preposition",
    topic: "介詞（在・跟・给・从）",
    toJapanese: [
      ["我在食堂吃午饭。", "私は食堂で昼ご飯を食べます。"],
      ["我跟朋友一起去看电影。", "私は友達と一緒に映画を見に行きます。"],
    ],
    fromJapanese: [
      ["私は母に電話をかけます。", "我给妈妈打电话。"],
      ["駅から大学まで歩いて10分かかります。", "从车站到大学走路要十分钟。"],
    ],
  },
  {
    topicSlug: "auxiliary",
    topic: "助動詞（想・会・能・可以）",
    toJapanese: [
      ["我想去上海旅游。", "私は上海へ旅行に行きたいです。"],
      ["这儿可以抽烟吗？", "ここでタバコを吸ってもいいですか？"],
    ],
    fromJapanese: [
      ["私は車の運転ができます。", "我会开车。"],
      ["明日は雨なので、私は行けません。", "明天下雨，我不能去。"],
    ],
  },
  {
    topicSlug: "time",
    topic: "時刻と時間の長さ",
    toJapanese: [
      ["我每天七点起床。", "私は毎日7時に起きます。"],
      ["我每天学习两个小时汉语。", "私は毎日2時間中国語を勉強します。"],
    ],
    fromJapanese: [
      ["授業は9時に始まります。", "九点开始上课。"],
      ["彼は毎晩1時間テレビを見ます。", "他每天晚上看一个小时电视。"],
    ],
  },
  {
    topicSlug: "le",
    topic: "「了」（完了・変化）",
    toJapanese: [
      ["我昨天买了一件毛衣。", "私は昨日セーターを1枚買いました。"],
      ["天气冷了。", "寒くなりました。"],
    ],
    fromJapanese: [
      ["彼女はもう家に帰りました。", "她已经回家了。"],
      ["私は本を2冊読みました。", "我看了两本书。"],
    ],
  },
  {
    topicSlug: "guo",
    topic: "「过」（経験）",
    toJapanese: [
      ["我去过两次北京。", "私は北京に2回行ったことがあります。"],
      ["你吃过北京烤鸭吗？", "北京ダックを食べたことがありますか？"],
    ],
    fromJapanese: [
      ["私は中国の映画を見たことがありません。", "我没看过中国电影。"],
      ["彼はアメリカに住んだことがあります。", "他在美国住过。"],
    ],
  },
  {
    topicSlug: "progressive",
    topic: "進行と持続（正在・着）",
    toJapanese: [
      ["他正在打电话呢。", "彼はちょうど電話をしているところです。"],
      ["门开着。", "ドアが開いています。"],
    ],
    fromJapanese: [
      ["私たちは授業を受けているところです。", "我们正在上课呢。"],
      ["壁に地図が1枚掛かっています。", "墙上挂着一张地图。"],
    ],
  },
  {
    topicSlug: "result-complement",
    topic: "結果補語",
    toJapanese: [
      ["作业我已经做完了。", "宿題はもう終わりました。"],
      ["我没听懂老师的话。", "先生の話が聞き取れませんでした。"],
    ],
    fromJapanese: [
      ["私は財布を見つけました。", "我找到钱包了。"],
      ["この本を読み終えましたか？", "这本书你看完了吗？"],
    ],
  },
  {
    topicSlug: "direction-complement",
    topic: "方向補語",
    toJapanese: [
      ["老师走进教室来了。", "先生が教室に入ってきました。"],
      ["他从书包里拿出来一本书。", "彼はかばんから本を1冊取り出しました。"],
    ],
    fromJapanese: [
      ["早く上がってきて！", "快上来吧！"],
      ["彼女は図書館から本を1冊借りて帰ってきました。", "她从图书馆借回来一本书。"],
    ],
  },
  {
    topicSlug: "potential-complement",
    topic: "可能補語",
    toJapanese: [
      ["这么多菜，我一个人吃不完。", "こんなにたくさんの料理は、私一人では食べきれません。"],
      ["黑板上的字你看得见吗？", "黒板の字が見えますか？"],
    ],
    fromJapanese: [
      ["先生の中国語が聞き取れますか？", "老师说的汉语你听得懂吗？"],
      ["私は今日は帰って来られません。", "我今天回不来。"],
    ],
  },
  {
    topicSlug: "degree-complement",
    topic: "様態補語",
    toJapanese: [
      ["她汉语说得很流利。", "彼女は中国語をとても流暢に話します。"],
      ["他每天起得很早。", "彼は毎日とても早く起きます。"],
    ],
    fromJapanese: [
      ["彼は走るのがとても速い。", "他跑得很快。"],
      ["昨晩はよく眠れましたか？", "你昨天晚上睡得好吗？"],
    ],
  },
  {
    topicSlug: "comparison",
    topic: "比較",
    toJapanese: [
      ["今天比昨天热。", "今日は昨日より暑いです。"],
      ["我哥哥比我大三岁。", "兄は私より3歳年上です。"],
    ],
    fromJapanese: [
      ["東京は北京ほど寒くありません。", "东京没有北京冷。"],
      ["この服はあの服より少し高いです。", "这件衣服比那件贵一点儿。"],
    ],
  },
  {
    topicSlug: "ba-bei",
    topic: "「把」と「被」",
    toJapanese: [
      ["请把窗户打开。", "窓を開けてください。"],
      ["我的自行车被人偷走了。", "私の自転車が盗まれてしまいました。"],
    ],
    fromJapanese: [
      ["私は辞書をかばんの中に入れました。", "我把词典放在书包里了。"],
      ["ケーキは弟に食べられてしまいました。", "蛋糕被弟弟吃了。"],
    ],
  },
  {
    topicSlug: "shi-de",
    topic: "「是…的」",
    toJapanese: [
      ["你是什么时候来日本的？", "あなたはいつ日本に来たのですか？"],
      ["我是坐飞机来的。", "私は飛行機で来たのです。"],
    ],
    fromJapanese: [
      ["このセーターはどこで買ったのですか？", "这件毛衣是在哪儿买的？"],
      ["私は友達と一緒に来たのです。", "我是跟朋友一起来的。"],
    ],
  },
];

// ------------------------------------------------------------------
// フランス語
// ------------------------------------------------------------------

const FRENCH_SEEDS: TopicSeed[] = [
  {
    topicSlug: "etre-avoir",
    topic: "être と avoir",
    toJapanese: [
      ["Je suis étudiant et j'ai dix-neuf ans.", "私は学生で、19歳です。"],
      [
        "Nous avons un chat. Il est très mignon.",
        "私たちは猫を1匹飼っています。とてもかわいいです。",
      ],
    ],
    fromJapanese: [
      ["彼女はフランス人で、とても親切です。", "Elle est française et elle est très gentille."],
      ["あなたには兄弟姉妹がいますか？", "Vous avez des frères et sœurs ?"],
    ],
  },
  {
    topicSlug: "articles",
    topic: "冠詞",
    toJapanese: [
      [
        "Il y a un livre sur la table. C'est le livre de Paul.",
        "テーブルの上に本が1冊あります。それはポールの本です。",
      ],
      [
        "Le matin, je mange du pain et je bois du café.",
        "朝、私はパンを食べ、コーヒーを飲みます。",
      ],
    ],
    fromJapanese: [
      ["私は音楽が好きです。", "J'aime la musique."],
      ["冷蔵庫にはもう牛乳がありません。", "Il n'y a plus de lait dans le frigo."],
    ],
  },
  {
    topicSlug: "adjectifs",
    topic: "形容詞の性数一致",
    toJapanese: [
      ["C'est une petite maison blanche.", "それは小さな白い家です。"],
      [
        "Mes amies sont grandes et sportives.",
        "私の友人（女性）たちは背が高く、スポーツが得意です。",
      ],
    ],
    fromJapanese: [
      ["これは新しい車です。", "C'est une nouvelle voiture."],
      ["彼女は青い目をしています。", "Elle a les yeux bleus."],
    ],
  },
  {
    topicSlug: "verbes-er",
    topic: "-er動詞の現在形と否定文",
    toJapanese: [
      ["Nous parlons français en classe.", "私たちは授業ではフランス語を話します。"],
      ["Il ne regarde pas la télévision le soir.", "彼は夜テレビを見ません。"],
    ],
    fromJapanese: [
      ["私はパリに住んでいます。", "J'habite à Paris."],
      ["私たちは日曜日には働きません。", "Nous ne travaillons pas le dimanche."],
    ],
  },
  {
    topicSlug: "interrogation",
    topic: "疑問文と疑問詞",
    toJapanese: [
      ["Où est-ce que tu habites ?", "君はどこに住んでいるの？"],
      ["Qu'est-ce que vous faites ce week-end ?", "今週末は何をしますか？"],
    ],
    fromJapanese: [
      ["あなたはフランス語を話しますか？", "Est-ce que vous parlez français ?"],
      ["今何時ですか？", "Quelle heure est-il ?"],
    ],
  },
  {
    topicSlug: "irreguliers",
    topic: "不規則動詞（aller・venir・faire・prendre）",
    toJapanese: [
      ["Je vais à l'université en bus.", "私はバスで大学に行きます。"],
      ["Ils viennent du Canada.", "彼らはカナダ出身です。"],
    ],
    fromJapanese: [
      ["私たちは公園を散歩します。", "Nous faisons une promenade dans le parc."],
      ["彼女は毎朝電車に乗ります。", "Elle prend le train tous les matins."],
    ],
  },
  {
    topicSlug: "futur-proche",
    topic: "近接未来と近接過去",
    toJapanese: [
      ["Le film va commencer dans cinq minutes.", "映画はあと5分で始まります。"],
      ["Je viens de finir mes devoirs.", "私はちょうど宿題を終えたところです。"],
    ],
    fromJapanese: [
      [
        "明日、私たちは祖父母に会いに行くつもりです。",
        "Demain, nous allons rendre visite à nos grands-parents.",
      ],
      ["彼はちょうど駅に着いたところです。", "Il vient d'arriver à la gare."],
    ],
  },
  {
    topicSlug: "possessifs",
    topic: "所有形容詞と指示形容詞",
    toJapanese: [
      [
        "Ce sac est à moi, mais cette valise est à ma sœur.",
        "このかばんは私のものですが、このスーツケースは姉（妹）のものです。",
      ],
      ["Notre professeur est très sympathique.", "私たちの先生はとても感じがいいです。"],
    ],
    fromJapanese: [
      ["これは私の父の車です。", "C'est la voiture de mon père."],
      ["彼女の両親はリヨンに住んでいます。", "Ses parents habitent à Lyon."],
    ],
  },
  {
    topicSlug: "pronominaux",
    topic: "代名動詞",
    toJapanese: [
      ["Je me lève à sept heures tous les jours.", "私は毎日7時に起きます。"],
      ["Comment vous appelez-vous ?", "お名前は何とおっしゃいますか？"],
    ],
    fromJapanese: [
      ["子どもたちは9時に寝ます。", "Les enfants se couchent à neuf heures."],
      ["私たちは駅の前で落ち合います。", "Nous nous retrouvons devant la gare."],
    ],
  },
  {
    topicSlug: "pronoms-objets",
    topic: "目的語の人称代名詞",
    toJapanese: [
      ["Ce livre ? Je le lis maintenant.", "この本？今読んでいるところです。"],
      ["Je lui téléphone ce soir.", "今晩、彼（彼女）に電話します。"],
    ],
    fromJapanese: [
      ["私は彼女をよく知っています。", "Je la connais bien."],
      ["彼らは私たちに道を教えてくれます。", "Ils nous montrent le chemin."],
    ],
  },
  {
    topicSlug: "passe-compose",
    topic: "複合過去",
    toJapanese: [
      [
        "Hier, j'ai visité le musée du Louvre avec mes amis.",
        "昨日、私は友人たちとルーヴル美術館を訪れました。",
      ],
      ["Elle est partie en France l'année dernière.", "彼女は去年フランスへ旅立ちました。"],
    ],
    fromJapanese: [
      ["私たちは昨晩レストランで夕食をとりました。", "Nous avons dîné au restaurant hier soir."],
      ["彼らは何時に家に帰りましたか？", "À quelle heure est-ce qu'ils sont rentrés à la maison ?"],
    ],
  },
  {
    topicSlug: "imparfait",
    topic: "半過去",
    toJapanese: [
      [
        "Quand j'étais petit, j'habitais à la campagne.",
        "子どものころ、私は田舎に住んでいました。",
      ],
      ["Il pleuvait quand je suis sorti.", "私が出かけたとき、雨が降っていました。"],
    ],
    fromJapanese: [
      ["以前、私は毎週末テニスをしていました。", "Avant, je jouais au tennis tous les week-ends."],
      [
        "彼女が電話をかけてきたとき、私はテレビを見ていました。",
        "Je regardais la télévision quand elle m'a téléphoné.",
      ],
    ],
  },
  {
    topicSlug: "futur-simple",
    topic: "単純未来",
    toJapanese: [
      ["L'été prochain, nous irons en Espagne.", "来年の夏、私たちはスペインに行きます。"],
      ["Je te téléphonerai quand j'arriverai à Paris.", "パリに着いたら君に電話するね。"],
    ],
    fromJapanese: [
      ["明日は雨が降るでしょう。", "Il pleuvra demain."],
      ["来年、私は20歳になります。", "L'année prochaine, j'aurai vingt ans."],
    ],
  },
  {
    topicSlug: "comparaison",
    topic: "比較級と最上級",
    toJapanese: [
      ["Paul est plus grand que son frère.", "ポールは兄（弟）より背が高いです。"],
      ["C'est le plus beau jour de ma vie.", "今日は人生で最高の日です。"],
    ],
    fromJapanese: [
      ["電車は車より速い。", "Le train est plus rapide que la voiture."],
      ["彼女は私よりフランス語を上手に話します。", "Elle parle français mieux que moi."],
    ],
  },
  {
    topicSlug: "relatifs",
    topic: "関係代名詞",
    toJapanese: [
      ["J'ai un ami qui habite à Marseille.", "私にはマルセイユに住んでいる友人がいます。"],
      ["Voilà la ville où je suis né.", "あれが私の生まれた町です。"],
    ],
    fromJapanese: [
      ["これは私が昨日買った本です。", "C'est le livre que j'ai acheté hier."],
      ["あなたが話していた映画を見ました。", "J'ai vu le film dont vous parliez."],
    ],
  },
  {
    topicSlug: "imperatif",
    topic: "命令法",
    toJapanese: [
      ["Ferme la fenêtre, s'il te plaît.", "窓を閉めてね。"],
      ["Allons au cinéma ce soir !", "今晩、映画に行こう！"],
    ],
    fromJapanese: [
      ["ここでタバコを吸わないでください。", "Ne fumez pas ici, s'il vous plaît."],
      ["早く起きなさい！", "Lève-toi vite !"],
    ],
  },
  {
    topicSlug: "conditionnel",
    topic: "条件法現在",
    toJapanese: [
      ["Je voudrais un café, s'il vous plaît.", "コーヒーを1杯お願いします。"],
      [
        "Si j'avais de l'argent, je voyagerais autour du monde.",
        "もしお金があれば、世界中を旅行するのに。",
      ],
    ],
    fromJapanese: [
      ["窓を開けていただけますか？", "Pourriez-vous ouvrir la fenêtre ?"],
      ["もし時間があれば、君を手伝うのに。", "Si j'avais le temps, je t'aiderais."],
    ],
  },
  {
    topicSlug: "subjonctif",
    topic: "接続法現在",
    toJapanese: [
      [
        "Il faut que tu finisses ce travail avant midi.",
        "君は正午までにこの仕事を終えなければなりません。",
      ],
      ["Je suis content que vous soyez là.", "あなたが来てくれてうれしいです。"],
    ],
    fromJapanese: [
      ["私は彼に来てほしい。", "Je veux qu'il vienne."],
      ["私たちは明日出発しなければなりません。", "Il faut que nous partions demain."],
    ],
  },
];

// ------------------------------------------------------------------
// ドイツ語
// ------------------------------------------------------------------

const GERMAN_SEEDS: TopicSeed[] = [
  {
    topicSlug: "sein-haben",
    topic: "sein と haben",
    toJapanese: [
      ["Ich bin Studentin. Ich bin zwanzig Jahre alt.", "私は大学生です。20歳です。"],
      ["Wir haben heute Deutschunterricht.", "私たちは今日ドイツ語の授業があります。"],
    ],
    fromJapanese: [
      ["彼は日本人で、東京出身です。", "Er ist Japaner und kommt aus Tokio."],
      ["君には兄弟姉妹がいるの？", "Hast du Geschwister?"],
    ],
  },
  {
    topicSlug: "praesens",
    topic: "動詞の現在人称変化",
    toJapanese: [
      ["Was machst du am Wochenende?", "週末は何をするの？"],
      [
        "Wir wohnen in Berlin und lernen Deutsch.",
        "私たちはベルリンに住んでいて、ドイツ語を学んでいます。",
      ],
    ],
    fromJapanese: [
      ["私は音楽を聴くのが好きです。", "Ich höre gern Musik."],
      ["彼女はよくテニスをします。", "Sie spielt oft Tennis."],
    ],
  },
  {
    topicSlug: "artikel",
    topic: "名詞の性と冠詞（1格・4格）",
    toJapanese: [
      ["Der Tisch ist neu, aber die Lampe ist alt.", "その机は新しいですが、ランプは古いです。"],
      ["Ich kaufe einen Rock und eine Tasche.", "私はスカートとバッグを買います。"],
    ],
    fromJapanese: [
      ["私は辞書が1冊必要です。", "Ich brauche ein Wörterbuch."],
      ["その男性は先生です。", "Der Mann ist Lehrer."],
    ],
  },
  {
    topicSlug: "dativ",
    topic: "3格と人称代名詞",
    toJapanese: [
      ["Ich schenke meiner Mutter Blumen.", "私は母に花を贈ります。"],
      ["Das Buch gefällt mir sehr.", "その本がとても気に入っています。"],
    ],
    fromJapanese: [
      ["私は彼に手紙を書きます。", "Ich schreibe ihm einen Brief."],
      ["そのかばんは誰のものですか？―私のです。", "Wem gehört die Tasche? – Sie gehört mir."],
    ],
  },
  {
    topicSlug: "starke-verben",
    topic: "幹母音が変わる動詞",
    toJapanese: [
      ["Er spricht gut Japanisch.", "彼は日本語を上手に話します。"],
      ["Isst du gern Fisch?", "魚を食べるのは好き？"],
    ],
    fromJapanese: [
      ["彼女は毎晩小説を読みます。", "Sie liest jeden Abend einen Roman."],
      ["彼は明日ミュンヘンへ行きます。", "Er fährt morgen nach München."],
    ],
  },
  {
    topicSlug: "negation",
    topic: "否定（nicht・kein）",
    toJapanese: [
      ["Ich habe heute keine Zeit.", "今日は時間がありません。"],
      ["Das Wetter ist nicht schön.", "天気はよくありません。"],
    ],
    fromJapanese: [
      ["私は車を持っていません。", "Ich habe kein Auto."],
      ["彼はコーヒーを飲みません。", "Er trinkt keinen Kaffee."],
    ],
  },
  {
    topicSlug: "w-fragen",
    topic: "疑問詞",
    toJapanese: [
      ["Wo wohnen Sie?", "どちらにお住まいですか？"],
      ["Warum lernst du Deutsch?", "どうしてドイツ語を勉強しているの？"],
    ],
    fromJapanese: [
      ["今何時ですか？", "Wie spät ist es?"],
      ["そのシャツはいくらですか？", "Wie viel kostet das Hemd?"],
    ],
  },
  {
    topicSlug: "praepositionen",
    topic: "前置詞の格支配",
    toJapanese: [
      [
        "Nach dem Unterricht gehe ich mit meinem Freund in die Bibliothek.",
        "授業の後、私は友人と図書館へ行きます。",
      ],
      ["Die Katze schläft unter dem Tisch.", "猫は机の下で寝ています。"],
    ],
    fromJapanese: [
      ["私は自転車で大学へ行きます。", "Ich fahre mit dem Fahrrad zur Uni."],
      ["彼は本を机の上に置きます。", "Er legt das Buch auf den Tisch."],
    ],
  },
  {
    topicSlug: "artikelwoerter",
    topic: "定冠詞類と不定冠詞類",
    toJapanese: [
      ["Dieser Film ist sehr interessant.", "この映画はとても面白いです。"],
      [
        "Unsere Wohnung ist klein, aber gemütlich.",
        "私たちの住まいは小さいですが、居心地がいいです。",
      ],
    ],
    fromJapanese: [
      ["君はどの本を買うの？", "Welches Buch kaufst du?"],
      ["彼女の兄は医者です。", "Ihr Bruder ist Arzt."],
    ],
  },
  {
    topicSlug: "modalverben",
    topic: "話法の助動詞",
    toJapanese: [
      ["Kannst du Klavier spielen?", "ピアノを弾ける？"],
      ["Hier darf man nicht rauchen.", "ここではタバコを吸ってはいけません。"],
    ],
    fromJapanese: [
      ["私は明日早く起きなければなりません。", "Ich muss morgen früh aufstehen."],
      ["私たちは夏にドイツへ行きたい。", "Wir wollen im Sommer nach Deutschland fahren."],
    ],
  },
  {
    topicSlug: "trennbare-verben",
    topic: "分離動詞",
    toJapanese: [
      ["Der Zug kommt um zehn Uhr in Hamburg an.", "列車は10時にハンブルクに着きます。"],
      ["Ich rufe dich heute Abend an.", "今晩、君に電話するね。"],
    ],
    fromJapanese: [
      ["私は毎朝6時に起きます。", "Ich stehe jeden Morgen um sechs Uhr auf."],
      ["その店は9時に開きます。", "Das Geschäft macht um neun Uhr auf."],
    ],
  },
  {
    topicSlug: "reflexive-verben",
    topic: "再帰動詞",
    toJapanese: [
      ["Ich freue mich auf die Ferien.", "休暇が楽しみです。"],
      ["Setzen Sie sich bitte!", "どうぞお座りください。"],
    ],
    fromJapanese: [
      ["彼女は音楽に興味があります。", "Sie interessiert sich für Musik."],
      ["私たちは駅で会います。", "Wir treffen uns am Bahnhof."],
    ],
  },
  {
    topicSlug: "adjektiv",
    topic: "形容詞の格変化",
    toJapanese: [
      ["Das ist ein schönes Haus mit einem großen Garten.", "それは大きな庭のある素敵な家です。"],
      ["Ich suche eine billige Wohnung.", "私は安い住まいを探しています。"],
    ],
    fromJapanese: [
      ["その赤いセーターは高すぎます。", "Der rote Pullover ist zu teuer."],
      ["私は新しい自転車を買います。", "Ich kaufe ein neues Fahrrad."],
    ],
  },
  {
    topicSlug: "komparation",
    topic: "比較級と最上級",
    toJapanese: [
      ["Mein Bruder ist älter als ich.", "兄は私より年上です。"],
      [
        "Die Zugspitze ist der höchste Berg Deutschlands.",
        "ツークシュピッツェはドイツで一番高い山です。",
      ],
    ],
    fromJapanese: [
      ["私はコーヒーより紅茶を飲む方が好きです。", "Ich trinke lieber Tee als Kaffee."],
      ["今日は昨日より寒い。", "Heute ist es kälter als gestern."],
    ],
  },
  {
    topicSlug: "perfekt",
    topic: "現在完了",
    toJapanese: [
      ["Ich habe gestern einen Brief geschrieben.", "私は昨日手紙を書きました。"],
      ["Wir sind letztes Jahr nach Wien gefahren.", "私たちは去年ウィーンに行きました。"],
    ],
    fromJapanese: [
      ["君はもう朝ごはんを食べた？", "Hast du schon gefrühstückt?"],
      ["彼女は昨晩遅く帰宅しました。", "Sie ist gestern Abend spät nach Hause gekommen."],
    ],
  },
  {
    topicSlug: "praeteritum",
    topic: "過去形",
    toJapanese: [
      ["Als Kind war ich oft krank.", "子どものころ、私はよく病気をしていました。"],
      ["Wir hatten gestern keine Zeit.", "私たちは昨日時間がありませんでした。"],
    ],
    fromJapanese: [
      ["昨日は天気が良かった。", "Gestern war das Wetter schön."],
      ["子どものころ、私はピアノが弾けました。", "Als Kind konnte ich Klavier spielen."],
    ],
  },
  {
    topicSlug: "nebensatz",
    topic: "従属接続詞と副文",
    toJapanese: [
      ["Ich bleibe zu Hause, weil ich erkältet bin.", "風邪をひいているので、私は家にいます。"],
      ["Weißt du, ob er morgen kommt?", "彼が明日来るかどうか知ってる？"],
    ],
    fromJapanese: [
      ["私は、彼女は親切だと思います。", "Ich glaube, dass sie nett ist."],
      [
        "天気が良ければ、私たちは散歩をします。",
        "Wenn das Wetter schön ist, machen wir einen Spaziergang.",
      ],
    ],
  },
  {
    topicSlug: "zu-infinitiv",
    topic: "zu 不定詞",
    toJapanese: [
      ["Ich habe keine Lust, heute zu arbeiten.", "今日は働く気になれません。"],
      ["Es ist nicht leicht, Deutsch zu lernen.", "ドイツ語を学ぶのは簡単ではありません。"],
    ],
    fromJapanese: [
      [
        "私は来年ドイツに留学するつもりです。",
        "Ich habe vor, nächstes Jahr in Deutschland zu studieren.",
      ],
      ["ドイツ語を話すのは楽しい。", "Es macht Spaß, Deutsch zu sprechen."],
    ],
  },
  {
    topicSlug: "relativpronomen",
    topic: "関係代名詞",
    toJapanese: [
      ["Der Mann, der dort steht, ist mein Lehrer.", "あそこに立っている男性は私の先生です。"],
      ["Das ist das Buch, das ich gestern gekauft habe.", "これは私が昨日買った本です。"],
    ],
    fromJapanese: [
      ["私にはベルリンに住んでいる友人がいます。", "Ich habe einen Freund, der in Berlin wohnt."],
      [
        "君がくれたかばんを私は毎日使っています。",
        "Ich benutze jeden Tag die Tasche, die du mir geschenkt hast.",
      ],
    ],
  },
  {
    topicSlug: "passiv",
    topic: "受動態",
    toJapanese: [
      ["In Österreich wird Deutsch gesprochen.", "オーストリアではドイツ語が話されています。"],
      ["Das Haus wurde 1900 gebaut.", "その家は1900年に建てられました。"],
    ],
    fromJapanese: [
      ["その窓は毎朝開けられます。", "Das Fenster wird jeden Morgen geöffnet."],
      ["その本は多くの人に読まれています。", "Das Buch wird von vielen Menschen gelesen."],
    ],
  },
  {
    topicSlug: "konjunktiv-2",
    topic: "接続法第2式",
    toJapanese: [
      ["Wenn ich Zeit hätte, würde ich dich besuchen.", "時間があれば君を訪ねるのに。"],
      ["Könnten Sie mir bitte helfen?", "手伝っていただけますか？"],
    ],
    fromJapanese: [
      [
        "もし私が鳥だったら、君のところへ飛んで行くのに。",
        "Wenn ich ein Vogel wäre, würde ich zu dir fliegen.",
      ],
      ["コーヒーを1杯いただきたいのですが。", "Ich hätte gern einen Kaffee."],
    ],
  },
];

// ------------------------------------------------------------------
// スペイン語
// ------------------------------------------------------------------

const SPANISH_SEEDS: TopicSeed[] = [
  {
    topicSlug: "ser-estar",
    topic: "ser と estar",
    toJapanese: [
      ["Soy estudiante y soy de Osaka.", "私は学生で、大阪出身です。"],
      ["Hoy estoy muy cansado.", "今日はとても疲れています。"],
    ],
    fromJapanese: [
      ["マドリードはスペインの首都です。", "Madrid es la capital de España."],
      ["図書館は駅の近くにあります。", "La biblioteca está cerca de la estación."],
    ],
  },
  {
    topicSlug: "articulos",
    topic: "名詞・冠詞・形容詞",
    toJapanese: [
      ["Tengo un perro blanco y dos gatos negros.", "私は白い犬を1匹と黒い猫を2匹飼っています。"],
      ["Las chicas son muy simpáticas.", "その女の子たちはとても感じがいいです。"],
    ],
    fromJapanese: [
      ["これは面白い本です。", "Este es un libro interesante."],
      ["その家は大きくて新しい。", "La casa es grande y nueva."],
    ],
  },
  {
    topicSlug: "presente-regular",
    topic: "規則動詞の現在形",
    toJapanese: [
      ["Hablamos español en clase.", "私たちは授業でスペイン語を話します。"],
      ["¿Dónde vives?", "どこに住んでいるの？"],
    ],
    fromJapanese: [
      ["私は毎朝コーヒーを飲みます。", "Bebo café todas las mañanas."],
      ["彼らは大学で英語を勉強しています。", "Estudian inglés en la universidad."],
    ],
  },
  {
    topicSlug: "presente-irregular",
    topic: "不規則動詞の現在形",
    toJapanese: [
      ["Quiero ir a México algún día.", "いつかメキシコに行きたいです。"],
      ["¿Puedes cerrar la ventana?", "窓を閉めてくれる？"],
    ],
    fromJapanese: [
      ["私は7時に家を出ます。", "Salgo de casa a las siete."],
      ["彼女は毎日8時間眠ります。", "Ella duerme ocho horas todos los días."],
    ],
  },
  {
    topicSlug: "hay",
    topic: "hay と estar（存在・所在）",
    toJapanese: [
      [
        "Hay un restaurante muy bueno en esta calle.",
        "この通りにはとてもおいしいレストランがあります。",
      ],
      ["¿Hay un banco por aquí?", "この辺りに銀行はありますか？"],
    ],
    fromJapanese: [
      ["机の上に本が3冊あります。", "Hay tres libros en la mesa."],
      ["私の鍵はどこにありますか？", "¿Dónde están mis llaves?"],
    ],
  },
  {
    topicSlug: "gustar",
    topic: "gustar 型の動詞",
    toJapanese: [
      ["Me gusta mucho la música latina.", "ラテン音楽が大好きです。"],
      ["A mi hermano le duele la cabeza.", "兄（弟）は頭が痛いです。"],
    ],
    fromJapanese: [
      ["私たちはサッカーが好きです。", "Nos gusta el fútbol."],
      ["君はどんな映画が好き？", "¿Qué películas te gustan?"],
    ],
  },
  {
    topicSlug: "interrogativos",
    topic: "疑問詞",
    toJapanese: [
      ["¿Cuántos años tienes?", "何歳？"],
      ["¿Por qué estudias español?", "どうしてスペイン語を勉強しているの？"],
    ],
    fromJapanese: [
      ["お名前は何とおっしゃいますか？", "¿Cómo se llama usted?"],
      ["このシャツはいくらですか？", "¿Cuánto cuesta esta camisa?"],
    ],
  },
  {
    topicSlug: "pronombres",
    topic: "目的格人称代名詞",
    toJapanese: [
      ["¿Conoces a María? —Sí, la conozco.", "マリアを知ってる？―うん、知ってるよ。"],
      ["Te escribo un correo esta noche.", "今晩、君にメールを書くね。"],
    ],
    fromJapanese: [
      ["その本を私に貸してくれる？", "¿Me prestas el libro?"],
      ["私は彼にプレゼントをあげます。", "Le doy un regalo."],
    ],
  },
  {
    topicSlug: "reflexivos",
    topic: "再帰動詞",
    toJapanese: [
      ["Me levanto a las seis todos los días.", "私は毎日6時に起きます。"],
      ["¿Cómo te llamas?", "名前は何ていうの？"],
    ],
    fromJapanese: [
      ["子どもたちは9時に寝ます。", "Los niños se acuestan a las nueve."],
      ["彼は毎朝シャワーを浴びます。", "Él se ducha todas las mañanas."],
    ],
  },
  {
    topicSlug: "perifrasis",
    topic: "ir a・tener que",
    toJapanese: [
      ["Voy a visitar a mis abuelos este fin de semana.", "今週末、祖父母を訪ねるつもりです。"],
      ["Tenemos que estudiar para el examen.", "私たちは試験のために勉強しなければなりません。"],
    ],
    fromJapanese: [
      ["明日は雨が降りそうです。", "Mañana va a llover."],
      ["君は早く寝なければいけない。", "Tienes que acostarte temprano."],
    ],
  },
  {
    topicSlug: "comparativos",
    topic: "比較級と最上級",
    toJapanese: [
      ["Mi hermana es más alta que yo.", "姉（妹）は私より背が高いです。"],
      ["Este es el mejor restaurante de la ciudad.", "ここは町で一番のレストランです。"],
    ],
    fromJapanese: [
      ["東京は大阪より大きい。", "Tokio es más grande que Osaka."],
      ["私は兄ほど速く走れません。", "No corro tan rápido como mi hermano."],
    ],
  },
  {
    topicSlug: "preterito-perfecto",
    topic: "現在完了",
    toJapanese: [
      ["Hoy he comido paella.", "今日はパエリアを食べました。"],
      ["¿Has estado alguna vez en Perú?", "ペルーに行ったことはある？"],
    ],
    fromJapanese: [
      ["私はまだ宿題を終えていません。", "Todavía no he terminado los deberes."],
      ["今朝、彼らは早く起きました。", "Esta mañana se han levantado temprano."],
    ],
  },
  {
    topicSlug: "indefinido",
    topic: "点過去",
    toJapanese: [
      ["Ayer fui al cine con mis amigos.", "昨日、友達と映画を見に行きました。"],
      ["Cervantes escribió el Quijote.", "セルバンテスは『ドン・キホーテ』を書きました。"],
    ],
    fromJapanese: [
      ["先週、私たちはバルセロナを訪れました。", "La semana pasada visitamos Barcelona."],
      ["彼女は2005年に生まれました。", "Ella nació en 2005."],
    ],
  },
  {
    topicSlug: "imperfecto",
    topic: "線過去",
    toJapanese: [
      [
        "Cuando era niño, jugaba al fútbol todos los días.",
        "子どものころ、私は毎日サッカーをしていました。",
      ],
      ["Hacía buen tiempo cuando salimos.", "私たちが出かけたとき、天気が良かったです。"],
    ],
    fromJapanese: [
      ["以前、私はバレンシアに住んでいました。", "Antes vivía en Valencia."],
      ["君が電話してきたとき、私は寝ていました。", "Dormía cuando me llamaste."],
    ],
  },
  {
    topicSlug: "futuro",
    topic: "未来形",
    toJapanese: [
      ["El año que viene viajaré por Sudamérica.", "来年、私は南米を旅行します。"],
      ["¿Qué hora será?", "今何時だろう？"],
    ],
    fromJapanese: [
      ["明日は晴れるでしょう。", "Mañana hará buen tiempo."],
      ["彼らは来週来るでしょう。", "Vendrán la semana que viene."],
    ],
  },
  {
    topicSlug: "imperativo",
    topic: "命令法",
    toJapanese: [
      ["Abre la ventana, por favor.", "窓を開けてね。"],
      ["No hablen en voz alta, por favor.", "大きな声で話さないでください。"],
    ],
    fromJapanese: [
      ["どうぞここにお座りください。", "Siéntese aquí, por favor."],
      ["早く来て！", "¡Ven pronto!"],
    ],
  },
  {
    topicSlug: "subjuntivo",
    topic: "接続法現在",
    toJapanese: [
      ["Quiero que vengas a mi fiesta.", "君に私のパーティーに来てほしい。"],
      ["Es posible que llueva mañana.", "明日は雨が降るかもしれません。"],
    ],
    fromJapanese: [
      ["早く良くなるといいね。", "Espero que te mejores pronto."],
      ["彼が着く前に出かけよう。", "Vamos a salir antes de que llegue él."],
    ],
  },
  {
    topicSlug: "relativos",
    topic: "関係詞",
    toJapanese: [
      ["El chico que está allí es mi primo.", "あそこにいる男の子は私のいとこです。"],
      ["Esta es la casa donde nací.", "これは私が生まれた家です。"],
    ],
    fromJapanese: [
      ["これは私が昨日買った本です。", "Este es el libro que compré ayer."],
      ["私にはメキシコに住んでいる友人がいます。", "Tengo un amigo que vive en México."],
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

// その言語の文法項目の一覧（学ぶ順）。設定画面で問題を絞り込む選択肢に使う
export function getTranslationTopics(language: string): string[] {
  const problems = TRANSLATION_PROBLEMS[language] ?? [];
  return Array.from(new Set(problems.map((problem) => problem.topic)));
}
