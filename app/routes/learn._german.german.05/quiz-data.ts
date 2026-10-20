import {
  BLANK,
  type GrammarQuestion as Question,
  type GrammarUnitDef,
} from "@/lib/shared/learn/grammar-quiz";

// 出題の単元。格変化はドイツ語の文法で特に重いので、冠詞・代名詞・動詞・前置詞・形容詞ごとに単元を分けて
// 重点的に演習できるようにする。格変化に関わらない文法は 06「文法クイズ（その他）」で扱う
export const grammarUnits = [
  { id: "definite", label: "定冠詞", sub: "der・den・dem・des" },
  { id: "indefinite", label: "不定冠詞・所有冠詞", sub: "ein・kein・mein…" },
  { id: "pronoun", label: "人称代名詞", sub: "mich・mir・ihn・ihm…" },
  { id: "reflexive", label: "再帰代名詞", sub: "mich・mir・sich" },
  { id: "verb-case", label: "動詞の格支配", sub: "helfen・danken・fragen…" },
  { id: "preposition", label: "前置詞の格支配", sub: "mit・für・in・auf…" },
  { id: "adjective", label: "形容詞の語尾", sub: "der gute・ein guter…" },
] as const satisfies readonly GrammarUnitDef[];

type GrammarQuestion = Question<(typeof grammarUnits)[number]["id"]>;

// 文法クイズの出題データ。問題は単元ごとにまとめ、units に単元タグ（grammarUnits の id）を付ける。
// 複数の単元にまたがる問題は、タグを複数付ければどちらの単元を選んでも出題される

// ── 定冠詞 ──
const definiteQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "case-meaning-akk",
    units: ["definite"],
    prompt: "Den Hund beißt der Mann.",
    choices: [
      "犬が男をかむ。",
      "男が犬をかむ。",
      "男と犬がかみ合う。",
      "男は犬にかまれそうになる。",
    ],
    answer: "男が犬をかむ。",
    explanation:
      "ドイツ語では語順ではなく冠詞の格で役割が決まります。den Hund は4格（〜を）、der Mann は1格（〜が）なので「男が犬をかむ」です。目的語を文頭に置いて強調しても、定動詞（beißt）は2番目のままです。",
  },
  {
    focus: "form",
    id: "case-form-dat",
    units: ["definite", "verb-case"],
    prompt: "私はその男性に本をあげる。",
    choices: [
      "Ich gebe den Mann das Buch.",
      "Ich gebe der Mann das Buch.",
      "Ich gebe dem Mann das Buch.",
      "Ich gebe des Mannes das Buch.",
    ],
    answer: "Ich gebe dem Mann das Buch.",
    explanation:
      "geben は「人に（3格）物を（4格）」をとる動詞です。男性名詞 Mann の3格の定冠詞は dem です。den は男性4格、der は男性1格（または女性3格）、des は2格（〜の）です。",
  },
  {
    focus: "context",
    id: "case-context-der",
    units: ["definite", "verb-case"],
    prompt: `A: Wem gehört die Tasche?\nB: Sie gehört ${BLANK} Frau dort.`,
    note: "A「そのバッグ、誰の？」 B「あそこの女性のだよ」",
    choices: ["die", "den", "der", "dem"],
    answer: "der",
    explanation:
      "gehören（〜のものである）は持ち主を3格でとります。問いの wem も3格の疑問詞です。女性名詞 Frau の3格の定冠詞は der です。die は女性の1格・4格、dem は男性・中性の3格です。",
  },
  {
    focus: "blank",
    id: "case-blank-den",
    units: ["definite"],
    prompt: `Ich sehe ${BLANK} Lehrer.`,
    note: "私は先生を見かける。",
    choices: ["der", "dem", "des", "den"],
    answer: "den",
    explanation:
      "sehen の目的語（〜を）は4格です。男性名詞の定冠詞は4格で der から den に変わります。女性・中性・複数では1格と4格が同じ形（die・das・die）なので、形が変わるのは男性だけです。",
  },
  {
    focus: "blank",
    id: "case-blank-des",
    units: ["definite"],
    prompt: `Das ist das Auto ${BLANK} Vaters.`,
    note: "これは父親の車だ。",
    choices: ["der", "des", "dem", "den"],
    answer: "des",
    explanation:
      "「〜の」という所有は2格で表し、名詞の後ろに置きます。男性・中性名詞の2格の定冠詞は des で、名詞にも -s・-es が付きます（Vaters）。女性・複数の2格は der です。",
  },
  {
    focus: "blank",
    id: "case-blank-mit-dem",
    units: ["definite", "preposition"],
    prompt: `Ich fahre mit ${BLANK} Bus.`,
    note: "私はバスで行く。",
    choices: ["der", "den", "dem", "die"],
    answer: "dem",
    explanation:
      "mit はいつも3格をとる前置詞です。Bus は男性名詞なので3格の定冠詞 dem を使います。mit のほか aus・bei・nach・seit・von・zu も3格支配です。",
  },
  {
    focus: "meaning",
    id: "def-meaning-dat-akk",
    units: ["definite", "verb-case"],
    prompt: "Der Lehrer gibt dem Schüler das Heft.",
    choices: [
      "生徒が先生にノートを渡す。",
      "先生が生徒にノートを渡す。",
      "先生が生徒のノートを渡す。",
      "先生と生徒がノートを渡し合う。",
    ],
    answer: "先生が生徒にノートを渡す。",
    explanation:
      "der Lehrer は1格（〜が）、dem Schüler は3格（〜に）、das Heft は4格（〜を）です。語順を入れ替えても、冠詞の格で誰が誰に渡すのかが決まります。「生徒のノート」なら2格で das Heft des Schülers です。",
  },
  {
    focus: "context",
    id: "def-context-den",
    units: ["definite"],
    prompt: `A: Wo ist der Schlüssel?\nB: Ich habe ${BLANK} Schlüssel nicht gesehen.`,
    note: "A「鍵はどこ？」 B「鍵は見てないよ」",
    choices: ["der", "dem", "den", "des"],
    answer: "den",
    explanation:
      "sehen の目的語（〜を）は4格です。問いでは der Schlüssel（1格）でも、答えの文では目的語なので男性4格の den Schlüssel に変わります。",
  },
  {
    focus: "blank",
    id: "def-blank-dat-pl",
    units: ["definite"],
    prompt: `Ich schenke ${BLANK} Kindern Bücher.`,
    note: "私は子どもたちに本を贈る。",
    choices: ["die", "der", "dem", "den"],
    answer: "den",
    explanation:
      "「子どもたちに」は3格で、複数の3格の定冠詞は den です。複数3格では名詞にも -n を付けます（die Kinder → den Kindern）。男性4格の den と同じ形なので、名詞の語尾が手がかりになります。",
  },
  {
    focus: "blank",
    id: "def-blank-gen-fem",
    units: ["definite"],
    prompt: `Die Farbe ${BLANK} Tasche gefällt mir.`,
    note: "そのバッグの色が気に入っている。",
    choices: ["die", "des", "der", "den"],
    answer: "der",
    explanation:
      "「そのバッグの色」は2格で表し、女性名詞 Tasche の2格の定冠詞は der です。男性・中性なら des で名詞に -s が付きますが、女性名詞には何も付きません。",
  },
];

// ── 不定冠詞・否定冠詞・所有冠詞 ──
const indefiniteQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "ind-meaning-meinem",
    units: ["indefinite", "verb-case"],
    prompt: "Meinem Vater gefällt das Buch nicht.",
    choices: [
      "その本は父のものではない。",
      "父にその本をあげなかった。",
      "父はその本が気に入らない。",
      "父はその本を読まない。",
    ],
    answer: "父はその本が気に入らない。",
    explanation:
      "gefallen は「（1格が）3格の人の気に入る」という動詞で、好む人を3格で表します。meinem Vater は所有冠詞 mein の男性3格です。主語は das Buch なので、文頭の3格に惑わされないようにしましょう。",
  },
  {
    focus: "form",
    id: "ind-form-einen",
    units: ["indefinite"],
    prompt: "私には兄弟が1人いる。",
    choices: [
      "Ich habe ein Bruder.",
      "Ich habe einen Bruder.",
      "Ich habe einem Bruder.",
      "Ich habe einer Bruder.",
    ],
    answer: "Ich habe einen Bruder.",
    explanation:
      "haben の目的語は4格です。Bruder は男性名詞なので、不定冠詞は4格で ein から einen に変わります。女性・中性では1格と4格が同じ形（eine・ein）です。",
  },
  {
    focus: "context",
    id: "ind-context-kein",
    units: ["indefinite"],
    prompt: `A: Hast du ein Fahrrad?\nB: Nein, ich habe ${BLANK} Fahrrad.`,
    note: "A「自転車持ってる？」 B「ううん、持ってないよ」",
    choices: ["keinen", "keine", "kein", "keinem"],
    answer: "kein",
    explanation:
      "否定冠詞 kein は不定冠詞 ein と同じ語尾をとります。Fahrrad は中性名詞で、中性の4格は1格と同じなので語尾のない kein です。keinen は男性4格の形です。",
  },
  {
    focus: "blank",
    id: "ind-blank-meiner",
    units: ["indefinite"],
    prompt: `Ich gebe ${BLANK} Freundin eine Blume.`,
    note: "私は（自分の）女友達に花をあげる。",
    choices: ["meine", "meinem", "meinen", "meiner"],
    answer: "meiner",
    explanation:
      "「（私の）女友達に」は3格です。所有冠詞 mein も ein と同じ語尾をとり、女性3格は meiner になります。meine は女性1格・4格、meinem は男性・中性3格です。",
  },
  {
    focus: "blank",
    id: "ind-blank-meines",
    units: ["indefinite"],
    prompt: `Das ist das Haus ${BLANK} Onkels.`,
    note: "これは私のおじの家だ。",
    choices: ["meines", "mein", "meinem", "meinen"],
    answer: "meines",
    explanation:
      "「私のおじの」は2格で、男性の2格は meines です。名詞にも -s が付きます（Onkels）。",
  },
  {
    focus: "blank",
    id: "ind-blank-einer",
    units: ["indefinite", "preposition"],
    prompt: `Wir wohnen in ${BLANK} kleinen Stadt.`,
    note: "私たちは小さな町に住んでいる。",
    choices: ["eine", "einem", "einer", "einen"],
    answer: "einer",
    explanation:
      "wohnen（住んでいる）は場所を表すので、in は3格をとります。Stadt は女性名詞で、不定冠詞の女性3格は einer です。「町へ引っ越す」のように方向なら4格の in eine Stadt になります。",
  },
  {
    focus: "blank",
    id: "ind-blank-seiner",
    units: ["indefinite", "verb-case"],
    prompt: `Er hilft ${BLANK} Mutter.`,
    note: "彼は母親を手伝う。",
    choices: ["seine", "seinem", "seinen", "seiner"],
    answer: "seiner",
    explanation:
      "helfen（手伝う）は、日本語の「〜を手伝う」と違って相手を3格でとります。Mutter は女性名詞なので、所有冠詞 sein の女性3格 seiner です。",
  },
  {
    focus: "blank",
    id: "ind-blank-einen",
    units: ["indefinite"],
    prompt: `Hast du ${BLANK} Bleistift für mich?`,
    note: "（私に貸せる）鉛筆を1本持ってる？",
    choices: ["ein", "eine", "einen", "einem"],
    answer: "einen",
    explanation:
      "haben の目的語なので4格で、Bleistift は男性名詞なので einen です。für mich（私のために）の部分は文の目的語ではないので、冠詞の格には関係しません。",
  },
];

// ── 人称代名詞 ──
const pronounQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "pron-meaning-ihm",
    units: ["pronoun", "verb-case"],
    prompt: "Ich helfe ihm.",
    choices: ["彼が私を手伝う。", "私は彼女を手伝う。", "私は彼を手伝う。", "私は彼らを手伝う。"],
    answer: "私は彼を手伝う。",
    explanation:
      "ihm は er（彼）の3格です。helfen は相手を3格でとるので「彼を手伝う」になります。「彼女を」なら ihr、「彼らを」なら ihnen です。",
  },
  {
    focus: "form",
    id: "pron-form-dich",
    units: ["pronoun"],
    prompt: "君のことが好きだ（君を愛している）。",
    choices: ["Ich liebe dir.", "Ich liebe du.", "Ich liebe dich.", "Ich liebe dein."],
    answer: "Ich liebe dich.",
    explanation:
      "lieben の目的語は4格で、du の4格は dich です。dir は3格、dein は「君の」という所有冠詞です。",
  },
  {
    focus: "context",
    id: "pron-context-ihn",
    units: ["pronoun"],
    prompt: `A: Wie findest du den Film?\nB: Ich finde ${BLANK} super!`,
    note: "A「その映画どう思う？」 B「最高だと思う！」",
    choices: ["er", "ihm", "es", "ihn"],
    answer: "ihn",
    explanation:
      "den Film（男性4格）を代名詞にすると ihn です。物でも男性名詞なら er・ihn・ihm で受けます。中性名詞の es と取り違えないようにしましょう。",
  },
  {
    focus: "blank",
    id: "pron-blank-mir",
    units: ["pronoun", "verb-case"],
    prompt: `Kannst du ${BLANK} helfen?`,
    note: "私を手伝ってくれる？",
    choices: ["mich", "ich", "mein", "mir"],
    answer: "mir",
    explanation:
      "helfen は相手を3格でとるので、ich の3格 mir を使います。日本語の「私を手伝う」につられて4格の mich にしないように注意しましょう。",
  },
  {
    focus: "blank",
    id: "pron-blank-ihr",
    units: ["pronoun", "verb-case"],
    prompt: `Das Buch gehört ${BLANK}.`,
    note: "その本は彼女のものだ。",
    choices: ["sie", "ihr", "ihn", "ihnen"],
    answer: "ihr",
    explanation:
      "gehören（〜のものである）は持ち主を3格でとります。sie（彼女）の3格は ihr です。ihnen は sie（彼ら）の3格です。",
  },
  {
    focus: "blank",
    id: "pron-blank-euch",
    units: ["pronoun", "verb-case"],
    prompt: `Ich rufe ${BLANK} morgen an.`,
    note: "明日、君たちに電話するね。",
    choices: ["ihr", "euch", "euer", "ihnen"],
    answer: "euch",
    explanation:
      "anrufen（電話をかける）は、日本語では「〜に」ですが相手を4格でとります。ihr（君たち）の4格は euch です（3格も euch）。",
  },
  {
    focus: "blank",
    id: "pron-blank-sie-akk",
    units: ["pronoun"],
    prompt: `Die Lampe? Ich habe ${BLANK} ins Wohnzimmer gestellt.`,
    note: "ランプ？居間に置いたよ。",
    choices: ["ihr", "es", "sie", "ihn"],
    answer: "sie",
    explanation:
      "die Lampe（女性名詞）を4格の代名詞で受けるので sie です。女性名詞は人でも物でも sie・ihr で受けます。",
  },
  {
    focus: "blank",
    id: "pron-blank-ihnen",
    units: ["pronoun"],
    prompt: `Wie geht es ${BLANK}?`,
    note: "ご機嫌いかがですか？（敬称）",
    choices: ["Sie", "Ihr", "Ihrem", "Ihnen"],
    answer: "Ihnen",
    explanation:
      "Wie geht es + 3格? で「〜の調子はどうですか」です。敬称 Sie の3格は Ihnen（大文字）です。du なら Wie geht es dir? になります。",
  },
];

// ── 再帰代名詞 ──
const reflexiveQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "refl-meaning-freuen-auf",
    units: ["reflexive"],
    prompt: "Ich freue mich auf die Ferien.",
    choices: [
      "休暇が楽しかった。",
      "休暇にうんざりしている。",
      "休暇のことを心配している。",
      "休暇を楽しみにしている。",
    ],
    answer: "休暇を楽しみにしている。",
    explanation:
      "sich freuen auf + 4格 は「（これから来るもの）を楽しみにしている」です。すでに起きたことを「喜ぶ」なら sich freuen über + 4格 を使います（Ich freue mich über das Geschenk.）。",
  },
  {
    focus: "form",
    id: "refl-form-mir-haende",
    units: ["reflexive"],
    prompt: "私は手を洗う。",
    choices: [
      "Ich wasche mich die Hände.",
      "Ich wasche sich die Hände.",
      "Ich wasche mir die Hände.",
      "Ich wasche mir den Hände.",
    ],
    answer: "Ich wasche mir die Hände.",
    explanation:
      "洗う対象（die Hände）が4格の目的語として別にあるので、再帰代名詞は「自分の（体の部分を）」を表す3格の mir になります。体全体を洗うなら Ich wasche mich.（4格）です。sich は3人称と敬称 Sie のときだけの形です。",
  },
  {
    focus: "context",
    id: "refl-context-erkaelten",
    units: ["reflexive"],
    prompt: `A: Wie geht's dir?\nB: Nicht so gut. Ich habe ${BLANK} erkältet.`,
    note: "A「調子はどう？」 B「あまりよくない。風邪をひいちゃった」",
    choices: ["mir", "sich", "mich", "dich"],
    answer: "mich",
    explanation:
      "sich erkälten（風邪をひく）は4格の再帰代名詞をとる動詞で、ich なら mich です。再帰動詞の現在完了はふつう haben と組みます。問いの dir（君に）につられないようにしましょう。",
  },
  {
    focus: "blank",
    id: "refl-blank-sich-setzen",
    units: ["reflexive"],
    prompt: `Er setzt ${BLANK} auf den Stuhl.`,
    note: "彼は椅子に座る。",
    choices: ["ihn", "sich", "ihm", "er"],
    answer: "sich",
    explanation:
      "sich setzen は「自分を座らせる」＝「座る」という再帰動詞です。主語が3人称（er）のときの再帰代名詞は sich です。ihn にすると「（別の）彼を座らせる」という意味になります。",
  },
  {
    focus: "blank",
    id: "refl-blank-uns-treffen",
    units: ["reflexive"],
    prompt: `Wir treffen ${BLANK} um drei Uhr vor dem Bahnhof.`,
    note: "私たちは3時に駅前で会う。",
    choices: ["sich", "euch", "uns", "wir"],
    answer: "uns",
    explanation:
      "sich treffen（会う・待ち合わせる）で、主語 wir の再帰代名詞は uns です。1・2人称の再帰代名詞は人称代名詞と同じ形（mich・dich・uns・euch）で、sich になるのは3人称と敬称 Sie だけです。",
  },
  {
    focus: "blank",
    id: "refl-blank-interessieren",
    units: ["reflexive"],
    prompt: `Interessierst du ${BLANK} für Musik?`,
    note: "君は音楽に興味がある？",
    choices: ["dir", "sich", "du", "dich"],
    answer: "dich",
    explanation:
      "sich interessieren für + 4格 で「〜に興味がある」です。再帰代名詞は4格で、du なら dich です。dir は3格の形です。",
  },
  {
    focus: "meaning",
    id: "refl-meaning-vorstellen",
    units: ["reflexive"],
    prompt: "Kannst du dir das vorstellen?",
    choices: [
      "自己紹介してくれる？",
      "それを私に紹介してくれる？",
      "そんなこと想像できる？",
      "それを準備してくれる？",
    ],
    answer: "そんなこと想像できる？",
    explanation:
      "sich（3格）etwas vorstellen は「〜を想像する」です。再帰代名詞が4格の sich vorstellen なら「自己紹介する」（Darf ich mich vorstellen?）になり、格で意味が変わります。",
  },
  {
    focus: "blank",
    id: "refl-blank-zaehne",
    units: ["reflexive"],
    prompt: `Ich putze ${BLANK} die Zähne.`,
    note: "私は歯を磨く。",
    choices: ["mich", "sich", "mein", "mir"],
    answer: "mir",
    explanation:
      "磨く対象（die Zähne）が4格の目的語として別にあるので、再帰代名詞は「自分の（歯を）」を表す3格の mir です。",
  },
];

// ── 動詞の格支配 ──
const verbCaseQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "vc-meaning-gefallen",
    units: ["verb-case"],
    prompt: "Der Mantel gefällt mir.",
    choices: [
      "そのコートは私のものだ。",
      "私はそのコートを買った。",
      "私はそのコートが気に入っている。",
      "そのコートは私に似合わない。",
    ],
    answer: "私はそのコートが気に入っている。",
    explanation:
      "gefallen は「（1格のものが）3格の人の気に入る」という動詞で、主語は気に入られるもの（der Mantel）、気に入る人は3格（mir）です。「私のもの」なら Der Mantel gehört mir. です。",
  },
  {
    focus: "form",
    id: "vc-form-danken",
    units: ["verb-case"],
    prompt: "君に感謝している。",
    choices: ["Ich danke dich.", "Ich danke dir.", "Ich danke du.", "Ich danke deiner."],
    answer: "Ich danke dir.",
    explanation:
      "danken（感謝する）は相手を3格でとる動詞です。du の3格は dir です。helfen・gefallen・gehören・gratulieren なども3格をとります。",
  },
  {
    focus: "context",
    id: "vc-context-schenken",
    units: ["verb-case", "pronoun"],
    prompt: `A: Was schenkst du deinem Bruder?\nB: Ich schenke ${BLANK} ein Buch.`,
    note: "A「弟に何をあげるの？」 B「本をあげるよ」",
    choices: ["ihn", "er", "ihm", "sein"],
    answer: "ihm",
    explanation:
      "schenken は「人に（3格）物を（4格）贈る」動詞です。deinem Bruder（男性3格）を代名詞にすると ihm になります。4格の ihn ではありません。",
  },
  {
    focus: "blank",
    id: "vc-blank-fragen",
    units: ["verb-case"],
    prompt: `Ich frage ${BLANK} Lehrer.`,
    note: "私は先生に質問する。",
    choices: ["dem", "der", "den", "des"],
    answer: "den",
    explanation:
      "fragen（質問する）は、日本語では「先生に」ですが、尋ねる相手を4格でとります。男性4格の定冠詞は den です。",
  },
  {
    focus: "blank",
    id: "vc-blank-schmecken",
    units: ["verb-case"],
    prompt: `Das Essen schmeckt ${BLANK} Gästen.`,
    note: "料理はお客さんたちの口に合っている。",
    choices: ["die", "der", "den", "dem"],
    answer: "den",
    explanation:
      "schmecken（〜の口に合う）は味わう人を3格でとります。複数の3格の定冠詞は den で、名詞にも -n が付きます（Gästen）。",
  },
  {
    focus: "blank",
    id: "vc-blank-gratulieren",
    units: ["verb-case", "pronoun"],
    prompt: `Wir gratulieren ${BLANK} zum Geburtstag.`,
    note: "（私たちから君に）誕生日おめでとう。",
    choices: ["dich", "du", "dein", "dir"],
    answer: "dir",
    explanation:
      "gratulieren（祝う）は相手を3格でとるので、du の3格 dir を使います。「〜のお祝いに」は zu + 3格（zum Geburtstag）です。",
  },
];

// ── 前置詞の格支配 ──
const prepositionQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "prep-meaning-in-akk",
    units: ["preposition"],
    prompt: "Er geht in die Schule.",
    choices: [
      "彼は学校にいる。",
      "彼は学校から帰ってくる。",
      "彼は学校へ行く（学校に通う）。",
      "彼は学校の前を通る。",
    ],
    answer: "彼は学校へ行く（学校に通う）。",
    explanation:
      "in・an・auf などは、移動の方向（〜へ）を表すときは4格、場所（〜で・〜に）を表すときは3格をとります。in die Schule は4格なので「学校へ」です。「学校にいる」なら Er ist in der Schule.（3格）になります。",
  },
  {
    focus: "form",
    id: "prep-form-fuer",
    units: ["preposition"],
    prompt: "私は君のためにケーキを焼いた。",
    choices: [
      "Ich habe für dir einen Kuchen gebacken.",
      "Ich habe für du einen Kuchen gebacken.",
      "Ich habe mit dich einen Kuchen gebacken.",
      "Ich habe für dich einen Kuchen gebacken.",
    ],
    answer: "Ich habe für dich einen Kuchen gebacken.",
    explanation:
      "für（〜のために）はいつも4格をとるので、du の4格 dich を使います。dir は3格です。für のほか durch・gegen・ohne・um も4格支配です。",
  },
  {
    focus: "context",
    id: "prep-context-auf-dat",
    units: ["preposition"],
    prompt: `A: Wo ist meine Brille?\nB: Sie liegt auf ${BLANK} Tisch.`,
    note: "A「私のめがね、どこ？」 B「机の上にあるよ」",
    choices: ["den", "der", "dem", "das"],
    answer: "dem",
    explanation:
      "wo（どこに）と聞かれ、liegen（置いてある）で場所を答えているので、auf は3格をとります。Tisch は男性名詞なので auf dem Tisch です。「机の上へ置く」なら方向なので Ich lege sie auf den Tisch.（4格）です。",
  },
  {
    focus: "blank",
    id: "prep-blank-an-akk",
    units: ["preposition"],
    prompt: `Ich hänge das Bild an ${BLANK} Wand.`,
    note: "私は絵を壁に掛ける。",
    choices: ["die", "der", "dem", "den"],
    answer: "die",
    explanation:
      "hängen（掛ける）は物を移動させる動作なので、an は方向の4格をとります。Wand は女性名詞なので4格は die です。掛かっている状態なら Das Bild hängt an der Wand.（3格）です。",
  },
  {
    focus: "blank",
    id: "prep-blank-nach-dem",
    units: ["preposition"],
    prompt: `Nach ${BLANK} Essen gehen wir spazieren.`,
    note: "食事の後で、私たちは散歩に行く。",
    choices: ["das", "den", "dem", "des"],
    answer: "dem",
    explanation:
      "nach（〜の後で・〜へ）はいつも3格をとります。das Essen は中性名詞なので3格の定冠詞は dem です。文頭に Nach dem Essen を置いたので、定動詞 gehen が2番目に来ています。",
  },
  {
    focus: "blank",
    id: "prep-blank-durch-den",
    units: ["preposition"],
    prompt: `Wir gehen durch ${BLANK} Park.`,
    note: "私たちは公園を通り抜ける。",
    choices: ["dem", "der", "den", "des"],
    answer: "den",
    explanation:
      "durch（〜を通って）はいつも4格をとります。Park は男性名詞なので4格の定冠詞は den です。",
  },
  {
    focus: "blank",
    id: "prep-blank-ohne",
    units: ["preposition", "indefinite"],
    prompt: `Ohne ${BLANK} Hilfe schaffe ich das nicht.`,
    note: "君の助けがなければ、私にはそれはできない。",
    choices: ["dein", "deine", "deiner", "deinem"],
    answer: "deine",
    explanation:
      "ohne（〜なしで）はいつも4格をとります。Hilfe は女性名詞なので、所有冠詞 dein の女性4格 deine です。",
  },
  {
    focus: "blank",
    id: "prep-blank-seit",
    units: ["preposition", "indefinite"],
    prompt: `Seit ${BLANK} Jahr lerne ich Deutsch.`,
    note: "1年前からドイツ語を勉強している。",
    choices: ["ein", "einen", "einem", "eines"],
    answer: "einem",
    explanation:
      "seit（〜前から・〜以来）はいつも3格をとります。Jahr は中性名詞なので、不定冠詞の中性3格 einem です。",
  },
];

// ── 形容詞の語尾 ──
const adjectiveQuestions: GrammarQuestion[] = [
  {
    focus: "form",
    id: "adj-form-neues",
    units: ["adjective"],
    prompt: "私は新しい車を買った。",
    choices: [
      "Ich habe ein neue Auto gekauft.",
      "Ich habe ein neuer Auto gekauft.",
      "Ich habe ein neues Auto gekauft.",
      "Ich habe ein neuen Auto gekauft.",
    ],
    answer: "Ich habe ein neues Auto gekauft.",
    explanation:
      "不定冠詞の後の形容詞は、冠詞が性を示さないときに自分で性を示す語尾を付けます。中性の ein（1格・4格）には語尾がないので、形容詞が -es を付けて neues になります。",
  },
  {
    focus: "form",
    id: "adj-form-kleine",
    units: ["adjective"],
    prompt: "その小さな子どもが泣いている。",
    choices: [
      "Das kleines Kind weint.",
      "Das kleine Kind weint.",
      "Das kleinen Kind weint.",
      "Das klein Kind weint.",
    ],
    answer: "Das kleine Kind weint.",
    explanation:
      "定冠詞の後の形容詞は、冠詞がすでに格・性を示しているので弱い語尾（-e か -en）になります。中性1格の das の後は -e で kleine です。名詞の前に置く形容詞には必ず語尾が付きます。",
  },
  {
    focus: "context",
    id: "adj-context-starken",
    units: ["adjective"],
    prompt: `A: Was trinkst du gern?\nB: Ich trinke gern ${BLANK} Kaffee.`,
    note: "A「何を飲むのが好き？」 B「濃いコーヒーが好き」",
    choices: ["stark", "starke", "starker", "starken"],
    answer: "starken",
    explanation:
      "冠詞がないときは、形容詞が定冠詞と同じような語尾（強変化）を付けます。Kaffee は男性名詞で trinken の4格の目的語なので、den と同じ -en を付けて starken です。",
  },
  {
    focus: "blank",
    id: "adj-blank-guter",
    units: ["adjective"],
    prompt: `Das ist ein ${BLANK} Film.`,
    note: "これはいい映画だ。",
    choices: ["guten", "gute", "gutes", "guter"],
    answer: "guter",
    explanation:
      "男性1格の ein には語尾がなく性がわからないので、形容詞が der と同じ -er を付けて guter になります。定冠詞なら der gute Film です。",
  },
  {
    focus: "blank",
    id: "adj-blank-grossen",
    units: ["adjective", "preposition"],
    prompt: `Ich wohne in einem ${BLANK} Haus.`,
    note: "私は大きな家に住んでいる。",
    choices: ["großen", "große", "großes", "großem"],
    answer: "großen",
    explanation:
      "in（場所）+ 3格で、einem は中性3格です。冠詞が格を示しているので、形容詞は弱い語尾の -en になります。",
  },
  {
    focus: "blank",
    id: "adj-blank-alte",
    units: ["adjective"],
    prompt: `Der ${BLANK} Mann ist mein Onkel.`,
    note: "その年配の男性は私のおじだ。",
    choices: ["alten", "alter", "alte", "altes"],
    answer: "alte",
    explanation:
      "定冠詞 der（男性1格）の後の形容詞は -e です。定冠詞の後で -e になるのは、男性1格と、女性・中性の1格・4格だけで、それ以外は -en です。",
  },
  {
    focus: "blank",
    id: "adj-blank-rote",
    units: ["adjective"],
    prompt: `Sie trägt eine ${BLANK} Jacke.`,
    note: "彼女は赤い上着を着ている。",
    choices: ["rote", "rot", "roten", "roter"],
    answer: "rote",
    explanation:
      "女性4格の eine の後の形容詞は -e です。女性名詞では1格と4格が同じ形（eine rote Jacke）になります。",
  },
  {
    focus: "blank",
    id: "adj-blank-guten-pl",
    units: ["adjective", "preposition"],
    prompt: `Mit ${BLANK} Freunden fahre ich nach Berlin.`,
    note: "良い友人たちと一緒にベルリンへ行く。",
    choices: ["gute", "guter", "gutem", "guten"],
    answer: "guten",
    explanation:
      "mit は3格支配で、冠詞のない複数3格です。冠詞がないときは形容詞が定冠詞（複数3格 den）と同じ語尾を付けるので、guten になります。",
  },
];

export const grammarQuiz: GrammarQuestion[] = [
  ...definiteQuestions,
  ...indefiniteQuestions,
  ...pronounQuestions,
  ...reflexiveQuestions,
  ...verbCaseQuestions,
  ...prepositionQuestions,
  ...adjectiveQuestions,
];
