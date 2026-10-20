import {
  BLANK,
  type GrammarQuestion as Question,
  type GrammarUnitDef,
} from "@/lib/shared/learn/grammar-quiz";

// 出題の単元。フランス語は覚える規則が多いので、基本を2つに分ける。基本1（このセクション）は名詞まわりと
// 文のしくみ（冠詞・形容詞・否定・疑問・比較・地名の前置詞）、06「文法クイズ（基本2）」は代名詞と動詞を扱う。
// 07「文法クイズ（紛らわしい表現）」で扱う使い分け（時制・c'est/il est・à/pour・助動詞選択・savoir/connaître）とは重ねない
export const grammarUnits = [
  { id: "article", label: "冠詞", sub: "le・un・du・de / au・du" },
  { id: "agreement", label: "形容詞の性数一致・位置", sub: "petit/petite・un bel…" },
  { id: "negation", label: "否定表現", sub: "ne…pas・plus・jamais・rien…" },
  { id: "interrogative", label: "疑問文・疑問詞", sub: "quel・qu'est-ce que…" },
  { id: "comparison", label: "比較級・最上級", sub: "plus・aussi・meilleur・mieux" },
  { id: "place", label: "国名・都市名の前置詞", sub: "à Paris・en France・au Japon" },
] as const satisfies readonly GrammarUnitDef[];

type GrammarQuestion = Question<(typeof grammarUnits)[number]["id"]>;

// 文法クイズの出題データ。問題は単元ごとにまとめ、units に単元タグ（grammarUnits の id）を付ける。
// 複数の単元にまたがる問題は、タグを複数付ければどちらの単元を選んでも出題される

// ── 冠詞 ──
const articleQuestions: GrammarQuestion[] = [
  {
    focus: "form",
    id: "art-form-eau",
    units: ["article"],
    prompt: "私は水が飲みたい。",
    choices: [
      "Je veux boire du eau.",
      "Je veux boire de la eau.",
      "Je veux boire d'eau.",
      "Je veux boire de l'eau.",
    ],
    answer: "Je veux boire de l'eau.",
    explanation:
      "水のように数えられないものを「いくらか」飲む・食べるときは部分冠詞（du・de la）を使います。eau は女性名詞ですが、母音で始まる語の前では du・de la ではなく de l' になります。",
  },
  {
    focus: "context",
    id: "art-context-les",
    units: ["article"],
    prompt: `A : Tu aimes les chats ?\nB : Oui, j'adore ${BLANK} chats !`,
    note: "A「猫は好き？」 B「うん、猫は大好き！」",
    choices: ["des", "les", "de", "du"],
    answer: "les",
    explanation:
      "aimer・adorer・détester・préférer など好き嫌いを表す動詞の後では、「猫というもの全般」を表す定冠詞 le・la・les を使います。des chats（何匹かの猫）や部分冠詞 du は使いません。",
  },
  {
    focus: "blank",
    id: "art-blank-des",
    units: ["article"],
    prompt: `Il y a ${BLANK} enfants dans le parc.`,
    note: "公園に子どもたちがいる。",
    choices: ["les", "de", "des", "du"],
    answer: "des",
    explanation:
      "il y a（〜がある・いる）の後には、初めて話題に出る不特定のものが来るので不定冠詞を使います。enfants は複数なので des です。de になるのは否定文（Il n'y a pas d'enfants.）のときです。",
  },
  {
    focus: "blank",
    id: "art-blank-au",
    units: ["article"],
    prompt: `Je vais ${BLANK} cinéma ce soir.`,
    note: "今夜、私は映画館に行く。",
    choices: ["à le", "au", "du", "à la"],
    answer: "au",
    explanation:
      "前置詞 à の後に定冠詞 le が来ると au にまとめます（à + le → au、à + les → aux）。cinéma は男性名詞なので à la ではありません。du は de + le の縮約で「〜から」になります。",
  },
  {
    focus: "blank",
    id: "art-blank-beaucoup-de",
    units: ["article"],
    prompt: `Elle a beaucoup ${BLANK} amis.`,
    note: "彼女には友だちがたくさんいる。",
    choices: ["des", "les", "de les", "d'"],
    answer: "d'",
    explanation:
      "beaucoup de・peu de・un peu de など量を表す表現の後では、名詞に冠詞を付けずに de だけを置きます。amis は母音で始まるので d' になります。",
  },
];

// ── 形容詞の性数一致・位置 ──
const agreementQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "agr-meaning-grand-homme",
    units: ["agreement"],
    prompt: "C'est un grand homme.",
    choices: [
      "彼は背の高い男性だ。",
      "彼は偉大な人物だ。",
      "彼は年をとった男性だ。",
      "彼は大人の男性だ。",
    ],
    answer: "彼は偉大な人物だ。",
    explanation:
      "grand は名詞の前に置くと「偉大な」、後ろに置くと「背の高い」という意味になります（un homme grand ＝背の高い男性）。このように位置で意味が変わる形容詞には ancien・cher・pauvre などもあります。",
  },
  {
    focus: "form",
    id: "agr-form-heureuse",
    units: ["agreement"],
    prompt: "彼女はとても幸せだ。",
    choices: [
      "Elle est très heureux.",
      "Elle est très heureuses.",
      "Elle est très heureuse.",
      "Elle est très heureuxe.",
    ],
    answer: "Elle est très heureuse.",
    explanation:
      "形容詞は主語の性・数に一致させます。-eux で終わる形容詞の女性形は -euse です（heureux → heureuse）。複数形は heureuses になります。",
  },
  {
    focus: "form",
    id: "agr-form-blanche",
    units: ["agreement"],
    prompt: "白い車",
    choices: [
      "une blanche voiture",
      "une voiture blanche",
      "une voiture blanc",
      "un voiture blanche",
    ],
    answer: "une voiture blanche",
    explanation:
      "色や国籍を表す形容詞は名詞の後ろに置きます。voiture は女性名詞なので冠詞は une、形容詞 blanc は女性形 blanche になります（-c → -che は不規則な変化）。",
  },
  {
    focus: "context",
    id: "agr-context-gentils",
    units: ["agreement"],
    prompt: `A : Comment sont tes nouveaux voisins ?\nB : Ils sont très ${BLANK}.`,
    note: "A「新しいお隣さんたち、どう？」 B「とても親切だよ」",
    choices: ["gentil", "gentille", "gentilles", "gentils"],
    answer: "gentils",
    explanation:
      "主語 ils（男性複数）に合わせて、形容詞も男性複数の gentils にします。男女が混ざった集団も男性複数で受けます。",
  },
  {
    focus: "blank",
    id: "agr-blank-petite",
    units: ["agreement"],
    prompt: `C'est une ${BLANK} maison.`,
    note: "これは小さな家だ。",
    choices: ["petit", "petite", "petits", "petites"],
    answer: "petite",
    explanation:
      "maison は女性単数なので petite です。petit・grand・beau・bon・jeune・vieux など、短くよく使う形容詞は名詞の前に置きます。",
  },
  {
    focus: "blank",
    id: "agr-blank-bel",
    units: ["agreement"],
    prompt: `Il habite dans un ${BLANK} appartement.`,
    note: "彼は美しいアパルトマンに住んでいる。",
    choices: ["beau", "belle", "bel", "beaux"],
    answer: "bel",
    explanation:
      "beau は母音や無音の h で始まる男性単数名詞の前では bel になります（un bel appartement）。nouveau → nouvel、vieux → vieil も同じです。",
  },
  {
    focus: "blank",
    id: "agr-blank-grandes",
    units: ["agreement"],
    prompt: `Mes sœurs sont ${BLANK}.`,
    note: "私の姉妹たちは背が高い。",
    choices: ["grand", "grandes", "grande", "grands"],
    answer: "grandes",
    explanation:
      "主語 mes sœurs は女性複数なので、形容詞は女性形 -e と複数形 -s をつけて grandes になります。",
  },
];

// ── 否定表現 ──
const negationQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "neg-meaning-plus",
    units: ["negation"],
    prompt: "Je ne fume plus.",
    choices: [
      "私は決してタバコを吸わない。",
      "私はタバコしか吸わない。",
      "私はもうタバコを吸わない。",
      "私はまだタバコを吸っていない。",
    ],
    answer: "私はもうタバコを吸わない。",
    explanation:
      "ne…plus は「もう〜ない」で、以前はしていたことを今はしないという意味です。「決して・一度も〜ない」は ne…jamais、「まだ〜ない」は ne…pas encore。ne…que は否定ではなく「〜しか…ない」という限定です。",
  },
  {
    focus: "form",
    id: "neg-form-rien",
    units: ["negation"],
    prompt: "私は何も見なかった。",
    choices: ["Je n'ai vu rien.", "Je n'ai rien vu.", "Je n'ai pas vu rien.", "Je ne rien ai vu."],
    answer: "Je n'ai rien vu.",
    explanation:
      "複合過去では、pas・plus・jamais・rien は助動詞と過去分詞の間に置きます（ne + 助動詞 + rien + 過去分詞）。rien は pas と一緒には使いません。なお personne だけは過去分詞の後ろに置きます（Je n'ai vu personne.）。",
  },
  {
    focus: "context",
    id: "neg-context-plus",
    units: ["negation"],
    prompt: `A : Tu veux encore du gâteau ?\nB : Non merci, je n'en veux ${BLANK}.`,
    note: "A「ケーキ、もっと食べる？」 B「ううん、ありがとう。もう…」",
    choices: ["rien", "personne", "plus", "jamais"],
    answer: "plus",
    explanation:
      "「もう十分食べたので、もういらない」という流れなので ne…plus（もう〜ない）です。jamais だと「ケーキなんて決して欲しくない」と強い拒絶になり、rien・personne は en（ケーキを指す）と意味がかみ合いません。",
  },
  {
    focus: "blank",
    id: "neg-blank-personne",
    units: ["negation"],
    prompt: `Il n'y a ${BLANK} dans la salle.`,
    note: "部屋には誰もいない。",
    choices: ["rien", "personne", "jamais", "pas"],
    answer: "personne",
    explanation:
      "「誰も〜ない」は ne…personne、「何も〜ない」は ne…rien です。jamais は「決して〜ない」で、Il n'y a jamais… の後には人や物を表す語が必要です。pas だけでは「部屋には」の後に何がないのかが欠けてしまいます。",
  },
  {
    focus: "blank",
    id: "neg-blank-pas-de",
    units: ["negation", "article"],
    prompt: `Je n'ai pas ${BLANK} voiture.`,
    note: "私は車を持っていない。",
    choices: ["une", "la", "de", "des"],
    answer: "de",
    explanation:
      "否定文では、直接目的語につく不定冠詞（un・une・des）や部分冠詞（du・de la）が de に変わります（J'ai une voiture. → Je n'ai pas de voiture.）。ただし être の後ろの名詞は変わりません（Ce n'est pas une voiture.）。",
  },
  {
    focus: "blank",
    id: "neg-blank-jamais",
    units: ["negation"],
    prompt: `Elle ne mange ${BLANK} de viande.`,
    note: "彼女は決して肉を食べない。",
    choices: ["plus", "rien", "jamais", "que"],
    answer: "jamais",
    explanation:
      "「決して・一度も〜ない」は ne…jamais です。plus にすると「もう肉を食べない（以前は食べていた）」、que は「〜しか食べない」という限定になり、後ろに de viande は続きません。rien は「何も」なので viande と重なります。",
  },
];

// ── 疑問文・疑問詞 ──
const interrogativeQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "int-meaning-quest-ce-que",
    units: ["interrogative"],
    prompt: "Qu'est-ce que tu fais ce week-end ?",
    choices: [
      "今週末、誰と会うの？",
      "今週末、何をするの？",
      "今週末、何かするの？",
      "今週末、どこへ行くの？",
    ],
    answer: "今週末、何をするの？",
    explanation:
      "qu'est-ce que は「何を」を尋ねる疑問詞です。「何かするの？（はい・いいえで答える質問）」なら Est-ce que tu fais quelque chose ce week-end ?、「誰と」は avec qui、「どこへ」は où です。",
  },
  {
    focus: "form",
    id: "int-form-quel-age",
    units: ["interrogative"],
    prompt: "あなたは何歳ですか？",
    choices: [
      "Quelle âge avez-vous ?",
      "Qu'est-ce que âge avez-vous ?",
      "Quel âge avez-vous ?",
      "Combien âge avez-vous ?",
    ],
    answer: "Quel âge avez-vous ?",
    explanation:
      "「どの・何の」と名詞を直接修飾する疑問形容詞は quel で、名詞の性・数に合わせて quel・quelle・quels・quelles と変わります。âge は男性名詞なので quel です（発音は同じなので綴りに注意）。",
  },
  {
    focus: "context",
    id: "int-context-pourquoi",
    units: ["interrogative"],
    prompt: `A : ${BLANK} tu viens à la fête ?\nB : Parce que Paul m'a invité.`,
    note: "A「…パーティーに来るの？」 B「ポールに誘われたからだよ」",
    choices: ["Quand", "Comment", "Pourquoi", "Où"],
    answer: "Pourquoi",
    explanation:
      "答えが parce que…（なぜなら〜だから）なので、理由を尋ねる pourquoi です。quand は「いつ」、comment は「どうやって」、où は「どこ」を尋ねます。",
  },
  {
    focus: "blank",
    id: "int-blank-quel",
    units: ["interrogative"],
    prompt: `${BLANK} est ton film préféré ?`,
    note: "君のいちばん好きな映画は何？",
    choices: ["Que", "Quoi", "Quel", "Qu'est-ce que"],
    answer: "Quel",
    explanation:
      "「〜は何ですか」と、いくつかの中からどれかを尋ねる「Quel est + 名詞」の形です。quel は主語 ton film（男性単数）に合わせます。que・qu'est-ce que は動詞の目的語「何を」を尋ねるときに使います。",
  },
  {
    focus: "blank",
    id: "int-blank-qui",
    units: ["interrogative"],
    prompt: `${BLANK} est-ce que tu cherches ?`,
    note: "誰を探しているの？",
    choices: ["Qui", "Que", "Quel", "Quoi"],
    answer: "Qui",
    explanation:
      "人について「誰を」と尋ねるときは qui est-ce que を使います。「何を」なら qu'est-ce que（que が母音の前で qu' になる）です。quel は名詞と一緒に使う疑問形容詞です。",
  },
  {
    focus: "blank",
    id: "int-blank-ou-inversion",
    units: ["interrogative"],
    prompt: `${BLANK} habites-tu ?`,
    note: "君はどこに住んでいるの？",
    choices: ["Quoi", "Où", "Quel", "Que"],
    answer: "Où",
    explanation:
      "場所を尋ねる疑問詞は où です。habites-tu のように主語と動詞を倒置してハイフンでつなぐのは、改まった疑問文の形です。会話では Tu habites où ? や Où est-ce que tu habites ? もよく使います。",
  },
];

// ── 比較級・最上級 ──
const comparisonQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "comp-meaning-aussi",
    units: ["comparison"],
    prompt: "Marie est aussi grande que sa mère.",
    choices: [
      "マリーは母親より背が高い。",
      "マリーは母親ほど背が高くない。",
      "マリーは家族でいちばん背が高い。",
      "マリーは母親と同じくらい背が高い。",
    ],
    answer: "マリーは母親と同じくらい背が高い。",
    explanation:
      "aussi + 形容詞 + que は「〜と同じくらい…」という同等比較です。「より高い」は plus grande que、「ほど高くない」は moins grande que、「いちばん高い」は最上級の la plus grande です。",
  },
  {
    focus: "form",
    id: "comp-form-mieux",
    units: ["comparison"],
    prompt: "彼はピエールより歌が上手だ。",
    choices: [
      "Il chante plus bien que Pierre.",
      "Il chante mieux que Pierre.",
      "Il chante meilleur que Pierre.",
      "Il chante plus mieux que Pierre.",
    ],
    answer: "Il chante mieux que Pierre.",
    explanation:
      "副詞 bien（上手に）の比較級は plus bien ではなく mieux です。meilleur は形容詞 bon の比較級なので、動詞 chante を修飾する副詞の位置には使えません。mieux にはすでに「より」の意味があるので plus は付けません。",
  },
  {
    focus: "context",
    id: "comp-context-moins",
    units: ["comparison"],
    prompt: `A : Tu préfères le train ou l'avion ?\nB : Le train. C'est ${BLANK} cher que l'avion.`,
    note: "A「電車と飛行機、どっちがいい？」 B「電車。飛行機より安いから」",
    choices: ["plus", "moins", "aussi", "autant"],
    answer: "moins",
    explanation:
      "「飛行機より安い」は「飛行機ほど高くない」と考えて moins cher que を使います。plus cher だと「飛行機より高い」で、電車を選ぶ理由になりません。autant は名詞や動詞の同等比較に使い、形容詞の前では aussi です。",
  },
  {
    focus: "blank",
    id: "comp-blank-meilleur",
    units: ["comparison"],
    prompt: `Ce gâteau est ${BLANK} que l'autre.`,
    note: "このケーキはもう一つのより美味しい。",
    choices: ["plus bon", "mieux", "meilleur", "plus meilleur"],
    answer: "meilleur",
    explanation:
      "形容詞 bon（良い・美味しい）の比較級は plus bon ではなく meilleur です。mieux は副詞 bien の比較級なので、est の後で名詞を形容する位置には使えません。",
  },
  {
    focus: "blank",
    id: "comp-blank-la-plus",
    units: ["comparison"],
    prompt: `C'est la ${BLANK} belle ville de France.`,
    note: "フランスでいちばん美しい町だ。",
    choices: ["très", "plus", "moins", "meilleure"],
    answer: "plus",
    explanation:
      "最上級は「定冠詞 + plus + 形容詞」で、比べる範囲は de で表します（de France）。la moins belle だと「いちばん美しくない」になります。meilleure は bon の比較級・最上級なので belle とは並べません。",
  },
  {
    focus: "blank",
    id: "comp-blank-plus-de",
    units: ["comparison"],
    prompt: `J'ai ${BLANK} livres que toi.`,
    note: "私は君より本をたくさん持っている。",
    choices: ["plus", "plus des", "autant", "plus de"],
    answer: "plus de",
    explanation:
      "名詞の量を比べるときは plus de・moins de・autant de + 無冠詞名詞 + que を使います。de を落とした plus livres や、冠詞を付けた plus des livres は誤りです。autant だけでは「同じくらい」の意味になり、de も足りません。",
  },
];

// ── 国名・都市名の前置詞 ──
const placeQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "place-meaning-du",
    units: ["place"],
    prompt: "Je viens du Canada.",
    choices: [
      "私はカナダへ行く。",
      "私はカナダに住んでいる。",
      "私はカナダから来た（カナダ出身だ）。",
      "私はカナダに行ったことがある。",
    ],
    answer: "私はカナダから来た（カナダ出身だ）。",
    explanation:
      "venir de… は「〜から来る・〜出身だ」です。Canada は男性名詞の国名なので de + le が縮約して du Canada になります。「カナダへ行く・カナダに住む」なら au Canada です。",
  },
  {
    focus: "form",
    id: "place-form-au-japon",
    units: ["place"],
    prompt: "私は日本に住んでいる。",
    choices: [
      "J'habite en Japon.",
      "J'habite au Japon.",
      "J'habite à Japon.",
      "J'habite à le Japon.",
    ],
    answer: "J'habite au Japon.",
    explanation:
      "「〜に・〜へ」の国名には、男性名詞なら au（à + le）、女性名詞なら en、複数なら aux を使います。Japon は男性名詞なので au Japon です。都市名には冠詞を付けず à を使います（à Tokyo）。",
  },
  {
    focus: "context",
    id: "place-context-en",
    units: ["place"],
    prompt: `A : Tu pars en vacances où ?\nB : Je vais ${BLANK} Italie.`,
    note: "A「休暇はどこに行くの？」 B「イタリアに行くよ」",
    choices: ["à", "au", "en", "aux"],
    answer: "en",
    explanation:
      "Italie は -e で終わる女性名詞の国名なので en Italie です。母音で始まる男性名詞の国名にも en を使います（en Iran）。",
  },
  {
    focus: "blank",
    id: "place-blank-a-paris",
    units: ["place"],
    prompt: `Elle travaille ${BLANK} Paris.`,
    note: "彼女はパリで働いている。",
    choices: ["en", "au", "à", "de"],
    answer: "à",
    explanation:
      "都市名には冠詞を付けず、「〜で・〜へ」は à で表します（à Paris・à Kyoto）。en・au は国名に使います。",
  },
  {
    focus: "blank",
    id: "place-blank-aux",
    units: ["place"],
    prompt: `Nous allons ${BLANK} États-Unis cet été.`,
    note: "この夏、私たちはアメリカへ行く。",
    choices: ["en", "au", "à", "aux"],
    answer: "aux",
    explanation:
      "États-Unis は複数形の国名なので、à + les が縮約して aux になります（aux États-Unis・aux Pays-Bas）。",
  },
  {
    focus: "blank",
    id: "place-blank-d",
    units: ["place"],
    prompt: `Il revient ${BLANK} Espagne demain.`,
    note: "彼は明日スペインから戻ってくる。",
    choices: ["de l'", "du", "d'", "en"],
    answer: "d'",
    explanation:
      "女性名詞の国名から「〜から」と言うときは、冠詞を付けずに de だけを使います。Espagne は母音で始まるので d'Espagne です。男性名詞なら du（du Japon）、複数なら des（des États-Unis）になります。",
  },
  {
    focus: "blank",
    id: "place-blank-au-portugal",
    units: ["place"],
    prompt: `Mon frère est ${BLANK} Portugal.`,
    note: "兄はポルトガルにいる。",
    choices: ["en", "à", "au", "aux"],
    answer: "au",
    explanation:
      "Portugal は男性名詞の国名なので au Portugal です。-e で終わらない国名はたいてい男性名詞です（-e で終わっても le Mexique・le Cambodge は男性名詞）。",
  },
];

export const grammarQuiz: GrammarQuestion[] = [
  ...articleQuestions,
  ...agreementQuestions,
  ...negationQuestions,
  ...interrogativeQuestions,
  ...comparisonQuestions,
  ...placeQuestions,
];
