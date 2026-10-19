// 中国語ピンインの全音節（無声調、ü は v 表記、lue/nue は lve/nve）
export const PINYIN_SYLLABLES: readonly string[] = [
  "a",
  "ai",
  "an",
  "ang",
  "ao",
  "ba",
  "bai",
  "ban",
  "bang",
  "bao",
  "bei",
  "ben",
  "beng",
  "bi",
  "bian",
  "biao",
  "bie",
  "bin",
  "bing",
  "bo",
  "bu",
  "ca",
  "cai",
  "can",
  "cang",
  "cao",
  "ce",
  "cen",
  "ceng",
  "cha",
  "chai",
  "chan",
  "chang",
  "chao",
  "che",
  "chen",
  "cheng",
  "chi",
  "chong",
  "chou",
  "chu",
  "chua",
  "chuai",
  "chuan",
  "chuang",
  "chui",
  "chun",
  "chuo",
  "ci",
  "cong",
  "cou",
  "cu",
  "cuan",
  "cui",
  "cun",
  "cuo",
  "da",
  "dai",
  "dan",
  "dang",
  "dao",
  "de",
  "dei",
  "den",
  "deng",
  "di",
  "dia",
  "dian",
  "diao",
  "die",
  "ding",
  "diu",
  "dong",
  "dou",
  "du",
  "duan",
  "dui",
  "dun",
  "duo",
  "e",
  "ei",
  "en",
  "eng",
  "er",
  "fa",
  "fan",
  "fang",
  "fei",
  "fen",
  "feng",
  "fo",
  "fou",
  "fu",
  "ga",
  "gai",
  "gan",
  "gang",
  "gao",
  "ge",
  "gei",
  "gen",
  "geng",
  "gong",
  "gou",
  "gu",
  "gua",
  "guai",
  "guan",
  "guang",
  "gui",
  "gun",
  "guo",
  "ha",
  "hai",
  "han",
  "hang",
  "hao",
  "he",
  "hei",
  "hen",
  "heng",
  "hm",
  "hng",
  "hong",
  "hou",
  "hu",
  "hua",
  "huai",
  "huan",
  "huang",
  "hui",
  "hun",
  "huo",
  "ji",
  "jia",
  "jian",
  "jiang",
  "jiao",
  "jie",
  "jin",
  "jing",
  "jiong",
  "jiu",
  "ju",
  "juan",
  "jue",
  "jun",
  "ka",
  "kai",
  "kan",
  "kang",
  "kao",
  "ke",
  "kei",
  "ken",
  "keng",
  "kong",
  "kou",
  "ku",
  "kua",
  "kuai",
  "kuan",
  "kuang",
  "kui",
  "kun",
  "kuo",
  "la",
  "lai",
  "lan",
  "lang",
  "lao",
  "le",
  "lei",
  "leng",
  "li",
  "lia",
  "lian",
  "liang",
  "liao",
  "lie",
  "lin",
  "ling",
  "liu",
  "lo",
  "long",
  "lou",
  "lu",
  "luan",
  "lun",
  "luo",
  "lv",
  "lve",
  "m",
  "ma",
  "mai",
  "man",
  "mang",
  "mao",
  "me",
  "mei",
  "men",
  "meng",
  "mi",
  "mian",
  "miao",
  "mie",
  "min",
  "ming",
  "miu",
  "mo",
  "mou",
  "mu",
  "n",
  "na",
  "nai",
  "nan",
  "nang",
  "nao",
  "ne",
  "nei",
  "nen",
  "neng",
  "ng",
  "ni",
  "nian",
  "niang",
  "niao",
  "nie",
  "nin",
  "ning",
  "niu",
  "nong",
  "nou",
  "nu",
  "nuan",
  "nun",
  "nuo",
  "nv",
  "nve",
  "o",
  "ou",
  "pa",
  "pai",
  "pan",
  "pang",
  "pao",
  "pei",
  "pen",
  "peng",
  "pi",
  "pian",
  "piao",
  "pie",
  "pin",
  "ping",
  "po",
  "pou",
  "pu",
  "qi",
  "qia",
  "qian",
  "qiang",
  "qiao",
  "qie",
  "qin",
  "qing",
  "qiong",
  "qiu",
  "qu",
  "quan",
  "que",
  "qun",
  "ran",
  "rang",
  "rao",
  "re",
  "ren",
  "reng",
  "ri",
  "rong",
  "rou",
  "ru",
  "rua",
  "ruan",
  "rui",
  "run",
  "ruo",
  "sa",
  "sai",
  "san",
  "sang",
  "sao",
  "se",
  "sen",
  "seng",
  "sha",
  "shai",
  "shan",
  "shang",
  "shao",
  "she",
  "shei",
  "shen",
  "sheng",
  "shi",
  "shou",
  "shu",
  "shua",
  "shuai",
  "shuan",
  "shuang",
  "shui",
  "shun",
  "shuo",
  "si",
  "song",
  "sou",
  "su",
  "cuan",
  "sui",
  "sun",
  "suo",
  "ta",
  "tai",
  "tan",
  "tang",
  "tao",
  "te",
  "teng",
  "ti",
  "tian",
  "tiao",
  "tie",
  "ting",
  "tong",
  "tou",
  "tu",
  "tuan",
  "tui",
  "tun",
  "tuo",
  "wa",
  "wai",
  "wan",
  "wang",
  "wei",
  "wen",
  "weng",
  "wo",
  "wu",
  "xi",
  "xia",
  "xian",
  "xiang",
  "xiao",
  "xie",
  "xin",
  "xing",
  "xiong",
  "xiu",
  "xu",
  "xuan",
  "xue",
  "xun",
  "ya",
  "yan",
  "yang",
  "yao",
  "ye",
  "yi",
  "yin",
  "ying",
  "yo",
  "yong",
  "you",
  "yu",
  "yuan",
  "yue",
  "yun",
  "za",
  "zai",
  "zan",
  "zang",
  "zao",
  "ze",
  "zei",
  "zen",
  "zeng",
  "zha",
  "zhai",
  "zhan",
  "zhang",
  "zhao",
  "zhe",
  "zhei",
  "zhen",
  "zheng",
  "zhi",
  "zhong",
  "zhou",
  "zhu",
  "zhua",
  "zhuai",
  "zhuan",
  "zhuang",
  "zhui",
  "zhun",
  "zhuo",
  "zi",
  "zong",
  "zou",
  "zu",
  "zuan",
  "zui",
  "zun",
  "zuo",
];

const SYLLABLE_SET = new Set<string>(PINYIN_SYLLABLES);

// 前方一致判定のためのプレフィックス集合
const PREFIX_SET = new Set<string>();
for (const s of PINYIN_SYLLABLES) {
  for (let i = 1; i <= s.length; i++) {
    PREFIX_SET.add(s.slice(0, i));
  }
}

// 声調記号付き母音の正規化テーブル
const TONE_CHAR_MAP: Record<string, string> = {
  ā: "a",
  á: "a",
  ǎ: "a",
  à: "a",
  ē: "e",
  é: "e",
  ě: "e",
  è: "e",
  ī: "i",
  í: "i",
  ǐ: "i",
  ì: "i",
  ō: "o",
  ó: "o",
  ǒ: "o",
  ò: "o",
  ū: "u",
  ú: "u",
  ǔ: "u",
  ù: "u",
  ü: "v",
  ǖ: "v",
  ǘ: "v",
  ǚ: "v",
  ǜ: "v",
};

/**
 * 声調番号・声調記号を取り、小文字にして ü を v に正規化する。
 * lue / nue は lve / nve に変換する。
 */
export function normalizeSyllable(raw: string): string {
  let s = raw.normalize("NFC").toLowerCase();
  // 声調記号の置換
  s = s.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùüǖǘǚǜ]/g, (ch) => TONE_CHAR_MAP[ch] ?? ch);
  // 声調番号 (0-5) の除去
  s = s.replace(/[0-5]/g, "");
  // ü を v に（念のため通常の ü も）
  s = s.replace(/ü/g, "v");
  // lue / nue -> lve / nve
  s = s.replace(/^lue$/, "lve").replace(/^nue$/, "nve");
  return s;
}

/**
 * 正規化した文字列が有効なピンイン音節か判定する。
 */
export function isPinyinSyllable(s: string): boolean {
  return SYLLABLE_SET.has(normalizeSyllable(s));
}

export function isPinyinPrefix(s: string): boolean {
  return PREFIX_SET.has(s);
}

export interface PinyinSegment {
  text: string;
  start: number;
  end: number;
  partial: boolean;
}

/**
 * ピンイン文字列を音節に区切る。
 * - 前から長い音節を優先（最長一致）
 * - 後続が区切れないときは短い音節にバックトラックする
 * - アポストロフィ (') は音節区切りとして扱う
 * - 最後の音節は partial（音節プレフィックス）でも許容する
 * - 全体が区切れない場合は null を返す
 */
export function segmentPinyin(rawInput: string): PinyinSegment[] | null {
  if (!rawInput) return null;
  // 前後の空白や不正な文字の確認
  if (/\s/.test(rawInput)) return null;

  const raw = rawInput;
  const n = raw.length;

  // 各文字位置について、アポストロフィでなければ小文字化・正規化
  // ただしアポストロフィは境界として扱う
  // raw[i] が ' の場合は音節内部には含まれない

  // バックトラッキング探索関数
  // index: 現在の raw 文字列中の開始位置
  function search(index: number, allowPartialAtEnd: boolean): PinyinSegment[] | null {
    if (index >= n) {
      return [];
    }

    // アポストロフィが先頭にある場合（直前で消費されたアポストロフィを除く）
    if (raw[index] === "'") {
      return null;
    }

    // index から始まる候補文字列を収集
    // アポストロフィに出会うまでの最長英字列を取得（最大6文字程度で十分）
    let endLimit = index;
    while (endLimit < n && raw[endLimit] !== "'") {
      endLimit++;
    }

    // 最長一致で試すため、長い順に探索
    // 音節の最大長は 6 文字 (shuang, zhuang など)
    const maxLen = Math.min(endLimit - index, 6);

    for (let len = maxLen; len >= 1; len--) {
      const sliceEnd = index + len;
      const subRaw = raw.slice(index, sliceEnd);
      const normalized = normalizeSyllable(subRaw);

      if (isPinyinSyllable(normalized)) {
        // 次の開始位置: もし sliceEnd が ' なら、その ' をスキップして次へ
        let nextIndex = sliceEnd;
        if (nextIndex < n && raw[nextIndex] === "'") {
          nextIndex++;
          // ' で終わる入力は無効
          if (nextIndex >= n) {
            continue;
          }
        }

        const rest = search(nextIndex, allowPartialAtEnd);
        if (rest !== null) {
          return [{ text: normalized, start: index, end: sliceEnd, partial: false }, ...rest];
        }
      }
    }

    // ここまでで完全一致が見つからなかった場合、
    // もしここが末尾（endLimit === n）かつ allowPartialAtEnd なら partial を試す
    if (allowPartialAtEnd && endLimit === n) {
      const subRaw = raw.slice(index, n);
      const normalized = normalizeSyllable(subRaw);
      if (isPinyinPrefix(normalized)) {
        return [{ text: normalized, start: index, end: n, partial: true }];
      }
    }

    return null;
  }

  // まず探索を実行
  // 末尾が partial かどうかも含めて探索
  return search(0, true);
}
