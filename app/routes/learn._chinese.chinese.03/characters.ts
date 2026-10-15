// 基本的な漢字1字と、その普通話（標準中国語）でのピンイン。
// pinyin は声調記号付きの表記（軽声は記号なし）。多音字は避け、代表的な読みが1つに定まる字だけを収録している。

export interface HanziEntry {
  id: string;
  hanzi: string;
  // 声調記号付きピンイン（例: "wǒ"、軽声は "ma"）
  pinyin: string;
  // 日本語での意味・用法
  meaning: string;
}

export const characters: HanziEntry[] = [
  // 数字
  { id: "yi", hanzi: "一", pinyin: "yī", meaning: "1" },
  { id: "er", hanzi: "二", pinyin: "èr", meaning: "2" },
  { id: "san", hanzi: "三", pinyin: "sān", meaning: "3" },
  { id: "si", hanzi: "四", pinyin: "sì", meaning: "4" },
  { id: "wu", hanzi: "五", pinyin: "wǔ", meaning: "5" },
  { id: "liu", hanzi: "六", pinyin: "liù", meaning: "6" },
  { id: "qi", hanzi: "七", pinyin: "qī", meaning: "7" },
  { id: "ba", hanzi: "八", pinyin: "bā", meaning: "8" },
  { id: "jiu", hanzi: "九", pinyin: "jiǔ", meaning: "9" },
  { id: "shi10", hanzi: "十", pinyin: "shí", meaning: "10" },

  // 代名詞・基本動詞・助詞
  { id: "wo", hanzi: "我", pinyin: "wǒ", meaning: "わたし" },
  { id: "ni", hanzi: "你", pinyin: "nǐ", meaning: "あなた" },
  { id: "ta-he", hanzi: "他", pinyin: "tā", meaning: "彼" },
  { id: "ta-she", hanzi: "她", pinyin: "tā", meaning: "彼女" },
  { id: "shi-be", hanzi: "是", pinyin: "shì", meaning: "〜である" },
  { id: "bu", hanzi: "不", pinyin: "bù", meaning: "〜でない（否定）" },
  { id: "you-have", hanzi: "有", pinyin: "yǒu", meaning: "ある・持つ" },
  { id: "zai", hanzi: "在", pinyin: "zài", meaning: "〜にある／〜で" },
  { id: "hao", hanzi: "好", pinyin: "hǎo", meaning: "よい" },
  { id: "hen", hanzi: "很", pinyin: "hěn", meaning: "とても" },
  { id: "ma-q", hanzi: "吗", pinyin: "ma", meaning: "〜か（疑問／軽声）" },
  { id: "de-poss", hanzi: "的", pinyin: "de", meaning: "〜の（軽声）" },

  // 方向・大小・自然
  { id: "zhong", hanzi: "中", pinyin: "zhōng", meaning: "中・中国" },
  { id: "guo", hanzi: "国", pinyin: "guó", meaning: "国" },
  { id: "ren", hanzi: "人", pinyin: "rén", meaning: "人" },
  { id: "da", hanzi: "大", pinyin: "dà", meaning: "大きい" },
  { id: "xiao", hanzi: "小", pinyin: "xiǎo", meaning: "小さい" },
  { id: "duo", hanzi: "多", pinyin: "duō", meaning: "多い" },
  { id: "shang", hanzi: "上", pinyin: "shàng", meaning: "上" },
  { id: "xia", hanzi: "下", pinyin: "xià", meaning: "下" },
  { id: "tian", hanzi: "天", pinyin: "tiān", meaning: "空・日" },
  { id: "ri", hanzi: "日", pinyin: "rì", meaning: "日・太陽" },
  { id: "yue", hanzi: "月", pinyin: "yuè", meaning: "月" },
  { id: "nian", hanzi: "年", pinyin: "nián", meaning: "年" },
  { id: "shui", hanzi: "水", pinyin: "shuǐ", meaning: "水" },
  { id: "huo", hanzi: "火", pinyin: "huǒ", meaning: "火" },
  { id: "shan", hanzi: "山", pinyin: "shān", meaning: "山" },

  // 人・暮らし
  { id: "nu", hanzi: "女", pinyin: "nǚ", meaning: "女" },
  { id: "nan", hanzi: "男", pinyin: "nán", meaning: "男" },
  { id: "ming", hanzi: "名", pinyin: "míng", meaning: "名前" },
  { id: "zi-char", hanzi: "字", pinyin: "zì", meaning: "字" },
  { id: "shu-book", hanzi: "书", pinyin: "shū", meaning: "本" },
  { id: "jia", hanzi: "家", pinyin: "jiā", meaning: "家" },
  { id: "ai", hanzi: "爱", pinyin: "ài", meaning: "愛する" },
  { id: "xue", hanzi: "学", pinyin: "xué", meaning: "学ぶ" },
  { id: "ma-horse", hanzi: "马", pinyin: "mǎ", meaning: "馬" },
  { id: "niao", hanzi: "鸟", pinyin: "niǎo", meaning: "鳥" },

  // 動作
  { id: "chi", hanzi: "吃", pinyin: "chī", meaning: "食べる" },
  { id: "he-drink", hanzi: "喝", pinyin: "hē", meaning: "飲む" },
  { id: "kan", hanzi: "看", pinyin: "kàn", meaning: "見る" },
  { id: "qu", hanzi: "去", pinyin: "qù", meaning: "行く" },
  { id: "lai", hanzi: "来", pinyin: "lái", meaning: "来る" },
];
