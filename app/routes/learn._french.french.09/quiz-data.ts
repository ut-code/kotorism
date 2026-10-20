import type { GrammarUnitDef } from "@/lib/shared/learn/grammar-quiz";
import { BLANK } from "@/lib/shared/learn/grammar-quiz";
import type { PronunciationQuestion as Question } from "@/lib/shared/learn/pronunciation-quiz";

// 出題の単元。つづりと発音の対応（母音字・子音字）と、語どうしのつながり（リエゾンなど）に分ける
export const pronunciationUnits = [
  { id: "nasal", label: "鼻母音", sub: "in・an/en・on・un" },
  { id: "vowel", label: "母音字の組み合わせ", sub: "ou・u・eau・ai・oi・eu" },
  { id: "e", label: "e の読み方", sub: "é・è・ê・読まない e" },
  { id: "consonant", label: "子音字", sub: "ch・gn・ç・ss/s・ill" },
  { id: "final", label: "語末の子音字", sub: "読まない子音字・-ent・-er" },
  { id: "liaison", label: "リエゾン・エリジオン", sub: "les‿amis・有音の h" },
] as const satisfies readonly GrammarUnitDef[];

type PronunciationQuestion = Question<(typeof pronunciationUnits)[number]["id"]>;

// 発音クイズの出題データ。問題は単元ごとにまとめ、units に単元タグ（pronunciationUnits の id）を付ける。
// 聞き取りの誤答は、読み上げた音とははっきり違う音になるつづりから選ぶ（同じ音のつづり ain/in/ein などは混ぜない）。
// 読み方の選択肢は発音記号で示し、choiceSpeech にその音になるつづりを書いて読み上げる

// ── 鼻母音 ──
const nasalQuestions: PronunciationQuestion[] = [
  {
    kind: "listening",
    id: "nasal-listen-pain",
    units: ["nasal"],
    prompt: `p${BLANK}`,
    speech: "pain",
    note: "パン",
    choices: ["an", "ain", "on", "ou"],
    answer: "ain",
    explanation:
      "pain は [pɛ̃] と読みます。ain・in・ein・aim・im はどれも同じ鼻母音 [ɛ̃] です。an は [ɑ̃]（pan）、on は [ɔ̃]（pont）で、ou は鼻母音ではない [u] です。",
  },
  {
    kind: "listening",
    id: "nasal-listen-vent",
    units: ["nasal"],
    prompt: `v${BLANK}`,
    speech: "vent",
    note: "風",
    choices: ["in", "on", "ent", "u"],
    answer: "ent",
    explanation:
      "vent は [vɑ̃] と読みます。en・em・an・am は同じ鼻母音 [ɑ̃] で、語末の t は読みません。vin [vɛ̃]（ワイン）、vont [vɔ̃]（行く）とは鼻母音の音色で区別します。",
  },
  {
    kind: "listening",
    id: "nasal-listen-bon",
    units: ["nasal"],
    prompt: `b${BLANK}`,
    speech: "bon",
    note: "良い",
    choices: ["an", "in", "eau", "on"],
    answer: "on",
    explanation:
      "bon は [bɔ̃] と読みます。on・om は口を丸めた鼻母音 [ɔ̃] です。banc [bɑ̃]（ベンチ）とは、唇を丸めるかどうかで区別します。",
  },
  {
    kind: "listening",
    id: "nasal-listen-lundi",
    units: ["nasal"],
    prompt: `l${BLANK}di`,
    speech: "lundi",
    note: "月曜日",
    choices: ["an", "un", "on", "ou"],
    answer: "un",
    explanation:
      "lundi は [lœ̃di] と読みます。un・um は鼻母音 [œ̃] ですが、今のフランス語では [ɛ̃]（in）と同じように発音する人が多くなっています。an [ɑ̃]・on [ɔ̃] とは音色がはっきり違います。",
  },
  {
    kind: "rule",
    id: "nasal-rule-bonne",
    units: ["nasal"],
    prompt: "次のうち、鼻母音を含まない語はどれ？",
    choices: ["bon", "vin", "bonne", "temps"],
    answer: "bonne",
    explanation:
      "母音字 + n・m は、後ろに母音字が続くときや nn・mm と重なるときは鼻母音になりません。bonne は [bɔn] で、o のあとに n をはっきり発音します。bon [bɔ̃]・vin [vɛ̃]・temps [tɑ̃] は鼻母音です。",
  },
  {
    kind: "rule",
    id: "nasal-rule-em",
    units: ["nasal"],
    prompt: "temps の em と同じ鼻母音を含む語はどれ？",
    choices: ["vin", "bon", "un", "enfant"],
    answer: "enfant",
    explanation:
      "em・en は an・am と同じ [ɑ̃] です。enfant [ɑ̃fɑ̃] は en と an の両方が [ɑ̃] になります。vin は [ɛ̃]、bon は [ɔ̃]、un は [œ̃] です。",
  },
  {
    kind: "reading",
    id: "nasal-read-bonne",
    units: ["nasal"],
    prompt: "bonne",
    note: "良い（女性形）",
    choices: ["[bɔ̃]", "[bun]", "[bɔn]", "[byn]"],
    choiceSpeech: ["bon", "boune", "bonne", "bune"],
    answer: "[bɔn]",
    explanation:
      "nn と n が重なるので鼻母音にならず、[bɔn] と n をはっきり発音します。男性形の bon [bɔ̃] は鼻母音です。o を ou [u] や u [y] のように読まないようにしましょう。",
  },
  {
    kind: "reading",
    id: "nasal-read-parfum",
    units: ["nasal"],
    prompt: "parfum",
    note: "香水",
    choices: ["[paʁfym]", "[paʁfœ̃]", "[paʁfɔ̃]", "[paʁfum]"],
    choiceSpeech: ["parfume", "parfum", "parfon", "parfoume"],
    answer: "[paʁfœ̃]",
    explanation:
      "語末の um は鼻母音 [œ̃] で、m は発音しません（[ɛ̃] に近く発音されることも多い）。後ろに e が付いた parfume（香りをつける）は鼻母音にならず [paʁfym] です。",
  },
];

// ── 母音字の組み合わせ ──
const vowelQuestions: PronunciationQuestion[] = [
  {
    kind: "listening",
    id: "vowel-listen-beau",
    units: ["vowel"],
    prompt: `b${BLANK}`,
    speech: "beau",
    note: "美しい",
    choices: ["ou", "eau", "eu", "oi"],
    answer: "eau",
    explanation:
      "beau は [bo] と読みます。eau・au はどちらも [o] です。ou は [u]（bout）、eu は [ø]（bleu）、oi は [wa]（bois）と読みます。",
  },
  {
    kind: "listening",
    id: "vowel-listen-lait",
    units: ["vowel"],
    prompt: `l${BLANK}t`,
    speech: "lait",
    note: "牛乳",
    choices: ["ou", "oi", "ai", "au"],
    answer: "ai",
    explanation:
      "lait は [lɛ] と読み、語末の t は読みません。ai・ei は「エ」の音 [ɛ] です。ou は [u]、oi は [wa]、au は [o] になります。",
  },
  {
    kind: "listening",
    id: "vowel-listen-deux",
    units: ["vowel"],
    prompt: `d${BLANK}x`,
    speech: "deux",
    note: "2",
    choices: ["ou", "eu", "oi", "au"],
    answer: "eu",
    explanation:
      "deux は [dø] と読み、語末の x は読みません。eu は唇を丸めて「エ」と言う [ø] です。ou [u]・au [o] と取り違えないようにしましょう。",
  },
  {
    kind: "listening",
    id: "vowel-listen-toit",
    units: ["vowel"],
    prompt: `t${BLANK}t`,
    speech: "toit",
    note: "屋根",
    choices: ["ou", "eu", "ai", "oi"],
    answer: "oi",
    explanation:
      "toit は [twa] と読みます。oi は「ワ」に近い [wa] です。ローマ字読みで「オイ」と読まないようにしましょう。",
  },
  {
    kind: "rule",
    id: "vowel-rule-u-ou",
    units: ["vowel"],
    prompt: "u と ou の発音の違いとして正しいものは？",
    choices: [
      "u も ou も「ウ」[u] と読む",
      "u は「イ」の舌の位置で唇を丸める [y]、ou は「ウ」に近い [u]",
      "u は [u]、ou は「オウ」[ou]",
      "u は「ユ」[ju]、ou は [u]",
    ],
    answer: "u は「イ」の舌の位置で唇を丸める [y]、ou は「ウ」に近い [u]",
    explanation:
      "u は日本語にない音 [y] で、「イ」と言いながら唇を丸めて突き出します（tu [ty]）。ou は唇を丸めた「ウ」[u] です（tout [tu]）。vu [vy] と vous [vu] のように意味が変わるので区別が大切です。",
  },
  {
    kind: "rule",
    id: "vowel-rule-au",
    units: ["vowel"],
    prompt: "au・eau の読み方は？",
    choices: ["[au]", "[eo]", "[o]", "[ɔ̃]"],
    answer: "[o]",
    explanation:
      "au・eau は1つの母音 [o] で読みます（auto [oto]・eau [o]・bateau [bato]）。文字ごとに「アウ」「エオ」と読まないようにしましょう。",
  },
  {
    kind: "reading",
    id: "vowel-read-voiture",
    units: ["vowel"],
    prompt: "voiture",
    note: "車",
    choices: ["[vwatuʁ]", "[vɔtyʁ]", "[vatyʁ]", "[vwatyʁ]"],
    choiceSpeech: ["voitoure", "voture", "vature", "voiture"],
    answer: "[vwatyʁ]",
    explanation:
      "oi は [wa]、u は [y] で、voiture は [vwatyʁ] です。u を ou [u] のように読むと別の音になるので注意しましょう。",
  },
  {
    kind: "reading",
    id: "vowel-read-nous",
    units: ["vowel", "final"],
    prompt: "nous",
    note: "私たち",
    choices: ["[ny]", "[nu]", "[nus]", "[no]"],
    choiceSpeech: ["nu", "nous", "nousse", "nos"],
    answer: "[nu]",
    explanation:
      "ou は [u] で、語末の s は読まないので nous は [nu] です。u だけなら [y]（nu ＝裸の）、o なら [o]（nos ＝私たちの）になります。",
  },
];

// ── e の読み方 ──
const eQuestions: PronunciationQuestion[] = [
  {
    kind: "listening",
    id: "e-listen-mere",
    units: ["e"],
    prompt: `m${BLANK}re`,
    speech: "mère",
    note: "母",
    choices: ["eu", "è", "ou", "i"],
    answer: "è",
    explanation:
      "mère は [mɛʁ] と読みます。è・ê は口を広めに開けた「エ」[ɛ] です。語末の e は読みません。",
  },
  {
    kind: "listening",
    id: "e-listen-chez",
    units: ["e", "final"],
    prompt: `ch${BLANK}`,
    speech: "chez",
    note: "〜の家で",
    choices: ["a", "ou", "ez", "u"],
    answer: "ez",
    explanation:
      "chez は [ʃe] と読みます。語末の -ez・-er は狭い「エ」[e] で、z・r は読みません（parlez [paʁle]・parler [paʁle]）。",
  },
  {
    kind: "rule",
    id: "e-rule-final",
    units: ["e"],
    prompt: "語末のアクサンのない e（table・porte など）の読み方は？",
    choices: ["[e] と読む", "ふつう読まない", "[ɛ] と読む", "「ウ」とはっきり読む"],
    answer: "ふつう読まない",
    explanation:
      "語末のアクサンのない e はふつう読みません（table [tabl]）。ただし、前の子音字を読む合図になります（petit [pəti] → petite [pətit]）。",
  },
  {
    kind: "rule",
    id: "e-rule-merci",
    units: ["e"],
    prompt: "アクサンのない e が「エ」[ɛ] と読まれるのはどれ？",
    choices: ["le", "petit", "demain", "merci"],
    answer: "merci",
    explanation:
      "アクサンのない e でも、後ろに子音字が2つ続く（merci の rc）か、語末の子音字の前にある（mer）ときは [ɛ] と読みます。le・petit・demain の e は弱い「ウ」に近い [ə] です。",
  },
  {
    kind: "rule",
    id: "e-rule-accents",
    units: ["e"],
    prompt: "é と è の発音の違いとして正しいものは？",
    choices: [
      "é は狭い「エ」[e]、è は口を広めに開けた「エ」[ɛ]",
      "é も è も読まない",
      "é は [i]、è は [e]",
      "é は「ウ」[ə]、è は [e]",
    ],
    answer: "é は狭い「エ」[e]、è は口を広めに開けた「エ」[ɛ]",
    explanation:
      "アクサン・テギュの é は口をあまり開けない [e]（été [ete]）、アクサン・グラーヴの è と ê は口を広めに開ける [ɛ]（mère [mɛʁ]・fête [fɛt]）です。どちらも必ず読みます。",
  },
  {
    kind: "reading",
    id: "e-read-petit",
    units: ["e", "final"],
    prompt: "petit",
    note: "小さい",
    choices: ["[peti]", "[pɛti]", "[pəti]", "[pətit]"],
    choiceSpeech: ["péti", "pèti", "petit", "petite"],
    answer: "[pəti]",
    explanation:
      "1つ目の e は後ろに子音字が1つだけなので弱い [ə] で、語末の t は読みません。女性形 petite になると t を読んで [pətit] になります。",
  },
  {
    kind: "reading",
    id: "e-read-fenetre",
    units: ["e"],
    prompt: "fenêtre",
    note: "窓",
    choices: ["[fenetʁ]", "[fənɛtʁ]", "[fənɛtʁe]", "[fanɛtʁ]"],
    choiceSpeech: ["fénétre", "fenêtre", "fenêtré", "fanêtre"],
    answer: "[fənɛtʁ]",
    explanation:
      "最初の e は弱い [ə]、ê は広い [ɛ] で、語末の e は読みません。アクサンの有無で読み方が変わるので、e ごとに確かめましょう。",
  },
];

// ── 子音字 ──
const consonantQuestions: PronunciationQuestion[] = [
  {
    kind: "listening",
    id: "cons-listen-montagne",
    units: ["consonant"],
    prompt: `monta${BLANK}e`,
    speech: "montagne",
    note: "山",
    choices: ["n", "gn", "ng", "ni"],
    answer: "gn",
    explanation:
      "gn は「ニャ」行の子音 [ɲ] で、montagne は [mɔ̃taɲ] です。g と n を別々に読みません。",
  },
  {
    kind: "listening",
    id: "cons-listen-poisson",
    units: ["consonant"],
    prompt: `poi${BLANK}on`,
    speech: "poisson",
    note: "魚",
    choices: ["s", "z", "ss", "ch"],
    answer: "ss",
    explanation:
      "母音字にはさまれた s は [z] になりますが、ss は [s] のままです。poisson [pwasɔ̃]（魚）と poison [pwazɔ̃]（毒）は s の数で音も意味も変わります。",
  },
  {
    kind: "listening",
    id: "cons-listen-garcon",
    units: ["consonant"],
    prompt: `gar${BLANK}on`,
    speech: "garçon",
    note: "男の子",
    choices: ["c", "g", "ch", "ç"],
    answer: "ç",
    explanation:
      "c は a・o・u の前では [k] ですが、セディーユの付いた ç はいつも [s] です。garçon は [gaʁsɔ̃] で、c のままだと [k] の音になってしまいます。",
  },
  {
    kind: "rule",
    id: "cons-rule-c",
    units: ["consonant"],
    prompt: "c が [s] と読まれるのはどんなとき？",
    choices: [
      "後ろに a・o・u が続くとき",
      "語末に来たとき",
      "後ろに e・i・y が続くとき",
      "いつも [s] と読む",
    ],
    answer: "後ろに e・i・y が続くとき",
    explanation:
      "c は e・i・y の前で [s]（ceci・cinéma）、それ以外では [k]（café・cours）です。g も同じで、e・i・y の前では [ʒ]（genou）、それ以外では [g]（gare）になります。",
  },
  {
    kind: "rule",
    id: "cons-rule-s",
    units: ["consonant"],
    prompt: "母音字にはさまれた s（maison・rose など）の読み方は？",
    choices: ["[s]", "[z]", "読まない", "[ʃ]"],
    answer: "[z]",
    explanation:
      "母音字にはさまれた s は濁って [z] になります（maison [mɛzɔ̃]）。[s] と読ませたいときは ss と書きます（dessert [desɛʁ] と désert [dezɛʁ] は別の語）。",
  },
  {
    kind: "rule",
    id: "cons-rule-h",
    units: ["consonant", "liaison"],
    prompt: "h の発音として正しいものは？",
    choices: [
      "語頭の h だけ [h] と読む",
      "どの h も発音しない",
      "h はいつも [h] と読む",
      "ch・ph の h だけ [h] と読む",
    ],
    answer: "どの h も発音しない",
    explanation:
      "フランス語の h は発音しません（hôtel [otɛl]）。ただし有音の h（héros など）で始まる語の前ではリエゾンやエリジオンをしません。ch [ʃ]・ph [f] は2文字で1つの音を表します。",
  },
  {
    kind: "reading",
    id: "cons-read-fille",
    units: ["consonant"],
    prompt: "fille",
    note: "娘・女の子",
    choices: ["[fil]", "[file]", "[fij]", "[fi]"],
    choiceSpeech: ["fil", "filé", "fille", "fit"],
    answer: "[fij]",
    explanation:
      "母音字のあとの ill はふつう「イユ」に近い [ij] で、l の音にはなりません（famille [famij]）。ただし ville [vil]・mille [mil]・tranquille [tʁɑ̃kil] は例外で [l] と読みます。",
  },
  {
    kind: "reading",
    id: "cons-read-orange",
    units: ["consonant"],
    prompt: "orange",
    note: "オレンジ",
    choices: ["[ɔʁɑ̃g]", "[ɔʁɑ̃ʒe]", "[ɔʁan]", "[ɔʁɑ̃ʒ]"],
    choiceSpeech: ["orangue", "orangé", "oranne", "orange"],
    answer: "[ɔʁɑ̃ʒ]",
    explanation:
      "g は e の前で [ʒ] になり、語末の e は読まないので [ɔʁɑ̃ʒ] です。an は後ろに子音字 g が続くので鼻母音 [ɑ̃] になります。",
  },
  {
    kind: "reading",
    id: "cons-read-quatre",
    units: ["consonant"],
    prompt: "quatre",
    note: "4",
    choices: ["[kwatʁ]", "[katʁ]", "[kɥatʁ]", "[katʁe]"],
    choiceSpeech: ["kouatre", "quatre", "kuatre", "katré"],
    answer: "[katʁ]",
    explanation:
      "qu はふつう [k] の1音で、u は読みません（quatre [katʁ]・qui [ki]）。英語のように「クワ」と読まないようにしましょう。語末の e も読みません。",
  },
];

// ── 語末の子音字 ──
const finalQuestions: PronunciationQuestion[] = [
  {
    kind: "rule",
    id: "final-rule-careful",
    units: ["final"],
    prompt: "語末でふつう発音される子音字の組は？",
    choices: ["d・s・t・x", "p・g・z・n", "c・r・f・l", "b・m・s・t"],
    answer: "c・r・f・l",
    explanation:
      "語末の子音字はふつう読みませんが、c・r・f・l は読むことが多いです（英語の careful の子音と覚える: avec・bonjour・neuf・sel）。ただし -er で終わる動詞の不定詞の r は読みません。",
  },
  {
    kind: "rule",
    id: "final-rule-ent",
    units: ["final"],
    prompt: "動詞の活用語尾 -ent（ils parlent など）の読み方は？",
    choices: ["[ɑ̃]", "[ɑ̃t]", "読まない", "[ə]"],
    answer: "読まない",
    explanation:
      "3人称複数の活用語尾 -ent は読みません。ils parlent は il parle と同じ [ilpaʁl] です。副詞や名詞の -ent（souvent・le vent）は [ɑ̃] と読むので区別しましょう。",
  },
  {
    kind: "rule",
    id: "final-rule-er",
    units: ["final", "e"],
    prompt: "動詞の不定詞の語尾 -er（parler・manger など）の読み方は？",
    choices: ["[ɛʁ]", "[œʁ]", "読まない", "[e]"],
    answer: "[e]",
    explanation:
      "不定詞の -er は [e] と読み、r は読みません（parler [paʁle]）。mer [mɛʁ]・hiver [ivɛʁ] のような名詞の -er は r を読むことが多いので、動詞の語尾とは別に覚えましょう。",
  },
  {
    kind: "reading",
    id: "final-read-parlent",
    units: ["final"],
    prompt: "ils parlent",
    note: "彼らは話す",
    choices: ["[ilpaʁlɑ̃]", "[ilpaʁlɑ̃t]", "[ilpaʁle]", "[ilpaʁl]"],
    choiceSpeech: ["ils parlant", "il parlante", "il parlé", "ils parlent"],
    answer: "[ilpaʁl]",
    explanation:
      "活用語尾の -ent は読まず、ils の s も子音の前なのでリエゾンしません。ils parlent [ilpaʁl] は il parle と同じ発音です。",
  },
  {
    kind: "reading",
    id: "final-read-avec",
    units: ["final"],
    prompt: "avec",
    note: "〜と一緒に",
    choices: ["[avɛ]", "[avɛk]", "[ave]", "[avœk]"],
    choiceSpeech: ["avè", "avec", "avé", "aveuk"],
    answer: "[avɛk]",
    explanation:
      "語末の c は読む子音字の1つで（c・r・f・l）、avec は [avɛk] です。c の前の e は語末の子音字の前なので [ɛ] になります。",
  },
  {
    kind: "reading",
    id: "final-read-beaucoup",
    units: ["final", "vowel"],
    prompt: "beaucoup",
    note: "たくさん",
    choices: ["[bokup]", "[boky]", "[boku]", "[bokupə]"],
    choiceSpeech: ["beaucoupe", "bocu", "beaucoup", "beaucoupeu"],
    answer: "[boku]",
    explanation:
      "語末の p は読まないので [boku] です。eau は [o]、ou は [u] で、u [y] と取り違えないようにしましょう。",
  },
  {
    kind: "reading",
    id: "final-read-sept",
    units: ["final"],
    prompt: "sept",
    note: "7",
    choices: ["[sɛpt]", "[sɛ]", "[sɛpə]", "[sɛt]"],
    choiceSpeech: ["cèpte", "sè", "cèpeu", "sept"],
    answer: "[sɛt]",
    explanation:
      "sept は p を読まず、語末の t を読んで [sɛt] です。数詞は sept・huit・dix のように語末の子音字を読むものが多いので、1つずつ覚えましょう。",
  },
];

// ── リエゾン・エリジオン ──
const liaisonQuestions: PronunciationQuestion[] = [
  {
    kind: "rule",
    id: "liaison-rule-et",
    units: ["liaison"],
    prompt: "リエゾンしてはいけないのはどれ？",
    choices: [
      "冠詞と名詞の間（les amis）",
      "et と次の語の間（et il）",
      "主語の代名詞と動詞の間（vous avez）",
      "前置詞 en と次の語の間（en avril）",
    ],
    answer: "et と次の語の間（et il）",
    explanation:
      "et の t は、後ろに母音で始まる語が来てもリエゾンしません（et il [eil]）。冠詞と名詞、主語の代名詞と動詞、短い前置詞と次の語の間では、リエゾンが必ず起こります。",
  },
  {
    kind: "rule",
    id: "liaison-rule-z",
    units: ["liaison"],
    prompt: "リエゾンで、語末の s・x はどんな音になる？",
    choices: ["[s]", "[ks]", "読まない", "[z]"],
    answer: "[z]",
    explanation:
      "リエゾンすると語末の s・x は [z] になります（les amis [lezami]・deux ans [døzɑ̃]）。d は [t]（grand homme [gʁɑ̃tɔm]）、f は一部で [v]（neuf heures [nœvœʁ]）になります。",
  },
  {
    kind: "rule",
    id: "liaison-rule-h-aspire",
    units: ["liaison"],
    prompt: "有音の h で始まる語（le héros・les haricots など）の前では？",
    choices: [
      "リエゾンだけする",
      "エリジオンだけする",
      "リエゾンもエリジオンもしない",
      "リエゾンもエリジオンもする",
    ],
    answer: "リエゾンもエリジオンもしない",
    explanation:
      "有音の h も発音はしませんが、子音で始まる語のように扱います。そのため le héros（l'héros とはしない）、les haricots [leaʁiko]（リエゾンしない）となります。無音の h なら l'homme・les hommes [lezɔm] です。",
  },
  {
    kind: "reading",
    id: "liaison-read-les-amis",
    units: ["liaison"],
    prompt: "les amis",
    note: "友人たち",
    choices: ["[leami]", "[lesami]", "[lezami]", "[lezamis]"],
    choiceSpeech: ["lé ami", "lessami", "les amis", "lézamisse"],
    answer: "[lezami]",
    explanation:
      "冠詞 les と母音で始まる名詞の間では必ずリエゾンし、s は [z] になります。amis の語末の s は読みません。",
  },
  {
    kind: "reading",
    id: "liaison-read-vous-avez",
    units: ["liaison"],
    prompt: "vous avez",
    note: "あなたは持っている",
    choices: ["[vuzave]", "[vuave]", "[vusave]", "[vyzave]"],
    choiceSpeech: ["vous avez", "vou avé", "vous savez", "vuzavé"],
    answer: "[vuzave]",
    explanation:
      "主語の代名詞と動詞の間では必ずリエゾンし、vous の s は [z] になります。[s] と読むと vous savez（あなたは知っている）に聞こえてしまいます。",
  },
  {
    kind: "reading",
    id: "liaison-read-deux-heures",
    units: ["liaison", "consonant"],
    prompt: "deux heures",
    note: "2時",
    choices: ["[døœʁ]", "[døzœʁ]", "[døsœʁ]", "[døzœʁz]"],
    choiceSpeech: ["deu eure", "deux heures", "deusseure", "deuzeurze"],
    answer: "[døzœʁ]",
    explanation:
      "heure の h は無音の h なので、deux の x は [z] でリエゾンします。heures の語末の s は読みません。",
  },
];

export const pronunciationQuiz: PronunciationQuestion[] = [
  ...nasalQuestions,
  ...vowelQuestions,
  ...eQuestions,
  ...consonantQuestions,
  ...finalQuestions,
  ...liaisonQuestions,
];
