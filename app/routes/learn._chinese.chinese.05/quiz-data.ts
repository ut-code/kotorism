import {
  BLANK,
  type GrammarQuestion as Question,
  type GrammarUnitDef,
} from "@/lib/shared/learn/grammar-quiz";

// 出題の単元
export const grammarUnits = [
  { id: "aux-verb", label: "助動詞の否定", sub: "不想・不用・不会…" },
  { id: "negation", label: "否定表現", sub: "不・没・别" },
  { id: "aspect", label: "時相・アスペクト", sub: "了・着・过" },
  { id: "possibility", label: "可能表現", sub: "能・会・可以" },
  { id: "complement", label: "方向補語・結果補語", sub: "上来・完・懂…" },
  { id: "preposition", label: "介詞", sub: "在・对・给…" },
  { id: "measure-word", label: "量詞", sub: "个・本・张・条…" },
  { id: "comparison", label: "比較", sub: "比・没有・一样" },
] as const satisfies readonly GrammarUnitDef[];

type GrammarQuestion = Question<(typeof grammarUnits)[number]["id"]>;

// 文法クイズの出題データ。問題は単元ごとにまとめ、units に単元タグ（grammarUnits の id）を付ける。
// 複数の単元にまたがる問題は、タグを複数付ければどちらの単元を選んでも出題される

// ── 助動詞の否定 ──
// 誤答の選択肢は、学習者が実際に取り違えやすい別の助動詞の否定（不想・不用・不要・不会・不能・不可以・没能）
// から作る。どの選択肢も文法的には自然な文・訳にして、意味の違いで選ばせる
const auxVerbQuestions: GrammarQuestion[] = [
  // ── 意味: 中国語文を見て、意味に合う日本語訳を選ぶ ──
  {
    focus: "meaning",
    id: "meaning-buyong",
    units: ["aux-verb"],
    prompt: "今天不用做作业。",
    choices: [
      "今日は宿題をしてはいけない。",
      "今日は宿題をしなくてもいい。",
      "今日は宿題をするはずがない。",
      "今日は宿題をしたくない。",
    ],
    answer: "今日は宿題をしなくてもいい。",
    explanation:
      "「得(děi)／要」（〜しなければならない）の否定は「不得」ではなく「不用」で、「〜する必要がない」という意味です。「してはいけない」は「不能／不可以」、「するはずがない」は「不会」、「したくない」は「不想」の意味です。",
  },
  {
    focus: "meaning",
    id: "meaning-buyao",
    units: ["aux-verb"],
    prompt: "你不要去。",
    choices: [
      "あなたは行かなくてもいい。",
      "あなたは行くことができない。",
      "行かないで。（行くな）",
      "あなたは行きたくない。",
    ],
    answer: "行かないで。（行くな）",
    explanation:
      "「要」（〜したい・〜しなければならない）の否定「不要」は、二人称と組むと「〜するな」という禁止になります。「行かなくてもいい」は「不用」です。主語が自分の「我不要去」は「絶対に行きたくない」という強い拒絶になり、やんわり断るなら「我不想去」が自然です。",
  },
  {
    focus: "meaning",
    id: "meaning-buhui-likely",
    units: ["aux-verb"],
    prompt: "他今天不会来的。",
    choices: [
      "彼は今日、来ないだろう。",
      "彼は今日、来られない（用事があって）。",
      "彼は今日、来なくてもいい。",
      "彼は今日、来たがらない。",
    ],
    answer: "彼は今日、来ないだろう。",
    explanation:
      "「会」には「（習得して）できる」のほかに「〜するはずだ・〜だろう」という可能性・推測の意味があり、文末の「的」と一緒によく使われます。「不会…的」は「〜するはずがない・〜しないだろう」。用事があって来られないなら「不能来」です。",
  },
  {
    focus: "meaning",
    id: "meaning-buhui-skill",
    units: ["aux-verb", "possibility"],
    prompt: "我不会游泳。",
    choices: [
      "私は泳いではいけない。",
      "私は（今日は体調が悪くて）泳げない。",
      "私は泳ぎたくない。",
      "私は泳げない。（泳ぎ方を知らない）",
    ],
    answer: "私は泳げない。（泳ぎ方を知らない）",
    explanation:
      "「会」は習って身につけた技能を表すので、「不会」は「（習っていないので）できない」。体調や状況のせいでできないなら「不能」、許可されていないなら「不可以／不能」を使います。",
  },
  {
    focus: "meaning",
    id: "meaning-bukeyi",
    units: ["aux-verb", "possibility"],
    prompt: "这里不可以抽烟。",
    choices: [
      "ここではタバコを吸わなくてもいい。",
      "ここではタバコを吸ってはいけない。",
      "ここではタバコを吸うはずがない。",
      "ここではタバコを吸いたくない。",
    ],
    answer: "ここではタバコを吸ってはいけない。",
    explanation:
      "「可以」（〜してよい）の否定「不可以」は「〜してはいけない」という不許可・禁止です。同じ意味で「不能」も使えます。「吸わなくてもいい」は「不用」です。",
  },

  // ── 形: 日本語の意味に合う中国語を選ぶ（形の取り違えに注意） ──
  {
    focus: "form",
    id: "form-buyong",
    units: ["aux-verb"],
    prompt: "明日は来なくてもいいですよ。",
    choices: ["你明天不得来。", "你明天不要来。", "你明天不用来。", "你明天没用来。"],
    answer: "你明天不用来。",
    explanation:
      "「〜しなくてもいい」は「不用」。「得(děi)」の否定を「不得」とするのはよくある間違いです（「不得(bùdé)」は書き言葉で「〜してはならない」）。「不要来」は「来るな」になり、「没」は助動詞「用」の否定には使いません。",
  },
  {
    focus: "form",
    id: "form-meineng",
    units: ["aux-verb", "possibility"],
    prompt: "昨日は用事があって行けなかった。",
    choices: [
      "我昨天有事，不能去。",
      "我昨天有事，没能去。",
      "我昨天有事，不会去。",
      "我昨天有事，没会去。",
    ],
    answer: "我昨天有事，没能去。",
    explanation:
      "過去に「（状況的に）できなかった」ことは「没能」で表します。「不能去」は現在・未来の「行けない」。「会」は「没会」の形では使わず、「不会去」は「行くはずがない」の意味になります。",
  },
  {
    focus: "form",
    id: "form-buhui",
    units: ["aux-verb", "possibility"],
    prompt: "彼女はまだ運転を習っていないので、車を運転できない。",
    choices: ["她还不会开车。", "她还不可以开车。", "她还没会开车。", "她还不用开车。"],
    answer: "她还不会开车。",
    explanation:
      "習っていなくてできないのは技能の問題なので「不会」です。「不可以开车」は「運転してはいけない」（許可がない）、「不用开车」は「運転しなくてもいい」。「没会」という形はありません。",
  },
  {
    focus: "form",
    id: "form-bukeyi",
    units: ["aux-verb", "possibility"],
    prompt: "ここに車を停めてはいけません。",
    choices: ["这里不用停车。", "这里不会停车。", "这里没可以停车。", "这里不可以停车。"],
    answer: "这里不可以停车。",
    explanation:
      "不許可・禁止は「不可以」（「不能」でも可）です。「不用停车」は「停めなくてもいい」、「不会停车」は「停めるはずがない」。「可以」を「没」で否定することはしません。",
  },

  // ── 文脈: 会話の流れに合う否定表現を選ぶ ──
  {
    focus: "context",
    id: "context-buneng",
    units: ["aux-verb", "possibility"],
    prompt: `A：明天一起去看电影吧！\nB：对不起，明天我要加班，${BLANK}去。`,
    note: "A「明日一緒に映画を見に行こうよ！」 B「ごめん、明日は残業があって…」",
    choices: ["不会", "不能", "不用", "不要"],
    answer: "不能",
    explanation:
      "残業という「状況」のせいで行けないので「不能」です。「不会」だと「行くはずがない・行き方を知らない」、「不用」は「行かなくていい」、「不要」は「行くな」になり、誘いへの返事として流れに合いません。",
  },
  {
    focus: "context",
    id: "context-buyong",
    units: ["aux-verb"],
    prompt: `A：我帮你拿行李吧。\nB：谢谢，${BLANK}，我自己能拿。`,
    note: "A「荷物を持ってあげるよ」 B「ありがとう、でも…自分で持てるから」",
    choices: ["不能了", "不会了", "不用了", "不可以"],
    answer: "不用了",
    explanation:
      "申し出を「大丈夫、必要ないよ」と断るときの決まった言い方が「不用了」です。後ろの「我自己能拿（自分で持てる）」とも自然につながります。「不可以」だと「してはいけない」と相手を拒む強い言い方になります。",
  },
  {
    focus: "context",
    id: "context-buyao",
    units: ["aux-verb"],
    prompt: `妈妈：太危险了，你${BLANK}碰！`,
    note: "母親が子どもに「危ないから、触っちゃだめ！」と注意する場面",
    choices: ["不用", "不要", "不会", "不想"],
    answer: "不要",
    explanation:
      "相手に「〜するな」と禁止するときは「不要」（または「别」）を使います。「不用碰」は「触らなくていい」となり、危険を注意する流れに合いません。",
  },
  {
    focus: "context",
    id: "context-buhui",
    units: ["aux-verb", "possibility"],
    prompt: `A：你会说法语吗？\nB：${BLANK}，我只会说英语。`,
    note: "A「フランス語は話せる？」 B「…英語しか話せないんだ」",
    choices: ["不能", "不用", "不要", "不会"],
    answer: "不会",
    explanation:
      "「会…吗？」と技能を聞かれたら、答えも「会／不会」で返します。続く「我只会说英语（英語しか話せない）」とも対応しています。",
  },

  // ── 穴埋め: 日本語訳に合う否定表現を選ぶ ──
  {
    focus: "blank",
    id: "blank-buyong",
    units: ["aux-verb"],
    prompt: `今天是星期天，${BLANK}上班。`,
    note: "今日は日曜日なので、出勤しなくてもいい。",
    choices: ["不能", "不用", "不会", "不要"],
    answer: "不用",
    explanation:
      "「〜する必要がない」は「不用」。「得(děi)」の否定が「不得」にならない点がポイントです。「不」は第4声の前で第2声(bú)に変わります。「不能上班」は「出勤できない」、「不会上班」は「出勤するはずがない」、「不要上班」は「出勤するな」になります。",
  },
  {
    focus: "blank",
    id: "blank-buhui",
    units: ["aux-verb", "possibility"],
    prompt: `我${BLANK}游泳，你教我吧。`,
    note: "私は泳げないから、教えてよ。",
    choices: ["不想", "不用", "不能", "不会"],
    answer: "不会",
    explanation:
      "「教えて」と続くので、泳ぎ方を習っていない＝技能がないことがわかります。技能の「できない」は「不会」です。「不想」は「泳ぎたくない」、「不用」は「泳がなくていい」で、「教えて」と続く流れに合いません。「不能」は体調などの事情で泳げないときに使います。",
  },
  {
    focus: "blank",
    id: "blank-buneng",
    units: ["aux-verb", "possibility"],
    prompt: `我感冒了，今天${BLANK}去学校。`,
    note: "風邪をひいたので、今日は学校に行けない。",
    choices: ["不能", "不会", "不用", "不想"],
    answer: "不能",
    explanation:
      "風邪という状況・条件のせいで行けないので「不能」です。行き方を知らないわけではないので「不会」は使いません。「不用去」は「行かなくていい」、「不想去」は「行きたくない」です。",
  },
  {
    focus: "blank",
    id: "blank-buxiang",
    units: ["aux-verb"],
    prompt: `天气太热了，我${BLANK}出去。`,
    note: "暑すぎるから、出かけたくない。",
    choices: ["不会", "不想", "不用", "不能"],
    answer: "不想",
    explanation:
      "願望の「想」を否定した「不想」で「〜したくない」。「不要」にすると強い拒絶や禁止のニュアンスになるので、気持ちを述べるだけなら「不想」が自然です。「不能出去」は「（事情があって）出かけられない」、「不用出去」は「出かけなくていい」です。",
  },
  {
    focus: "blank",
    id: "blank-meineng",
    units: ["aux-verb", "possibility"],
    prompt: `昨天我病了，${BLANK}去上课。`,
    note: "昨日は病気で、授業に行けなかった。",
    choices: ["不能", "没会", "没能", "不会"],
    answer: "没能",
    explanation:
      "過去に状況的にできなかったことは「没能」。「不能」は現在・未来の「できない」を表します。「会」は「没」で打ち消さないので「没会」という形はありません。",
  },
];

// ── 否定表現: 不・没・别の使い分け ──
const negationQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "neg-meaning-mei",
    units: ["negation"],
    prompt: "我昨天没去学校。",
    choices: [
      "昨日は学校に行かなかった。",
      "昨日は学校に行きたくなかった。",
      "昨日は学校に行かなくてよかった。",
      "昨日は学校に行けなかった。",
    ],
    answer: "昨日は学校に行かなかった。",
    explanation:
      "「没（有）」は「（実際に）〜しなかった・まだ〜していない」と、起きたことを打ち消します。「行きたくなかった」は「不想去」、「行かなくてよかった」は「不用去」、（事情があって）「行けなかった」は「没能去」です。",
  },
  {
    focus: "meaning",
    id: "neg-meaning-bu",
    units: ["negation"],
    prompt: "他不喝酒。",
    choices: [
      "彼はお酒を飲まなかった。",
      "彼はお酒を飲まない。（飲む習慣がない）",
      "彼にお酒を飲ませないで。",
      "彼はまだお酒を飲んでいない。",
    ],
    answer: "彼はお酒を飲まない。（飲む習慣がない）",
    explanation:
      "「不」は習慣・意志・これからのことを打ち消し、「（ふだん）〜しない・〜するつもりがない」を表します。「飲まなかった」「まだ飲んでいない」は「没喝」、「飲ませないで」は「别让他喝」です。",
  },
  {
    focus: "form",
    id: "neg-form-bu",
    units: ["negation"],
    prompt: "私はコーヒーを飲みません。（習慣として）",
    choices: ["我不喝咖啡。", "我没喝咖啡。", "我别喝咖啡。", "我不喝了咖啡。"],
    answer: "我不喝咖啡。",
    explanation:
      "習慣として「飲まない」は「不喝」。「没喝」は「（その時）飲まなかった」という出来事の否定です。「别」は相手への禁止に使い、自分を主語にしません。完了の「了」は否定の「不」と一緒には使いません。",
  },
  {
    focus: "form",
    id: "neg-form-mei",
    units: ["negation", "aspect"],
    prompt: "彼はまだ来ていない。",
    choices: ["他还没来了。", "他还没来。", "他还别来。", "他还不来过。"],
    answer: "他还没来。",
    explanation:
      "「まだ〜していない」は「还没（有）＋動詞」。「没」で打ち消すと完了の「了」は消えるので、「没来了」とは言いません。「别」は禁止、「过」は経験を表し、否定は「没来过」の形になります。",
  },
  {
    focus: "context",
    id: "neg-context-bie",
    units: ["negation"],
    prompt: `妈妈：外面在下雨，${BLANK}忘了带伞！`,
    note: "母親「外は雨が降ってるから、傘を持っていくのを忘れないでね！」",
    choices: ["没", "不", "别", "没有"],
    answer: "别",
    explanation:
      "相手に「〜しないで」と頼む・禁止するときは「别」（＝不要）。「别忘了〜」（〜を忘れないで）は決まった言い方です。「没（有）忘」は「忘れなかった」、「不忘」は書き言葉的で、注意を促す流れに合いません。",
  },
  {
    focus: "blank",
    id: "neg-blank-mei",
    units: ["negation"],
    prompt: `我昨天${BLANK}去超市。`,
    note: "昨日はスーパーに行かなかった。",
    choices: ["不", "别", "不要", "没"],
    answer: "没",
    explanation:
      "過去に「〜しなかった」という出来事の否定なので「没（有）」です。「不去」は「行かない（つもりだ）」と意志や習慣を表します。「别／不要」は「〜しないで」という禁止です。",
  },
  {
    focus: "blank",
    id: "neg-blank-bu",
    units: ["negation"],
    prompt: `我${BLANK}喜欢吃辣的。`,
    note: "私は辛いものが好きではない。",
    choices: ["没", "不", "别", "没有"],
    answer: "不",
    explanation:
      "「喜欢」（好きだ）のような気持ち・状態を表す動詞は「不」で打ち消します。「没喜欢」とは言いません。「别」は相手への禁止で、自分を主語にしては使いません。",
  },
  {
    focus: "blank",
    id: "neg-blank-bie",
    units: ["negation"],
    prompt: `这件事很重要，你${BLANK}告诉别人。`,
    note: "これは大事なことだから、ほかの人に言わないで。",
    choices: ["没", "不", "别", "没有"],
    answer: "别",
    explanation:
      "相手に「〜しないで」と禁止するときは「别」。同じ意味で「不要」も使えます。「不告诉」だと「（私は）言わない」という意志になります。「没（有）告诉」は「言わなかった」と、過去の出来事の否定になります。",
  },
];

// ── 時相・アスペクト: 了（完了）・着（持続）・过（経験） ──
const aspectQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "aspect-meaning-guo",
    units: ["aspect"],
    prompt: "我去过上海。",
    choices: [
      "これから上海に行く。",
      "上海に行っている最中だ。",
      "上海に行ったことがある。",
      "上海には行かなかった。",
    ],
    answer: "上海に行ったことがある。",
    explanation:
      "動詞＋「过」は「〜したことがある」という経験を表します。否定は「没去过」（行ったことがない）です。",
  },
  {
    focus: "meaning",
    id: "aspect-meaning-zhe",
    units: ["aspect"],
    prompt: "门开着。",
    choices: [
      "ドアが開いた。",
      "ドアが開いている。",
      "ドアを開けたことがある。",
      "ドアを開けるつもりだ。",
    ],
    answer: "ドアが開いている。",
    explanation:
      "動詞＋「着」は、動作の結果の状態が続いていること（〜している・〜してある）を表します。「ドアが開いた」という変化は「门开了」、経験は「开过」です。",
  },
  {
    focus: "form",
    id: "aspect-form-le",
    units: ["aspect"],
    prompt: "昨日、本を2冊買った。",
    choices: [
      "我昨天买着两本书。",
      "我昨天了买两本书。",
      "我昨天没买了两本书。",
      "我昨天买了两本书。",
    ],
    answer: "我昨天买了两本书。",
    explanation:
      "動作の完了は「動詞＋了＋数量＋目的語」の語順で表します。「了」は動詞のすぐ後ろに置きます。「着」は持続なので完了には使えず、「没」で打ち消すと「了」は付けません。",
  },
  {
    focus: "form",
    id: "aspect-form-zhe",
    units: ["aspect"],
    prompt: "彼は座って新聞を読んでいる。",
    choices: ["他坐了看报纸。", "他坐过看报纸。", "他坐着看报纸。", "他看报纸着坐。"],
    answer: "他坐着看报纸。",
    explanation:
      "「動詞1＋着＋動詞2」で「〜した状態で…する」と、2つ目の動作のしかたを表します。「坐着看」は「座って読む」です。",
  },
  {
    focus: "context",
    id: "aspect-context-guo",
    units: ["aspect"],
    prompt: `A：你去${BLANK}中国吗？\nB：去过两次，第一次是三年前。`,
    note: "A「中国に行ったことある？」 B「2回あるよ。最初は3年前」",
    choices: ["着", "过", "在", "得"],
    answer: "过",
    explanation:
      "経験をたずねるので「去过…吗？」です。Bも「去过两次」と、経験の「过」で答えています。「着」は持続、「在」は進行（動詞の前に置く）、「得」は様態補語を導く語です。",
  },
  {
    focus: "blank",
    id: "aspect-blank-zhe",
    units: ["aspect"],
    prompt: `你看，外面下${BLANK}雪呢。`,
    note: "見て、外は雪が降っているよ。",
    choices: ["了", "过", "在", "着"],
    answer: "着",
    explanation:
      "「動詞＋着…呢」で、今まさにその状態が続いていることを表します。「下着雪呢」は「雪が降っている（降り続いている）」です。「过」は経験、「了」は完了を表し、「〜している」最中の様子には使いません。「在」は動詞の前に置いて進行を表します（「正在下雪」）。",
  },
  {
    focus: "blank",
    id: "aspect-blank-guo",
    units: ["aspect", "negation"],
    prompt: `我从来没吃${BLANK}北京烤鸭。`,
    note: "北京ダックを一度も食べたことがない。",
    choices: ["了", "过", "着", "在"],
    answer: "过",
    explanation:
      "経験の否定は「没＋動詞＋过」。「从来」（これまで）と一緒に使うと「一度も〜したことがない」になります。「没」で打ち消すときも「过」は残る点が「了」と違います。「没」で打ち消すと「了」は消えるので「没吃了」とは言いません。",
  },
  {
    focus: "blank",
    id: "aspect-blank-le",
    units: ["aspect"],
    prompt: `昨天我买${BLANK}三本词典。`,
    note: "昨日、辞書を3冊買った。",
    choices: ["着", "在", "了", "得"],
    answer: "了",
    explanation:
      "「買った」という動作の完了は、動詞のすぐ後ろに「了」を付けます。数量（三本）の付いた目的語の前に置くのが基本の形です。「着」は持続、「在」は動詞の前に置く進行、「得」は様態補語を導く語です。",
  },
];

// ── 可能表現: 会（習得した技能）・能（能力・条件）・可以（許可） ──
// 否定形での使い分けは「助動詞の否定」の問題にも可能表現のタグを付けて出題する
const possibilityQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "poss-meaning-hui",
    units: ["possibility"],
    prompt: "我会说一点儿汉语。",
    choices: [
      "中国語を少し話してもいい。",
      "中国語を少し話さなければならない。",
      "中国語を少し話すつもりだ。",
      "中国語が少し話せる。",
    ],
    answer: "中国語が少し話せる。",
    explanation:
      "「会」は、習って身につけた技能があること（〜できる）を表します。「話してもいい」は「可以说」、「話さなければならない」は「得说」、「話すつもりだ」は「要说／打算说」です。",
  },
  {
    focus: "meaning",
    id: "poss-meaning-keyi",
    units: ["possibility"],
    prompt: "我可以坐这儿吗？",
    choices: [
      "ここに座ってもいいですか。",
      "ここに座らなければなりませんか。",
      "ここに座りたいですか。",
      "ここに座るはずですか。",
    ],
    answer: "ここに座ってもいいですか。",
    explanation:
      "「可以…吗？」は「〜してもいいですか」と許可を求める言い方です。答えは「可以」（どうぞ）か「不行／不可以」（だめです）になります。",
  },
  {
    focus: "form",
    id: "poss-form-neng",
    units: ["possibility"],
    prompt: "彼は一度に5キロ泳げる。",
    choices: [
      "他一次会游五公里。",
      "他一次想游五公里。",
      "他一次能游五公里。",
      "他一次要游五公里。",
    ],
    answer: "他一次能游五公里。",
    explanation:
      "泳げるかどうか（技能の有無）は「会」ですが、「5キロ泳げる」のように能力の程度を言うときは「能」を使います。「想」は「〜したい」、「要」は「〜するつもりだ」です。",
  },
  {
    focus: "context",
    id: "poss-context-keyi",
    units: ["possibility"],
    prompt: `A：我${BLANK}用一下你的电脑吗？\nB：可以，你用吧。`,
    note: "A「パソコンをちょっと使ってもいい？」 B「いいよ、どうぞ」",
    choices: ["会", "可以", "想", "要"],
    answer: "可以",
    explanation:
      "許可を求めるので「可以…吗？」です。Bも「可以」で答えています。「会」は技能や可能性、「想」は願望、「要」は意志を表し、許可を求める流れに合いません。",
  },
  {
    focus: "blank",
    id: "poss-blank-hui",
    units: ["possibility"],
    prompt: `A：你${BLANK}说日语吗？　B：会一点儿。`,
    note: "A「日本語は話せますか？」 B「少しだけ」",
    choices: ["能", "可以", "要", "会"],
    answer: "会",
    explanation:
      "語学のように習って身につける技能は「会」でたずねます。Bも「会一点儿」（少しできる）と「会」で答えています。「能」「可以」でもたずねられますが、Bが「会一点儿」と答えているので、技能をたずねる「会」が流れに合います。",
  },
  {
    focus: "blank",
    id: "poss-blank-keyi",
    units: ["possibility"],
    prompt: `这儿${BLANK}拍照吗？`,
    note: "ここで写真を撮ってもいいですか。",
    choices: ["会", "可以", "想", "要"],
    answer: "可以",
    explanation:
      "「〜してもいいか」と許可をたずねるので「可以」。許可の意味では「能」も使えます。「会」は許可には使いません。「会」は技能や可能性、「想」は願望、「要」は意志を表します。許可の意味では「能」も使えます。",
  },
];

// ── 方向補語・結果補語 ──
const complementQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "comp-meaning-dong",
    units: ["complement"],
    prompt: "我听懂了老师的话。",
    choices: [
      "先生の話を聞き終わった。",
      "先生の話を聞き間違えた。",
      "先生の話を聞いて理解できた。",
      "先生の話を聞いたことがある。",
    ],
    answer: "先生の話を聞いて理解できた。",
    explanation:
      "結果補語「懂」は「（〜して）わかる」。「听懂」は聞いて理解できたことを表します。「聞き終わった」は「听完」、「聞き間違えた」は「听错」、「聞いたことがある」は「听过」です。",
  },
  {
    focus: "meaning",
    id: "comp-meaning-jinlai",
    units: ["complement"],
    prompt: "他跑进教室来了。",
    choices: [
      "彼は教室に走って入ってきた。",
      "彼は教室に走って入っていった。",
      "彼は教室から走って出てきた。",
      "彼は教室の前まで走ってきた。",
    ],
    answer: "彼は教室に走って入ってきた。",
    explanation:
      "「動詞＋进＋場所＋来」で「〜して（場所に）入ってくる」。「来」は話し手に近づく方向、「去」は離れる方向を表すので、「入っていった」は「跑进教室去了」、「出てきた」は「跑出教室来了」です。",
  },
  {
    focus: "form",
    id: "comp-form-wan",
    units: ["complement"],
    prompt: "宿題をやり終えた。",
    choices: ["我做懂作业了。", "我完做作业了。", "我做作业完了。", "我做完作业了。"],
    answer: "我做完作业了。",
    explanation:
      "「〜し終える」は結果補語「完」を動詞のすぐ後ろに付けて「做完」。目的語は補語の後ろに置きます。「懂」は「わかる」という結果なので「做」とは組みません。",
  },
  {
    focus: "form",
    id: "comp-form-shangqu",
    units: ["complement"],
    prompt: "彼は（話し手のいる1階から）階段を上がっていった。",
    choices: ["他走上楼来了。", "他走上楼去了。", "他走下楼去了。", "他上去走楼了。"],
    answer: "他走上楼去了。",
    explanation:
      "話し手から離れて上がっていくので「上…去」。場所を表す目的語（楼）は「上」と「去」の間に置きます。「走上楼来」は話し手のいる上の階へ上がってくる、「走下楼去」は下りていくの意味です。",
  },
  {
    focus: "context",
    id: "comp-context-dao",
    units: ["complement"],
    prompt: `A：你的钥匙找${BLANK}了吗？\nB：找到了，在桌子上。`,
    note: "A「鍵は見つかった？」 B「見つかったよ、机の上にあった」",
    choices: ["完", "到", "懂", "错"],
    answer: "到",
    explanation:
      "「找到」は「探して見つかる」。結果補語「到」は動作が目的に達したことを表します。「找完」は「探し終わる」（見つかったとは限らない）、「找错」は「探し間違える」です。",
  },
  {
    focus: "blank",
    id: "comp-blank-cuo",
    units: ["complement"],
    prompt: `这个字我写${BLANK}了，应该是"已"，不是"己"。`,
    note: "この字は書き間違えた。「己」じゃなくて「已」だ。",
    choices: ["完", "懂", "错", "到"],
    answer: "错",
    explanation:
      "結果補語「错」は「〜し間違える」。「写错」は書き間違える、「听错」は聞き間違える、「看错」は見間違えるです。「写完」は「書き終わる」、「写到」は「（ある所まで）書く」で、「已」と「己」を取り違えた流れに合いません。",
  },
  {
    focus: "blank",
    id: "comp-blank-jin",
    units: ["complement"],
    prompt: `老师走${BLANK}教室来了。`,
    note: "先生が教室に（歩いて）入ってきた。",
    choices: ["出", "进", "上", "下"],
    answer: "进",
    explanation:
      "「入る」方向は「进」。「走进教室来」のように、場所は「进」と「来／去」の間に置きます。「走出教室来」は「教室から出てきた」、「走上／走下」は「上がる／下りる」です。",
  },
  {
    focus: "blank",
    id: "comp-blank-dong",
    units: ["complement", "negation"],
    prompt: `你说得太快了，我没听${BLANK}。`,
    note: "話すのが速すぎて、（聞いても）意味がわからなかった。",
    choices: ["到", "完", "懂", "错"],
    answer: "懂",
    explanation:
      "「聞いてわかる」は「听懂」（または「听明白」）。結果補語の付いた動詞は「没」で打ち消し、「没听懂」で「聞いてもわからなかった」になります。「没听到」は「聞こえなかった」、「没听完」は「聞き終わらなかった」です。",
  },
];

// ── 介詞: 在・对・给・跟・从 など ──
const prepositionQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "prep-meaning-cong",
    units: ["preposition"],
    prompt: "我从明天开始学习汉语。",
    choices: [
      "明日まで中国語を勉強する。",
      "明日から中国語を勉強し始める。",
      "明日のために中国語を勉強する。",
      "明日、中国語の勉強を終える。",
    ],
    answer: "明日から中国語を勉強し始める。",
    explanation:
      "「从」は時間や場所の起点（〜から）を表し、「从…开始」で「〜から始める」です。「明日まで」は「到明天」、「明日のために」は「为了明天」です。",
  },
  {
    focus: "form",
    id: "prep-form-zai",
    units: ["preposition"],
    prompt: "私は図書館で勉強する。",
    choices: ["我学习在图书馆。", "我图书馆在学习。", "我在图书馆学习。", "我在学习图书馆。"],
    answer: "我在图书馆学习。",
    explanation:
      "介詞句（在＋場所）は動詞の前に置きます。英語のように「学习在图书馆」と動詞の後ろに置くのはよくある間違いです。",
  },
  {
    focus: "form",
    id: "prep-form-gei",
    units: ["preposition"],
    prompt: "彼は私に手紙を1通書いてくれた。",
    choices: [
      "他对我写了一封信。",
      "他给我写了一封信。",
      "他在我写了一封信。",
      "他写了给我一封信。",
    ],
    answer: "他给我写了一封信。",
    explanation:
      "動作の受け手（〜に）は「给」で示し、「给＋人＋動詞」の語順にします。「对」は「〜に対して」と態度や向き合う相手を表し、手紙を書く相手には使いません。",
  },
  {
    focus: "context",
    id: "prep-context-gen",
    units: ["preposition"],
    prompt: `A：你${BLANK}谁学汉语？\nB：跟王老师学。`,
    note: "A「誰に中国語を習ってるの？」 B「王先生に習ってるよ」",
    choices: ["对", "给", "跟", "在"],
    answer: "跟",
    explanation:
      "「跟＋人＋学」で「（人）について習う」。Bも「跟王老师学」と答えています。「给」は受け手、「对」は対象、「在」は場所を表します。",
  },
  {
    focus: "context",
    id: "prep-context-zai",
    units: ["preposition"],
    prompt: `A：这个周末你有什么打算？\nB：我想${BLANK}家里休息。`,
    note: "A「今週末は何をする予定？」 B「家でゆっくりしたいな」",
    choices: ["对", "在", "给", "从"],
    answer: "在",
    explanation:
      "動作をする場所（〜で）は「在＋場所＋動詞」。「从」は起点（〜から）、「给」は受け手、「对」は対象を表します。",
  },
  {
    focus: "blank",
    id: "prep-blank-gei",
    units: ["preposition"],
    prompt: `我${BLANK}朋友买了一本书。`,
    note: "友達に本を1冊買ってあげた。",
    choices: ["对", "给", "从", "在"],
    answer: "给",
    explanation:
      "「（人）に〜してあげる」は「给＋人＋動詞」。「为」（〜のために）も使えます。「为」（〜のために）でも言えます。「对」は態度の対象、「从」は起点、「在」は場所です。",
  },
  {
    focus: "blank",
    id: "prep-blank-dui",
    units: ["preposition"],
    prompt: `运动${BLANK}身体很好。`,
    note: "運動は体にとてもいい。",
    choices: ["给", "跟", "对", "在"],
    answer: "对",
    explanation:
      "「对…好／有好处」で「〜にとってよい」。「对」は影響や態度が向かう対象を表します。「给」は受け手、「跟」は一緒にする相手、「在」は場所を表します。",
  },
  {
    focus: "blank",
    id: "prep-blank-cong",
    units: ["preposition"],
    prompt: `我${BLANK}家到学校要走二十分钟。`,
    note: "家から学校まで歩いて20分かかる。",
    choices: ["在", "对", "给", "从"],
    answer: "从",
    explanation:
      "「从A到B」で「AからBまで」。距離や時間の範囲を表す決まった形です。「到」とセットになるのは起点の「从」です。",
  },
];

// ── 量詞 ──
const measureWordQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "mw-meaning-zhang",
    units: ["measure-word"],
    prompt: "我买了两张票。",
    choices: [
      "チケットを2回買った。",
      "チケットを2枚買いたい。",
      "チケットを2枚買った。",
      "2人分のチケットを買う。",
    ],
    answer: "チケットを2枚買った。",
    explanation:
      "「张」はチケット・紙・机など平らなものを数える量詞です。「了」があるので買ったことを表します。回数の「2回」なら「买了两次票」と動量詞「次」を使います。",
  },
  {
    focus: "form",
    id: "mw-form-liangge",
    units: ["measure-word"],
    prompt: "私には兄が2人いる。",
    choices: ["我有二个哥哥。", "我有两哥哥。", "我有两个哥哥。", "我有两本哥哥。"],
    answer: "我有两个哥哥。",
    explanation:
      "数と名詞の間には量詞が必要で、人には「个」（改まった言い方では「位」）を使います。量詞の前の「2」は「二」ではなく「两」です。「本」は本などを数える量詞です。",
  },
  {
    focus: "context",
    id: "mw-context-bei",
    units: ["measure-word"],
    prompt: `A：你要几${BLANK}咖啡？\nB：两杯，谢谢。`,
    note: "A「コーヒーはいくつ要る？」 B「2杯お願い」",
    choices: ["本", "张", "杯", "条"],
    answer: "杯",
    explanation:
      "コップやカップに入った飲み物は「杯」で数えます。B が「两杯」と答えているのも手がかりです。「几」（いくつ）の後にも量詞が必要です。",
  },
  {
    focus: "blank",
    id: "mw-blank-ben",
    units: ["measure-word"],
    prompt: `这${BLANK}书很有意思。`,
    note: "この本は面白い。",
    choices: ["个", "张", "条", "本"],
    answer: "本",
    explanation:
      "本・雑誌など冊子になったものは「本」で数えます。「这・那」（この・あの）と名詞の間にも量詞が必要です。",
  },
  {
    focus: "blank",
    id: "mw-blank-zhi",
    units: ["measure-word"],
    prompt: `桌子上有一${BLANK}猫。`,
    note: "机の上に猫が1匹いる。",
    choices: ["只", "本", "条", "张"],
    answer: "只",
    explanation:
      "猫・鳥などの小動物は「只」で数えます。「条」は犬・魚・蛇のような細長いもの、「张」は平らなもの、「本」は本を数えます。",
  },
  {
    focus: "blank",
    id: "mw-blank-tiao",
    units: ["measure-word"],
    prompt: `我买了一${BLANK}裤子。`,
    note: "私はズボンを1本買った。",
    choices: ["件", "张", "条", "双"],
    answer: "条",
    explanation:
      "ズボン・スカート・道・川など細長いものは「条」で数えます。上着やシャツは「件」、靴や箸のように2つで一組のものは「双」です。",
  },
];

// ── 比較 ──
const comparisonQuestions: GrammarQuestion[] = [
  {
    focus: "meaning",
    id: "comp-meaning-meiyou",
    units: ["comparison"],
    prompt: "我没有他高。",
    choices: [
      "私は彼より背が高い。",
      "私は彼と同じくらい背が高い。",
      "彼は私ほど背が高くない。",
      "私は彼ほど背が高くない。",
    ],
    answer: "私は彼ほど背が高くない。",
    explanation:
      "「A 没有 B + 形容詞」で「AはBほど〜ではない」という比較の否定です。「比」の文（我比他高＝私は彼より高い）の否定にはふつう「没有」を使います。",
  },
  {
    focus: "form",
    id: "comp-form-duole",
    units: ["comparison"],
    prompt: "今日は昨日よりずっと暑い。",
    choices: ["今天比昨天很热。", "今天比昨天热多了。", "今天比昨天非常热。", "今天比昨天多热了。"],
    answer: "今天比昨天热多了。",
    explanation:
      "「比」の比較文では、形容詞の前に「很・非常・太」を置けません。差が大きいことは形容詞の後ろに「多了」「得多」を付けて表します（少しなら「一点儿」）。強めるなら「更热」「还热」も使えます。",
  },
  {
    focus: "context",
    id: "comp-context-yiyang",
    units: ["comparison"],
    prompt: `A：你和你姐姐谁高？\nB：我们${BLANK}高。`,
    note: "A「君とお姉さん、どっちが背が高い？」 B「私たちは…」",
    choices: ["比", "一样", "没有", "更"],
    answer: "一样",
    explanation:
      "「A 跟（和）B 一样 + 形容詞」で「AとBは同じくらい〜」。ここでは主語の「我们」（私たち）がAとBにあたるので「我们一样高」です。「比」「没有」は比べる相手がないと使えません。",
  },
  {
    focus: "blank",
    id: "comp-blank-bi",
    units: ["comparison"],
    prompt: `我${BLANK}他大三岁。`,
    note: "私は彼より3歳年上だ。",
    choices: ["跟", "比", "没有", "和"],
    answer: "比",
    explanation:
      "「A 比 B + 形容詞 + 差」で「AはBより（差の分だけ）〜」。差の「三岁」は形容詞の後ろに置きます。「跟・和」は「一样」と組んで同じであることを表します。",
  },
  {
    focus: "blank",
    id: "comp-blank-yidianr",
    units: ["comparison"],
    prompt: `这件衣服比那件贵一${BLANK}。`,
    note: "この服はあれより少し高い。",
    choices: ["下", "点儿", "次", "个"],
    answer: "点儿",
    explanation:
      "比較文で「少し〜」と差が小さいことを表すときは、形容詞の後ろに「一点儿」を付けます。「一下」は動作を「ちょっと〜する」、「一次」は回数を表します。",
  },
  {
    focus: "blank",
    id: "comp-blank-de-bi",
    units: ["comparison", "complement"],
    prompt: `他汉语说得${BLANK}我好。`,
    note: "彼は私より中国語を話すのが上手だ。",
    choices: ["跟", "对", "比", "给"],
    answer: "比",
    explanation:
      "様態補語（说得好）を使った比較では、「比 + 相手」を「得」の後ろか動詞の前に置きます（他汉语说得比我好／他汉语比我说得好）。",
  },
];

export const grammarQuiz: GrammarQuestion[] = [
  ...auxVerbQuestions,
  ...negationQuestions,
  ...aspectQuestions,
  ...possibilityQuestions,
  ...complementQuestions,
  ...prepositionQuestions,
  ...measureWordQuestions,
  ...comparisonQuestions,
];
