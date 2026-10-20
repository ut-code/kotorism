import {
  BLANK,
  type GrammarQuestion as Question,
  type GrammarUnitDef,
} from "@/lib/shared/learn/grammar-quiz";

// 出題の単元。格変化に関わる文法は 05「文法クイズ（格変化）」で扱い、ここではそれ以外を扱う
export const grammarUnits = [
  { id: "word-order", label: "語順", sub: "定動詞第2位・分離動詞・副文" },
  { id: "negation", label: "否定", sub: "nicht・kein" },
  { id: "perfect", label: "現在完了の助動詞", sub: "haben / sein" },
  { id: "modal", label: "話法の助動詞", sub: "müssen・dürfen・können…" },
] as const satisfies readonly GrammarUnitDef[];

type GrammarQuestion = Question<(typeof grammarUnits)[number]["id"]>;

// 文法クイズの出題データ。問題は単元ごとにまとめ、units に単元タグ（grammarUnits の id）を付ける。
// 複数の単元にまたがる問題は、タグを複数付ければどちらの単元を選んでも出題される

// ── 語順 ──
const wordOrderQuestions: GrammarQuestion[] = [
  {
    focus: "form",
    id: "wo-form-v2",
    units: ["word-order"],
    prompt: "明日、私はベルリンへ行く。",
    choices: [
      "Morgen ich fahre nach Berlin.",
      "Morgen fahre ich nach Berlin.",
      "Morgen ich nach Berlin fahre.",
      "Morgen nach Berlin ich fahre.",
    ],
    answer: "Morgen fahre ich nach Berlin.",
    explanation:
      "平叙文では定動詞が必ず2番目に来ます。Morgen を文頭に置いたら、次に定動詞 fahre、その後に主語 ich が続きます。英語のように「副詞 + 主語 + 動詞」とはなりません。",
  },
  {
    focus: "form",
    id: "wo-form-weil",
    units: ["word-order"],
    prompt: "彼は病気なので来ない。",
    choices: [
      "Er kommt nicht, weil er ist krank.",
      "Er kommt nicht, weil ist er krank.",
      "Er kommt nicht, weil er krank ist.",
      "Er kommt nicht, weil krank er ist.",
    ],
    answer: "Er kommt nicht, weil er krank ist.",
    explanation:
      "weil・dass・wenn・ob などの従属接続詞で始まる副文では、定動詞が文末に来ます。話し言葉では weil er ist krank も耳にしますが、書き言葉では誤りとされます。",
  },
  {
    focus: "context",
    id: "wo-context-separable",
    units: ["word-order"],
    prompt: `A: Wann fängt der Film an?\nB: ${BLANK}`,
    note: "A「映画は何時に始まるの？」 B「8時に始まるよ」",
    choices: [
      "Der Film anfängt um acht.",
      "Der Film um acht anfängt.",
      "Der Film fängt um acht an.",
      "Um acht der Film fängt an.",
    ],
    answer: "Der Film fängt um acht an.",
    explanation:
      "anfangen は分離動詞で、平叙文では前つづり an が文末に離れ、fängt が2番目に来ます。質問の Wann fängt der Film an? も同じ形です。前つづりが動詞とくっつくのは、副文の文末（…, dass der Film um acht anfängt）などです。",
  },
  {
    focus: "blank",
    id: "wo-blank-dass",
    units: ["word-order"],
    prompt: `Ich glaube, dass ${BLANK}.`,
    note: "彼は明日来ると思う。",
    choices: ["er kommt morgen", "kommt er morgen", "er morgen kommt", "morgen er kommt"],
    answer: "er morgen kommt",
    explanation:
      "dass で始まる副文では、定動詞 kommt を文末に置きます。主語 er は dass のすぐ後に置くのがふつうです。",
  },
  {
    focus: "blank",
    id: "wo-blank-inversion",
    units: ["word-order"],
    prompt: `Heute ${BLANK} ins Kino.`,
    note: "今日、私たちは映画館へ行く。",
    choices: ["wir gehen", "gehen", "gehen wir", "wir"],
    answer: "gehen wir",
    explanation:
      "Heute が1番目に来ているので、2番目は定動詞 gehen で、主語 wir はその後に置きます（定動詞第2位）。主語 wir や定動詞 gehen のどちらかが欠けても文になりません。主語で文を始めるなら Wir gehen heute ins Kino. です。",
  },
  {
    focus: "blank",
    id: "wo-blank-aufstehen",
    units: ["word-order"],
    prompt: `Ich ${BLANK} jeden Tag um sechs Uhr auf.`,
    note: "私は毎日6時に起きる。",
    choices: ["aufstehe", "stehe", "aufstehen", "stehen"],
    answer: "stehe",
    explanation:
      "aufstehen は分離動詞で、平叙文では基礎動詞 stehe が2番目に、前つづり auf が文末に来ます。文末にすでに auf があるので、空欄には stehe だけが入ります。主語 ich に合わせて語尾は -e です。",
  },
];

// ── 否定 ──
const negationQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "neg-meaning-kein",
    units: ["negation"],
    prompt: "Er hat keinen Bruder.",
    choices: [
      "彼は私の兄弟ではない。",
      "私には兄弟がいない。",
      "彼には兄弟がいない。",
      "彼は兄弟と仲がよくない。",
    ],
    answer: "彼には兄弟がいない。",
    explanation:
      "kein は「不定冠詞 ein + 名詞」や無冠詞の名詞を否定する否定冠詞で、「一人も・一つも〜ない」を表します。Bruder は男性名詞で haben の4格の目的語なので keinen です。「彼は私の兄弟ではない」なら Er ist nicht mein Bruder. です。",
  },
  {
    focus: "form",
    id: "neg-form-kein-auto",
    units: ["negation"],
    prompt: "私は車を持っていない。",
    choices: [
      "Ich habe nicht Auto.",
      "Ich habe kein Auto.",
      "Ich habe nicht ein Auto.",
      "Ich habe keinen Auto.",
    ],
    answer: "Ich habe kein Auto.",
    explanation:
      "「ein + 名詞」を否定するときは nicht ein ではなく kein を使います。kein は ein と同じ語尾をとり、Auto は中性名詞なので4格でも kein です。keinen は男性4格の形です。",
  },
  {
    focus: "context",
    id: "neg-context-nicht",
    units: ["negation"],
    prompt: `A: Kommst du heute?\nB: Nein, ich komme heute ${BLANK}.`,
    note: "A「今日来る？」 B「ううん、今日は行かないよ」",
    choices: ["kein", "keine", "nicht", "nein"],
    answer: "nicht",
    explanation:
      "動詞（kommen）を否定するときは nicht を使い、ふつう文末に置きます。kein は名詞を否定する冠詞なので、名詞のない所には使えません。nein は「いいえ」という返事の言葉です。",
  },
  {
    focus: "blank",
    id: "neg-blank-kein-problem",
    units: ["negation"],
    prompt: `Das ist ${BLANK} Problem.`,
    note: "それは問題じゃないよ。",
    choices: ["nicht", "keine", "keinen", "kein"],
    answer: "kein",
    explanation:
      "不定冠詞が付くはずの名詞（ein Problem）を否定するので kein です。Problem は中性名詞で、sein の後ろは1格なので語尾のない kein になります。",
  },
  {
    focus: "blank",
    id: "neg-blank-keinen-kaffee",
    units: ["negation"],
    prompt: `Ich trinke ${BLANK} Kaffee.`,
    note: "私はコーヒーを飲まない。",
    choices: ["nicht", "keinen", "kein", "keine"],
    answer: "keinen",
    explanation:
      "無冠詞の名詞（Kaffee trinken）も kein で否定します。Kaffee は男性名詞で trinken の4格の目的語なので、男性4格の keinen です。",
  },
  {
    focus: "blank",
    id: "neg-blank-nicht-definite",
    units: ["negation"],
    prompt: `Ich kenne den Mann ${BLANK}.`,
    note: "私はその男性を知らない。",
    choices: ["kein", "nicht", "keinen", "nein"],
    answer: "nicht",
    explanation:
      "定冠詞の付いた名詞（den Mann）や固有名詞は kein ではなく nicht で否定し、nicht は文末に置きます。kein で否定するのは不定冠詞の付く名詞と無冠詞の名詞だけです。",
  },
];

// ── 現在完了の助動詞 ──
const perfectQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "perf-meaning-sein",
    units: ["perfect"],
    prompt: "Ich bin nach Hause gegangen.",
    choices: [
      "私は家に帰るところだ。",
      "私は家に帰るつもりだ。",
      "私は家にいた。",
      "私は家に帰った。",
    ],
    answer: "私は家に帰った。",
    explanation:
      "sein + 過去分詞（gegangen）は現在完了で、話し言葉では過去のできごとを表すのにふつう使います。gehen のような場所の移動を表す自動詞は、haben ではなく sein と組みます。",
  },
  {
    focus: "form",
    id: "perf-form-haben",
    units: ["perfect"],
    prompt: "私たちは昨日サッカーをした。",
    choices: [
      "Wir sind gestern Fußball gespielt.",
      "Wir haben gestern gespielt Fußball.",
      "Wir sind gestern gespielt Fußball.",
      "Wir haben gestern Fußball gespielt.",
    ],
    answer: "Wir haben gestern Fußball gespielt.",
    explanation:
      "spielen は目的語をとる動詞なので、現在完了の助動詞は haben です。助動詞 haben が2番目に、過去分詞 gespielt が文末に来て「枠構造」を作ります。",
  },
  {
    focus: "context",
    id: "perf-context-bleiben",
    units: ["perfect"],
    prompt: `A: Wo warst du gestern?\nB: Ich ${BLANK} zu Hause geblieben.`,
    note: "A「昨日はどこにいたの？」 B「家にいたよ」",
    choices: ["habe", "hat", "bin", "ist"],
    answer: "bin",
    explanation:
      "bleiben（とどまる）は移動を表しませんが、sein・werden と並んで、現在完了で sein をとる動詞です。主語 ich に合わせて bin を使います。",
  },
  {
    focus: "blank",
    id: "perf-blank-aufstehen",
    units: ["perfect", "word-order"],
    prompt: `Er ${BLANK} gestern spät aufgestanden.`,
    note: "彼は昨日遅く起きた。",
    choices: ["hat", "ist", "habe", "bin"],
    answer: "ist",
    explanation:
      "aufstehen（起きる）は「寝ている状態から起きた状態へ」の状態の変化を表す自動詞なので、sein と組みます。分離動詞の過去分詞は auf-ge-standen のように、前つづりと基礎動詞の間に ge が入ります。",
  },
  {
    focus: "blank",
    id: "perf-blank-schreiben",
    units: ["perfect"],
    prompt: `Ich ${BLANK} einen Brief geschrieben.`,
    note: "私は手紙を書いた。",
    choices: ["bin", "habe", "hat", "ist"],
    answer: "habe",
    explanation:
      "schreiben は4格の目的語（einen Brief）をとる他動詞なので、haben と組みます。ドイツ語の動詞の多くは haben で、sein をとるのは移動・状態の変化を表す自動詞などに限られます。",
  },
  {
    focus: "blank",
    id: "perf-blank-fahren",
    units: ["perfect"],
    prompt: `Wir ${BLANK} mit dem Zug nach München gefahren.`,
    note: "私たちは列車でミュンヘンへ行った。",
    choices: ["haben", "seid", "habt", "sind"],
    answer: "sind",
    explanation:
      "乗り物で「行く」という移動の fahren は sein と組み、主語 wir に合わせて sind です。ただし「車を運転する」のように目的語をとる fahren は haben と組みます（Ich habe das Auto gefahren.）。",
  },
];

// ── 話法の助動詞 ──
const modalQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "modal-meaning-nicht-muessen",
    units: ["modal"],
    prompt: "Du musst heute nicht kommen.",
    choices: [
      "今日は来てはいけない。",
      "今日は来なくてもいい。",
      "今日は来られない。",
      "今日は来たくない。",
    ],
    answer: "今日は来なくてもいい。",
    explanation:
      "müssen（〜しなければならない）の否定 nicht müssen は「〜しなくてもいい・〜する必要はない」です。「してはいけない」は nicht dürfen、「来られない」は nicht können、「来たくない」は nicht wollen で表します。",
  },
  {
    focus: "form",
    id: "modal-form-nicht-duerfen",
    units: ["modal"],
    prompt: "ここでタバコを吸ってはいけません。",
    choices: [
      "Hier muss man nicht rauchen.",
      "Hier will man nicht rauchen.",
      "Hier darf man nicht rauchen.",
      "Hier darf man nicht zu rauchen.",
    ],
    answer: "Hier darf man nicht rauchen.",
    explanation:
      "禁止は dürfen（〜してよい）の否定 nicht dürfen で表します。nicht müssen は「吸わなくてもいい」になるので注意が必要です。話法の助動詞と一緒に使う動詞は zu の付かない不定詞で、文末に置きます。",
  },
  {
    focus: "context",
    id: "modal-context-muessen",
    units: ["modal"],
    prompt: `A: Kommst du mit ins Kino?\nB: Leider nicht. Ich ${BLANK} noch Hausaufgaben machen.`,
    note: "A「一緒に映画に行かない？」 B「残念だけど行けない。まだ宿題をしなきゃいけないんだ」",
    choices: ["darf", "muss", "will", "mag"],
    answer: "muss",
    explanation:
      "誘いを断る理由として「〜しなければならない」と言うので müssen です。will だと「宿題をしたい」、darf だと「宿題をしてもいい」になり、断る理由として不自然です。",
  },
  {
    focus: "blank",
    id: "modal-blank-duerfen",
    units: ["modal"],
    prompt: `${BLANK} ich das Fenster öffnen?`,
    note: "窓を開けてもいいですか？",
    choices: ["Muss", "Will", "Darf", "Soll"],
    answer: "Darf",
    explanation:
      "許可を求める「〜してもいいですか」は dürfen を使います。Soll ich das Fenster öffnen? は「窓を開けましょうか」と相手の意向を尋ねる言い方、Muss ich…? は「開けなければいけませんか」です。",
  },
  {
    focus: "blank",
    id: "modal-blank-koennen",
    units: ["modal"],
    prompt: `Er ${BLANK} sehr gut Klavier spielen.`,
    note: "彼はピアノをとても上手に弾ける。",
    choices: ["darf", "muss", "will", "kann"],
    answer: "kann",
    explanation:
      "能力の「〜できる」は können で、主語 er に合わせて kann です。話法の助動詞は単数で語幹の母音が変わり（können → kann）、1人称・3人称単数で語尾が付きません。",
  },
  {
    focus: "blank",
    id: "modal-blank-wollen",
    units: ["modal"],
    prompt: `Ich ${BLANK} später Ärztin werden.`,
    note: "私は将来、医者になりたい。",
    choices: ["soll", "will", "darf", "muss"],
    answer: "will",
    explanation:
      "「〜したい・〜するつもりだ」という本人の意志は wollen で、ich に合わせて will です。soll だと「（人から言われて）なることになっている」、muss は「ならなければならない」になります。",
  },
];

export const grammarQuiz: GrammarQuestion[] = [
  ...wordOrderQuestions,
  ...negationQuestions,
  ...perfectQuestions,
  ...modalQuestions,
];
