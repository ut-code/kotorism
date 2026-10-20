import {
  BLANK,
  type GrammarQuestion as Question,
  type GrammarUnitDef,
} from "@/lib/shared/learn/grammar-quiz";

// 出題の単元。06「文法クイズ（紛らわしい表現）」で扱う使い分け（ser/estar・点過去/線過去・por/para・
// hay/estar）とは重ならない、基本の文法事項を選ぶ
export const grammarUnits = [
  { id: "pronoun", label: "目的格の代名詞", sub: "lo・la・le・se lo" },
  { id: "reflexive", label: "再帰動詞", sub: "levantarse・llamarse…" },
  { id: "gustar", label: "gustar 型の動詞", sub: "me gusta・me gustan…" },
  { id: "negation", label: "否定表現", sub: "no・nunca・nada・nadie" },
  { id: "interrogative", label: "疑問詞", sub: "qué・cuál・cómo…" },
  { id: "comparison", label: "比較級・最上級", sub: "más・tan・mejor" },
] as const satisfies readonly GrammarUnitDef[];

type GrammarQuestion = Question<(typeof grammarUnits)[number]["id"]>;

// 文法クイズの出題データ。問題は単元ごとにまとめ、units に単元タグ（grammarUnits の id）を付ける。
// 複数の単元にまたがる問題は、タグを複数付ければどちらの単元を選んでも出題される

// ── 目的格の代名詞 ──
const pronounQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "pron-meaning-se-lo",
    units: ["pronoun"],
    prompt: "Se lo di a María.",
    choices: [
      "マリアが私にそれをくれた。",
      "私はそれをマリアにあげた。",
      "マリアはそれを自分に買った。",
      "私はマリアからそれをもらった。",
    ],
    answer: "私はそれをマリアにあげた。",
    explanation:
      "di は dar（あげる）の点過去・1人称単数です。間接目的語 le（彼女に）と直接目的語 lo（それを）が並ぶと、le は se に変わって se lo になります。a María は se が誰を指すかをはっきりさせています。",
  },
  {
    focus: "form",
    id: "pron-form-la",
    units: ["pronoun"],
    prompt: "私は彼女を知っている。",
    choices: ["Conozco la.", "Lo conozco.", "La conozco.", "Me conozco."],
    answer: "La conozco.",
    explanation:
      "「彼女を」は直接目的語の la で、活用した動詞の前に置きます（Conozco la. は誤り）。lo は「彼を・それを」、me conozco は「自分のことを知っている」です。",
  },
  {
    focus: "context",
    id: "pron-context-lo",
    units: ["pronoun"],
    prompt: `A: ¿Dónde está mi libro?\nB: ${BLANK} tengo yo. Te lo doy ahora.`,
    note: "A「私の本どこ？」 B「私が持ってるよ。今渡すね」",
    choices: ["Le", "La", "Lo", "Se"],
    answer: "Lo",
    explanation:
      "mi libro（男性単数）を「それを」と受けるので直接目的語の lo です。la は女性単数、le は「〜に」を表す間接目的語、se は le・les が lo などの前に来たときの形です。",
  },
  {
    focus: "blank",
    id: "pron-blank-las",
    units: ["pronoun"],
    prompt: `¿Las llaves? No ${BLANK} encuentro.`,
    note: "鍵？見つからないんだ。",
    choices: ["los", "les", "las", "la"],
    answer: "las",
    explanation:
      "las llaves（女性複数）を受けるので las です。否定の no は代名詞の前に置きます（No las encuentro.）。les は「彼ら・彼女らに」を表す間接目的語です。",
  },
  {
    focus: "blank",
    id: "pron-blank-les",
    units: ["pronoun"],
    prompt: `${BLANK} escribo una carta a mis abuelos cada mes.`,
    note: "毎月、祖父母に手紙を書いている。",
    choices: ["Los", "Las", "Les", "Se"],
    answer: "Les",
    explanation:
      "「祖父母に」は間接目的語なので les です。una carta（手紙を）が直接目的語なので、los は使いません。スペイン語では a mis abuelos があっても les を重ねて置くのがふつうです。",
  },
  {
    focus: "blank",
    id: "pron-blank-se-lo",
    units: ["pronoun"],
    prompt: `¿El regalo para Ana? Ya ${BLANK} di ayer.`,
    note: "アナへのプレゼント？もう昨日渡したよ。",
    choices: ["le lo", "lo le", "se lo", "se le"],
    answer: "se lo",
    explanation:
      "「彼女に（le）」と「それを（lo）」が並ぶと le lo とはならず、le が se に変わって se lo になります。順序は間接目的語が先です。",
  },
];

// ── gustar 型の動詞 ──
const gustarQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "gus-meaning-encantar",
    units: ["gustar"],
    prompt: "Me encantan los perros.",
    choices: [
      "犬たちは私のことが大好きだ。",
      "私は犬を飼いたい。",
      "私は犬が少し好きだ。",
      "私は犬が大好きだ。",
    ],
    answer: "私は犬が大好きだ。",
    explanation:
      "encantar は gustar と同じ型の動詞で、「〜（主語）が me（私に）とても気に入る」という形で「私は〜が大好きだ」を表します。主語は los perros なので動詞は複数形の encantan です。「犬が私を好き」なら Los perros me quieren. などになります。",
  },
  {
    focus: "form",
    id: "gus-form-futbol",
    units: ["gustar"],
    prompt: "私はサッカーが好きだ。",
    choices: [
      "Yo gusto el fútbol.",
      "Me gusta el fútbol.",
      "Me gusto el fútbol.",
      "Me gusta fútbol.",
    ],
    answer: "Me gusta el fútbol.",
    explanation:
      "gustar は「〜が（人に）気に入る」という動詞で、好きなもの（el fútbol）が主語、好きな人は me・te・le などで表します。好みを言うときの名詞には定冠詞を付けるので、Me gusta fútbol. とはしません。",
  },
  {
    focus: "context",
    id: "gus-context-tampoco",
    units: ["gustar"],
    prompt: `A: No me gusta el café.\nB: A mí ${BLANK}. Prefiero el té.`,
    note: "A「コーヒーは好きじゃないんだ」 B「私も。紅茶のほうがいい」",
    choices: ["también", "sí", "tampoco", "nunca"],
    answer: "tampoco",
    explanation:
      "否定の文に「私も（〜ない）」と同意するときは tampoco を使います。también は肯定の文への同意、A mí sí. は「私は好きだよ」という反対の答えになり、後ろの「紅茶のほうがいい」と合いません。",
  },
  {
    focus: "blank",
    id: "gus-blank-gustan",
    units: ["gustar"],
    prompt: `Me ${BLANK} las manzanas.`,
    note: "私はリンゴが好きだ。",
    choices: ["gusta", "gusto", "gustan", "gustas"],
    answer: "gustan",
    explanation:
      "gustar の主語は好きなもの（las manzanas）なので、複数なら gustan になります。好きな人（私＝me）に合わせて gusto とはしません。",
  },
  {
    focus: "blank",
    id: "gus-blank-les",
    units: ["gustar", "pronoun"],
    prompt: `A mis padres ${BLANK} gusta viajar.`,
    note: "両親は旅行するのが好きだ。",
    choices: ["le", "les", "los", "se"],
    answer: "les",
    explanation:
      "gustar の「好きな人」は間接目的語なので、mis padres（複数）は les で受けます。a mis padres があっても les は省けません。動詞の原形（viajar）が主語のときは、動詞は単数の gusta です。",
  },
  {
    focus: "blank",
    id: "gus-blank-te",
    units: ["gustar"],
    prompt: `¿${BLANK} gusta bailar?`,
    note: "君は踊るのが好き？",
    choices: ["Tú", "Ti", "Tu", "Te"],
    answer: "Te",
    explanation:
      "「君に」は間接目的語の te です。主語の tú は使いません。ti は前置詞の後の形で、強調するときは ¿A ti te gusta bailar? のように te と一緒に使います。tu は「君の」です。",
  },
];

// ── 再帰動詞 ──
const reflexiveQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "refl-meaning-ducharse",
    units: ["reflexive"],
    prompt: "Mi hermano se ducha por la mañana.",
    choices: [
      "兄は朝、犬をシャワーで洗う。",
      "兄は朝、私にシャワーを浴びせる。",
      "兄は朝、シャワーを浴びる。",
      "兄は朝、シャワーを浴びたがる。",
    ],
    answer: "兄は朝、シャワーを浴びる。",
    explanation:
      "ducharse は「自分にシャワーを浴びせる」＝「シャワーを浴びる」という再帰動詞です。se は主語（mi hermano）自身を指します。ほかのものを洗うなら Ducha al perro.（犬をシャワーで洗う）のように se を付けません。",
  },
  {
    focus: "form",
    id: "refl-form-llamarse",
    units: ["reflexive"],
    prompt: "私の名前はアナです。",
    choices: ["Yo llamo Ana.", "Se llamo Ana.", "Me llama Ana.", "Me llamo Ana."],
    answer: "Me llamo Ana.",
    explanation:
      "llamarse（〜という名前だ）は再帰動詞で、主語 yo に合わせて再帰代名詞 me と活用形 llamo を使います。Me llama Ana. は「アナが私を呼ぶ」という別の意味になります。",
  },
  {
    focus: "context",
    id: "refl-context-levantarse",
    units: ["reflexive"],
    prompt: `A: ¿A qué hora te levantas?\nB: ${BLANK} levanto a las siete.`,
    note: "A「何時に起きるの？」 B「7時に起きるよ」",
    choices: ["Te", "Se", "Me", "Lo"],
    answer: "Me",
    explanation:
      "levantarse（起きる）の yo の形は me levanto です。問いの te levantas（君は起きる）に引きずられて te と答えないようにしましょう。再帰代名詞は主語に合わせて me・te・se・nos・os・se と変わります。",
  },
  {
    focus: "blank",
    id: "refl-blank-nos",
    units: ["reflexive"],
    prompt: `Nosotros ${BLANK} acostamos tarde.`,
    note: "私たちは遅くに寝る。",
    choices: ["se", "os", "me", "nos"],
    answer: "nos",
    explanation:
      "acostarse（寝る）の nosotros の形は nos acostamos です。se は3人称（él・ella・ellos・usted など）、os は vosotros のときの形です。",
  },
  {
    focus: "blank",
    id: "refl-blank-se-llama",
    units: ["reflexive", "interrogative"],
    prompt: `¿Cómo ${BLANK} llama tu profesora?`,
    note: "君の先生の名前は何ていうの？",
    choices: ["te", "se", "le", "la"],
    answer: "se",
    explanation:
      "主語は tu profesora（3人称単数）なので、llamarse の形は se llama です。te は主語が tú のときの形、le・la は他の人を指す目的格の代名詞です。",
  },
  {
    focus: "blank",
    id: "refl-blank-casarse",
    units: ["reflexive"],
    prompt: `Mis padres ${BLANK} casaron en 1990.`,
    note: "両親は1990年に結婚した。",
    choices: ["les", "se", "los", "nos"],
    answer: "se",
    explanation:
      "casarse（結婚する）は再帰動詞で、主語 mis padres（3人称複数）に合わせて se casaron です。les・los は他の人を指す目的格の代名詞なので、主語自身の動作には使いません。",
  },
];

// ── 否定表現 ──
const negationQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "neg-meaning-nadie",
    units: ["negation"],
    prompt: "No he visto a nadie.",
    choices: ["何も見ていない。", "一度も見たことがない。", "誰も見ていない。", "誰かを見かけた。"],
    answer: "誰も見ていない。",
    explanation:
      "nadie は「誰も〜ない」、nada は「何も〜ない」、nunca は「一度も・決して〜ない」です。スペイン語では動詞の前に no を置き、後ろに nadie などを置く二重否定が正しい形です。人を表す目的語なので a nadie と a が付きます。",
  },
  {
    focus: "form",
    id: "neg-form-nunca",
    units: ["negation"],
    prompt: "私は決して肉を食べない。",
    choices: [
      "Nunca no como carne.",
      "Nunca como carne.",
      "No nunca como carne.",
      "Como nunca carne.",
    ],
    answer: "Nunca como carne.",
    explanation:
      "nunca を動詞の前に置くときは no を付けません（Nunca como carne.）。動詞の後ろに置くなら、動詞の前に no を置いて No como carne nunca. とします。",
  },
  {
    focus: "context",
    id: "neg-context-nada",
    units: ["negation"],
    prompt: `A: ¿Quieres algo de beber?\nB: No, gracias. No quiero ${BLANK}.`,
    note: "A「何か飲む？」 B「ううん、ありがとう。何もいらない」",
    choices: ["algo", "nadie", "nada", "ninguno"],
    answer: "nada",
    explanation:
      "algo（何か）の否定は nada（何も〜ない）です。no と一緒に使って No quiero nada. とします。nadie は「誰も」で人に使い、algo を否定する答えにはなりません。",
  },
  {
    focus: "blank",
    id: "neg-blank-nadie",
    units: ["negation"],
    prompt: `${BLANK} vino a la fiesta.`,
    note: "誰もパーティーに来なかった。",
    choices: ["Nada", "Nunca", "Ninguna", "Nadie"],
    answer: "Nadie",
    explanation:
      "「誰も〜ない」は nadie です。nadie を動詞の前（主語の位置）に置くときは no を付けません。後ろに置くなら No vino nadie a la fiesta. です。",
  },
  {
    focus: "blank",
    id: "neg-blank-ningun",
    units: ["negation"],
    prompt: `No tengo ${BLANK} hermano.`,
    note: "私には兄弟が一人もいない。",
    choices: ["ninguno", "ningún", "nada", "no"],
    answer: "ningún",
    explanation:
      "「一つも・一人も〜ない」は ninguno ですが、男性単数名詞の前では語尾の o が落ちて ningún になります（uno → un と同じ）。名詞なしで使うなら No tengo ninguno. です。",
  },
  {
    focus: "blank",
    id: "neg-blank-nunca",
    units: ["negation"],
    prompt: `No ${BLANK} he estado en México.`,
    note: "私は一度もメキシコに行ったことがない。",
    choices: ["nada", "nunca", "nadie", "tampoco"],
    answer: "nunca",
    explanation:
      "経験の「一度も〜ない」は nunca です。現在完了（he estado）と組んで経験を表します。tampoco は「〜もまた〜ない」で、相手の否定に同意するときなどに使います。",
  },
];

// ── 疑問詞 ──
const interrogativeQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "int-meaning-de-donde",
    units: ["interrogative"],
    prompt: "¿De dónde eres?",
    choices: ["どこにいるの？", "どこの出身なの？", "どこへ行くの？", "どこに住んでいるの？"],
    answer: "どこの出身なの？",
    explanation:
      "de dónde は「どこから」で、ser と組むと出身を尋ねます。「どこにいるの」は ¿Dónde estás?、「どこへ行くの」は ¿Adónde vas?、「どこに住んでいるの」は ¿Dónde vives? です。",
  },
  {
    focus: "form",
    id: "int-form-cual",
    units: ["interrogative"],
    prompt: "君の電話番号は何番？",
    choices: [
      "¿Qué es tu número de teléfono?",
      "¿Cómo es tu número de teléfono?",
      "¿Cuál es tu número de teléfono?",
      "¿Cuánto es tu número de teléfono?",
    ],
    answer: "¿Cuál es tu número de teléfono?",
    explanation:
      "「ser + 名詞」で、名前・番号・住所など具体的な答えを尋ねるときは cuál を使います。¿Qué es…? は「〜とは何か」と定義を尋ねる言い方です。",
  },
  {
    focus: "context",
    id: "int-context-cuanto",
    units: ["interrogative"],
    prompt: `A: ¿${BLANK} cuesta este libro?\nB: Quince euros.`,
    note: "A「この本…？」 B「15ユーロだよ」",
    choices: ["Cuántos", "Qué", "Cuál", "Cuánto"],
    answer: "Cuánto",
    explanation:
      "値段を尋ねるのは ¿Cuánto cuesta…? です。cuánto は名詞を伴わずに「いくら・どれだけ」を表すときは変化しません。cuántos は ¿Cuántos libros…?（何冊の本）のように複数名詞と一緒に使います。",
  },
  {
    focus: "blank",
    id: "int-blank-con-quien",
    units: ["interrogative"],
    prompt: `¿Con ${BLANK} vas al cine?`,
    note: "誰と映画に行くの？",
    choices: ["qué", "quién", "cuál", "dónde"],
    answer: "quién",
    explanation:
      "人について「誰」と尋ねるのは quién です。前置詞と一緒に使うときは、前置詞を疑問詞の前に置きます（¿Con quién…?・¿De quién…?）。疑問詞にはアクセント記号が付きます。",
  },
  {
    focus: "blank",
    id: "int-blank-por-que",
    units: ["interrogative"],
    prompt: `¿${BLANK} no viniste ayer?`,
    note: "どうして昨日来なかったの？",
    choices: ["Porque", "Porqué", "Por qué", "Para qué"],
    answer: "Por qué",
    explanation:
      "理由を尋ねる「なぜ」は2語でアクセント記号付きの por qué です。答えの「なぜなら」は1語でアクセント記号のない porque、el porqué は「理由」という名詞です。para qué は「何のために」と目的を尋ねます。",
  },
  {
    focus: "blank",
    id: "int-blank-como",
    units: ["interrogative"],
    prompt: `¿${BLANK} te llamas?`,
    note: "名前は何ていうの？",
    choices: ["Qué", "Cuál", "Cómo", "Quién"],
    answer: "Cómo",
    explanation:
      "名前は llamarse（〜と呼ばれる）で尋ねるので、「どのように」の cómo を使います。日本語の「何」につられて qué にしないように注意しましょう。",
  },
];

// ── 比較級・最上級 ──
const comparisonQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "comp-meaning-tan",
    units: ["comparison"],
    prompt: "Luis es tan alto como su hermano.",
    choices: [
      "ルイスは兄（弟）より背が高い。",
      "ルイスは兄（弟）と同じくらい背が高い。",
      "ルイスは兄（弟）ほど背が高くない。",
      "ルイスは兄弟でいちばん背が高い。",
    ],
    answer: "ルイスは兄（弟）と同じくらい背が高い。",
    explanation:
      "tan + 形容詞 + como は「〜と同じくらい…」という同等比較です。「より高い」は más alto que、「ほど高くない」は menos alto que（または no tan alto como）です。",
  },
  {
    focus: "form",
    id: "comp-form-mejor",
    units: ["comparison"],
    prompt: "マリアは私より歌が上手だ。",
    choices: [
      "María canta más bien que yo.",
      "María canta más mejor que yo.",
      "María canta mejor como yo.",
      "María canta mejor que yo.",
    ],
    answer: "María canta mejor que yo.",
    explanation:
      "bien（上手に）・bueno（良い）の比較級は不規則で mejor です。mejor にはすでに「より」の意味があるので más は付けません。比べる相手は que で示します（como は同等比較の tan… como で使います）。",
  },
  {
    focus: "context",
    id: "comp-context-menos",
    units: ["comparison"],
    prompt: `A: ¿Cuál prefieres, el rojo o el azul?\nB: El azul. Es ${BLANK} caro que el rojo.`,
    note: "A「赤と青、どっちがいい？」 B「青。赤より安いから」",
    choices: ["más", "tan", "menos", "tanto"],
    answer: "menos",
    explanation:
      "「赤より安い」は「赤ほど高くない」と考えて menos caro que を使います。más caro だと「赤より高い」で、選んだ理由になりません。tan は como と組むので que とは使いません。",
  },
  {
    focus: "blank",
    id: "comp-blank-tan",
    units: ["comparison"],
    prompt: `Mi casa es ${BLANK} grande como la tuya.`,
    note: "私の家は君の家と同じくらい大きい。",
    choices: ["tanto", "tan", "más", "como"],
    answer: "tan",
    explanation:
      "形容詞・副詞の同等比較は tan… como です。tanto は名詞（tanto dinero como…）や動詞（trabajo tanto como tú）の同等比較に使います。más は que と組みます。",
  },
  {
    focus: "blank",
    id: "comp-blank-mejor",
    units: ["comparison"],
    prompt: `Es el ${BLANK} libro que he leído.`,
    note: "今まで読んだ中で最高の本だ。",
    choices: ["más bueno", "bueno", "mejor", "más mejor"],
    answer: "mejor",
    explanation:
      "最上級は「定冠詞 + 比較級」で作り、bueno の比較級は mejor なので el mejor libro です。mejor は名詞の前に置くのがふつうです。",
  },
  {
    focus: "blank",
    id: "comp-blank-tantos",
    units: ["comparison"],
    prompt: `Tengo ${BLANK} amigos como tú.`,
    note: "私には君と同じくらいたくさん友だちがいる。",
    choices: ["tan", "tantas", "más", "tantos"],
    answer: "tantos",
    explanation:
      "名詞の量の同等比較は tanto + 名詞 + como で、tanto は名詞の性・数に合わせて変わります。amigos（男性複数）なので tantos です。tan は形容詞・副詞の前で使います。",
  },
];

export const grammarQuiz: GrammarQuestion[] = [
  ...pronounQuestions,
  ...reflexiveQuestions,
  ...gustarQuestions,
  ...negationQuestions,
  ...interrogativeQuestions,
  ...comparisonQuestions,
];
