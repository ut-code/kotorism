import {
  BLANK,
  type GrammarQuestion as Question,
  type GrammarUnitDef,
} from "@/lib/shared/learn/grammar-quiz";

// 出題の単元。基本2（このセクション）は代名詞と動詞のしくみを扱う（名詞まわりと文のしくみは 05「文法クイズ（基本1）」）
export const grammarUnits = [
  { id: "pronoun", label: "目的語の代名詞", sub: "le・lui・y・en" },
  { id: "stressed", label: "強勢形の代名詞", sub: "moi・toi・lui・eux…" },
  { id: "reflexive", label: "代名動詞", sub: "se lever・s'appeler…" },
  { id: "relative", label: "関係代名詞", sub: "qui・que・où・dont" },
  { id: "near-tense", label: "近接未来・近接過去", sub: "aller + 不定詞・venir de…" },
  { id: "imperative", label: "命令法", sub: "Viens !・Allons-y !・Sois…" },
] as const satisfies readonly GrammarUnitDef[];

type GrammarQuestion = Question<(typeof grammarUnits)[number]["id"]>;

// 文法クイズの出題データ。問題は単元ごとにまとめ、units に単元タグ（grammarUnits の id）を付ける。
// 複数の単元にまたがる問題は、タグを複数付ければどちらの単元を選んでも出題される

// ── 目的語の代名詞 ──
const pronounQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "pron-meaning-lui",
    units: ["pronoun"],
    prompt: "Je lui téléphone ce soir.",
    choices: [
      "今夜、彼らに電話する。",
      "今夜、彼（彼女）から電話がある。",
      "今夜、彼（彼女）に電話する。",
      "今夜、そこから電話する。",
    ],
    answer: "今夜、彼（彼女）に電話する。",
    explanation:
      "téléphoner à quelqu'un（〜に電話する）の「à + 人」を代名詞にすると、単数なら lui（男女同形）、複数なら leur になります。「そこから」のような場所は y・en で表し、lui は使いません。",
  },
  {
    focus: "form",
    id: "pron-form-le-lui",
    units: ["pronoun"],
    prompt: "私はそれを彼に渡した。",
    choices: [
      "Je lui le ai donné.",
      "Je l'ai lui donné.",
      "Je lui l'ai donné.",
      "Je le lui ai donné.",
    ],
    answer: "Je le lui ai donné.",
    explanation:
      "目的語の代名詞が2つ並ぶときは le・la・les を lui・leur の前に置き、どちらも助動詞の前に置きます（Je le lui ai donné.）。me・te・nous・vous なら逆に le・la・les の前です（Il me l'a donné.）。",
  },
  {
    focus: "context",
    id: "pron-context-y",
    units: ["pronoun"],
    prompt: `A : Tu vas à Paris cet été ?\nB : Oui, j'${BLANK} vais en juillet.`,
    note: "A「この夏パリに行くの？」 B「うん、7月に行くよ」",
    choices: ["en", "le", "y", "lui"],
    answer: "y",
    explanation:
      "à Paris のように「à + 場所」を受ける代名詞は y（そこへ・そこに）です。en は「de + 名詞」や数量を受け（J'en viens. ＝そこから来た）、le は直接目的語、lui は「à + 人」を受けます。",
  },
  {
    focus: "blank",
    id: "pron-blank-en",
    units: ["pronoun"],
    prompt: `Des pommes ? J'${BLANK} ai acheté trois.`,
    note: "リンゴ？3つ買ったよ。",
    choices: ["les", "en", "y", "lui"],
    answer: "en",
    explanation:
      "数量（trois・beaucoup など）と一緒に名詞を受けるときや、「不定冠詞・部分冠詞 + 名詞」を受けるときは en を使います。les だと「そのリンゴ全部」を指すので、trois と一緒には使えません。",
  },
  {
    focus: "blank",
    id: "pron-blank-la",
    units: ["pronoun"],
    prompt: `Cette robe, je ${BLANK} trouve très jolie.`,
    note: "このドレス、とてもきれいだと思う。",
    choices: ["lui", "le", "en", "la"],
    answer: "la",
    explanation:
      "trouver の直接目的語「cette robe」（女性単数）を受けるので la です。le は男性単数、lui は「à + 人」を受ける間接目的語です。jolie が女性形になっているのも手がかりになります。",
  },
  {
    focus: "blank",
    id: "pron-blank-les",
    units: ["pronoun"],
    prompt: `Tu connais mes parents ? Je vais te ${BLANK} présenter.`,
    note: "私の両親を知ってる？紹介するよ。",
    choices: ["leur", "lui", "les", "en"],
    answer: "les",
    explanation:
      "présenter A à B（AをBに紹介する）の A（mes parents）は直接目的語なので les です。leur は「à + 人（複数）」を受ける間接目的語で、ここでは te がその役割をしています。te は les の前に置きます。",
  },
];

// ── 強勢形の代名詞 ──
const stressedQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "str-meaning-moi-aussi",
    units: ["stressed"],
    prompt: "Moi aussi, j'aime le jazz.",
    choices: [
      "私はジャズだけが好きだ。",
      "私もジャズが好きだ。",
      "私だってジャズは好きじゃない。",
      "私はジャズも好きだ。",
    ],
    answer: "私もジャズが好きだ。",
    explanation:
      "強勢形 moi は主語を強調したり、aussi・non plus と組んで「私も」を表したりします。「（他のものに加えて）ジャズも好き」なら J'aime aussi le jazz. です。否定に同意する「私も〜ない」は Moi non plus. です。",
  },
  {
    focus: "form",
    id: "str-form-chez-moi",
    units: ["stressed"],
    prompt: "今夜、私の家に来て。",
    choices: [
      "Viens chez me ce soir.",
      "Viens chez je ce soir.",
      "Viens chez mon ce soir.",
      "Viens chez moi ce soir.",
    ],
    answer: "Viens chez moi ce soir.",
    explanation:
      "chez・avec・pour などの前置詞の後に人称代名詞を置くときは、強勢形（moi・toi・lui・elle・nous・vous・eux・elles）を使います。",
  },
  {
    focus: "context",
    id: "str-context-et-toi",
    units: ["stressed"],
    prompt: `A : Je suis fatigué. Et ${BLANK} ?\nB : Moi aussi.`,
    note: "A「疲れたよ。君は？」 B「私も」",
    choices: ["tu", "toi", "te", "ton"],
    answer: "toi",
    explanation:
      "「君は？」と聞き返すときは、動詞なしで強勢形の toi を使います（Et toi ?）。tu は動詞の主語としてしか使えません。",
  },
  {
    focus: "blank",
    id: "str-blank-avec-lui",
    units: ["stressed"],
    prompt: `Je vais au cinéma avec ${BLANK}.`,
    note: "私は彼と映画に行く。",
    choices: ["il", "le", "lui", "son"],
    answer: "lui",
    explanation:
      "前置詞 avec の後なので強勢形の lui を使います。lui は「à + 人」を受ける間接目的語の形でもありますが、前置詞の後では「彼」の強勢形です。女性なら avec elle です。",
  },
  {
    focus: "blank",
    id: "str-blank-a-elle",
    units: ["stressed"],
    prompt: `Ce sac est à ${BLANK}.`,
    note: "このバッグは彼女のものだ。",
    choices: ["elle", "la", "lui", "sa"],
    answer: "elle",
    explanation:
      "être à + 強勢形 で「〜のものだ」という所有を表します。「彼女の」なら à elle、「彼の」なら à lui です。",
  },
  {
    focus: "blank",
    id: "str-blank-penser-a-eux",
    units: ["stressed", "pronoun"],
    prompt: `Mes parents ? Je pense souvent à ${BLANK}.`,
    note: "両親？よく彼らのことを考えるよ。",
    choices: ["leur", "les", "eux", "ils"],
    answer: "eux",
    explanation:
      "penser à（〜のことを考える）は、人を受けるときに間接目的語 leur で置き換えず、「à + 強勢形」を残します（Je pense à eux.）。s'intéresser à・être à なども同じです。男性複数の強勢形は eux です。",
  },
];

// ── 代名動詞 ──
const reflexiveQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "refl-meaning-reciprocal",
    units: ["reflexive"],
    prompt: "Ils se téléphonent tous les soirs.",
    choices: [
      "彼らは毎晩、自分あてに電話をかける。",
      "彼らは毎晩、彼に電話をかける。",
      "彼らは毎晩、電話をかけ合う。",
      "彼らは毎晩、電話をかけてもらう。",
    ],
    answer: "彼らは毎晩、電話をかけ合う。",
    explanation:
      "主語が複数の代名動詞は「互いに〜し合う」という相互の意味になることがあります（相互的用法）。se téléphoner は「電話をかけ合う」です。「彼に電話をかける」なら Ils lui téléphonent. です。",
  },
  {
    focus: "form",
    id: "refl-form-se-lever",
    units: ["reflexive"],
    prompt: "私は7時に起きる。",
    choices: [
      "Je lève à sept heures.",
      "Je se lève à sept heures.",
      "Me je lève à sept heures.",
      "Je me lève à sept heures.",
    ],
    answer: "Je me lève à sept heures.",
    explanation:
      "se lever（起きる）は代名動詞で、再帰代名詞 se は主語に合わせて me・te・se・nous・vous・se と変わります。主語 je なら me で、動詞の直前に置きます。me を落とした Je lève… は「（何かを）持ち上げる」の意味になり、目的語が足りません。",
  },
  {
    focus: "context",
    id: "refl-context-appeler",
    units: ["reflexive"],
    prompt: `A : Comment tu t'appelles ?\nB : Je ${BLANK} Marie.`,
    note: "A「名前は何ていうの？」 B「マリーだよ」",
    choices: ["t'appelles", "me appelle", "m'appelle", "s'appelle"],
    answer: "m'appelle",
    explanation:
      "s'appeler（〜という名前だ）の je の形は je m'appelle です。母音で始まる動詞の前では me が m' になります（エリジオン）。問いの tu t'appelles に合わせて t' と答えないように注意しましょう。",
  },
  {
    focus: "blank",
    id: "refl-blank-nous",
    units: ["reflexive"],
    prompt: `Nous ${BLANK} promenons dans le parc.`,
    note: "私たちは公園を散歩する。",
    choices: ["se", "vous", "nous", "me"],
    answer: "nous",
    explanation:
      "se promener（散歩する）の nous の形は nous nous promenons で、nous が2回続きます。1つ目は主語、2つ目は再帰代名詞です。se は3人称（il・elle・ils・elles）のときの形です。",
  },
  {
    focus: "blank",
    id: "refl-blank-imperative",
    units: ["reflexive", "imperative"],
    prompt: `Dépêche-${BLANK} ! Le train va partir.`,
    note: "急いで！電車が出ちゃうよ。",
    choices: ["te", "toi", "tu", "se"],
    answer: "toi",
    explanation:
      "肯定命令では再帰代名詞を動詞の後ろにハイフンでつなぎ、te は強勢形の toi になります（Dépêche-toi !）。否定命令では元の位置・形に戻ります（Ne te dépêche pas !）。",
  },
  {
    focus: "blank",
    id: "refl-blank-souvenir",
    units: ["reflexive"],
    prompt: `Tu ${BLANK} souviens de notre voyage ?`,
    note: "私たちの旅行のこと、覚えてる？",
    choices: ["se", "me", "tu", "te"],
    answer: "te",
    explanation:
      "se souvenir de…（〜を覚えている）の tu の形は tu te souviens です。再帰代名詞は主語と同じ人を指すので、主語 tu には te を合わせます。",
  },
];

// ── 関係代名詞 ──
const relativeQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "rel-meaning-dont",
    units: ["relative"],
    prompt: "C'est le livre dont je t'ai parlé.",
    choices: [
      "これが、君が私に話してくれた本だ。",
      "これが、君に話した本だ。",
      "これが、君に貸した本だ。",
      "これが、君と話しながら読んだ本だ。",
    ],
    answer: "これが、君に話した本だ。",
    explanation:
      "dont は「de + 先行詞」の代わりをする関係代名詞で、parler de…（〜について話す）の de を受けています。je t'ai parlé は「私が君に話した」で、「君が私に話した」なら tu m'as parlé になります。",
  },
  {
    focus: "form",
    id: "rel-form-que",
    units: ["relative"],
    prompt: "これは私が昨日見た映画です。",
    choices: [
      "C'est le film qui j'ai vu hier.",
      "C'est le film dont j'ai vu hier.",
      "C'est le film que j'ai vu hier.",
      "C'est le film où j'ai vu hier.",
    ],
    answer: "C'est le film que j'ai vu hier.",
    explanation:
      "関係節の中で先行詞（le film）が直接目的語（voir le film）になるので que を使います。qui は関係節の主語になるとき、dont は「de + 先行詞」、où は場所・時を表すときに使います。",
  },
  {
    focus: "context",
    id: "rel-context-ou",
    units: ["relative"],
    prompt: `A : Tu te souviens de ce café ?\nB : Oui, c'est le café ${BLANK} nous nous sommes rencontrés !`,
    note: "A「あのカフェ覚えてる？」 B「うん、私たちが出会ったカフェだね！」",
    choices: ["que", "qui", "dont", "où"],
    answer: "où",
    explanation:
      "「そのカフェで出会った」と場所を表すので où を使います。関係節の中は nous nous sommes rencontrés で主語も目的語もそろっているので、qui・que は入りません。",
  },
  {
    focus: "blank",
    id: "rel-blank-qui",
    units: ["relative"],
    prompt: `J'ai un ami ${BLANK} habite à Lyon.`,
    note: "私にはリヨンに住んでいる友だちがいる。",
    choices: ["que", "qui", "où", "dont"],
    answer: "qui",
    explanation:
      "関係節 habite à Lyon には主語がなく、先行詞 un ami がその主語になるので qui を使います。que は先行詞が関係節の直接目的語になるときです（l'ami que j'ai rencontré）。",
  },
  {
    focus: "blank",
    id: "rel-blank-ou",
    units: ["relative"],
    prompt: `La ville ${BLANK} je suis né est petite.`,
    note: "私が生まれた町は小さい。",
    choices: ["où", "que", "qui", "dont"],
    answer: "où",
    explanation:
      "「その町で生まれた」と場所を表すので où です。naître は目的語をとらない動詞なので que は使えません。où は le jour où…（〜した日）のように時を表すこともできます。",
  },
  {
    focus: "blank",
    id: "rel-blank-dont",
    units: ["relative"],
    prompt: `Voici la fille ${BLANK} le père est médecin.`,
    note: "こちらが、お父さんが医者をしている女の子です。",
    choices: ["que", "qui", "dont", "où"],
    answer: "dont",
    explanation:
      "「その子の父親（le père de la fille）」の de la fille を受けるので dont です。dont の後ろは le père est médecin と、主語・動詞のそろった文がそのまま続きます。",
  },
];

// ── 近接未来・近接過去 ──
const nearTenseQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "near-meaning-venir-de",
    units: ["near-tense"],
    prompt: "Je viens de manger.",
    choices: [
      "私は食べに来た。",
      "私は食べたばかりだ。",
      "私はこれから食べる。",
      "私は食べてから来た。",
    ],
    answer: "私は食べたばかりだ。",
    explanation:
      "venir de + 不定詞 は「〜したばかりだ」という近接過去です。de を付けない venir + 不定詞 は「〜しに来る」（Je viens manger.）、「これから食べる」は近接未来の Je vais manger. です。",
  },
  {
    focus: "form",
    id: "near-form-aller",
    units: ["near-tense"],
    prompt: "私たちは明日出発する（つもりだ）。",
    choices: [
      "Nous allons partons demain.",
      "Nous venons de partir demain.",
      "Nous allons partir demain.",
      "Nous allons à partir demain.",
    ],
    answer: "Nous allons partir demain.",
    explanation:
      "aller + 不定詞 は「これから〜する・〜するつもりだ」という近接未来です。aller を主語に合わせて活用し（nous allons）、後ろの動詞は不定詞のままにします。aller と不定詞の間に à は入りません。",
  },
  {
    focus: "context",
    id: "near-context-vient-de",
    units: ["near-tense"],
    prompt: `A : Tu as vu Paul ?\nB : Oui, il ${BLANK} partir. Tu l'as raté de peu !`,
    note: "A「ポールに会った？」 B「うん、…。ちょっとの差で会い損ねたね！」",
    choices: ["va", "part", "vient de", "vient"],
    answer: "vient de",
    explanation:
      "「ちょっとの差で会い損ねた」と続くので、「たった今出ていったところ」という近接過去 venir de + 不定詞 です。va partir だと「これから出かける」になり、まだ会えるはずなので流れに合いません。",
  },
  {
    focus: "blank",
    id: "near-blank-va",
    units: ["near-tense"],
    prompt: `Attention, le train ${BLANK} partir !`,
    note: "気をつけて、電車がもうすぐ出るよ！",
    choices: ["vient de", "va", "est", "a"],
    answer: "va",
    explanation:
      "「もうすぐ出る」という近い未来なので、aller + 不定詞 の va partir です。vient de partir だと「出たばかり」で、注意を呼びかける流れに合いません。",
  },
  {
    focus: "blank",
    id: "near-blank-d",
    units: ["near-tense"],
    prompt: `Elle vient ${BLANK} arriver à la gare.`,
    note: "彼女はちょうど駅に着いたところだ。",
    choices: ["de", "à", "pour", "d'"],
    answer: "d'",
    explanation:
      "近接過去は venir de + 不定詞 で、arriver のように母音で始まる動詞の前では de が d' になります（Elle vient d'arriver.）。",
  },
  {
    focus: "blank",
    id: "near-blank-infinitive",
    units: ["near-tense"],
    prompt: `Ce soir, je vais ${BLANK} un film.`,
    note: "今夜は映画を見るつもりだ。",
    choices: ["regarde", "regarder", "regardé", "regarderai"],
    answer: "regarder",
    explanation:
      "近接未来では aller だけを活用し、後ろの動詞は不定詞にします（je vais regarder）。regarderai は単純未来の形で、aller と一緒には使いません。",
  },
];

// ── 命令法 ──
const imperativeQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "imp-meaning-allons-y",
    units: ["imperative"],
    prompt: "Allons-y !",
    choices: [
      "そこへ行け！",
      "そこへ行きましょうか？",
      "さあ、行こう！",
      "もうそこへ行ってしまった！",
    ],
    answer: "さあ、行こう！",
    explanation:
      "nous の命令法は「〜しよう」という誘いになります（Allons-y ! ＝さあ行こう）。y は「そこへ」を表し、肯定命令ではハイフンで動詞の後ろにつなぎます。",
  },
  {
    focus: "form",
    id: "imp-form-donne-le-moi",
    units: ["imperative", "pronoun"],
    prompt: "それを私に渡して（tu に対して）。",
    choices: ["Donne-moi-le.", "Me le donne.", "Donne-le-moi.", "Donne-le-me."],
    answer: "Donne-le-moi.",
    explanation:
      "肯定命令では目的語の代名詞を動詞の後ろにハイフンでつなぎ、「直接目的語 → 間接目的語」の順に置きます。me・te は動詞の後ろで強勢形の moi・toi になります。否定命令なら Ne me le donne pas. と元の語順に戻ります。",
  },
  {
    focus: "context",
    id: "imp-context-entre",
    units: ["imperative"],
    prompt: `A : Je peux entrer ?\nB : Oui, bien sûr, ${BLANK} !`,
    note: "A「入ってもいい？」 B「もちろん、どうぞ入って！」",
    choices: ["entres", "entrer", "entre", "entré"],
    answer: "entre",
    explanation:
      "tu に対する命令法は、現在形の tu の形から主語を取ったものです。ただし -er 動詞（と aller）は語尾の -s を落とすので、tu entres → Entre ! になります。",
  },
  {
    focus: "blank",
    id: "imp-blank-fais",
    units: ["imperative"],
    prompt: `${BLANK} attention, c'est chaud !`,
    note: "気をつけて、熱いよ！（tu に対して）",
    choices: ["Faites", "Fait", "Fais", "Faire"],
    answer: "Fais",
    explanation:
      "faire attention（気をつける）の tu に対する命令法は Fais attention ! です。-er 動詞以外は語尾の -s を残します。vous に対してなら Faites attention ! です。",
  },
  {
    focus: "blank",
    id: "imp-blank-sois",
    units: ["imperative"],
    prompt: `Ne ${BLANK} pas en retard !`,
    note: "遅れないでね！（tu に対して）",
    choices: ["es", "sois", "être", "soit"],
    answer: "sois",
    explanation:
      "être の命令法は不規則で、tu に対しては sois、nous は soyons、vous は soyez です。否定命令は ne…pas で動詞をはさみます。",
  },
  {
    focus: "blank",
    id: "imp-blank-dites",
    units: ["imperative"],
    prompt: `${BLANK}-moi la vérité, s'il vous plaît.`,
    note: "本当のことを言ってください。",
    choices: ["Disez", "Dites", "Dire", "Dis"],
    answer: "Dites",
    explanation:
      "dire の vous の形は不規則な vous dites なので、命令法も Dites ! です（faire → Faites、être → Soyez も不規則）。s'il vous plaît から、vous に対する命令だとわかります。",
  },
];

export const grammarQuiz: GrammarQuestion[] = [
  ...pronounQuestions,
  ...stressedQuestions,
  ...reflexiveQuestions,
  ...relativeQuestions,
  ...nearTenseQuestions,
  ...imperativeQuestions,
];
