import { NOTEBOOK_CATEGORY, type PeriodMaterial } from "./study-events";

// 学習カレンダーで教材ごとに塗り分ける色（app/globals.css の --chart-*）。トップページのカードと同じく、
// My単語帳は coral 系、学習教材（作文・翻訳を含む）は tealblue 系にし、同じ種類の中では学習時間の多い順に濃さを変える
const SHADES_PER_KIND = 4;
const NOTEBOOK_COLORS = Array.from(
  { length: SHADES_PER_KIND },
  (_, i) => `var(--chart-notebook-${i + 1})`,
);
const LEARN_COLORS = Array.from(
  { length: SHADES_PER_KIND },
  (_, i) => `var(--chart-learn-${i + 1})`,
);
export const OTHER_MATERIAL_COLOR = "var(--chart-other)";

// 教材の key ごとの色。学習時間の無い教材は含めない（色の見本・バーを出さないため）。
// 同じ種類で SHADES_PER_KIND を超えた分は「その他」の色にする
export function materialColors(
  materials: Pick<PeriodMaterial, "key" | "category" | "seconds">[],
): Map<string, string> {
  const colors = new Map<string, string>();
  const used = { notebook: 0, learn: 0 };
  [...materials]
    .filter((material) => material.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds)
    .forEach((material) => {
      const kind = material.category === NOTEBOOK_CATEGORY ? "notebook" : "learn";
      const palette = kind === "notebook" ? NOTEBOOK_COLORS : LEARN_COLORS;
      colors.set(material.key, palette[used[kind]++] ?? OTHER_MATERIAL_COLOR);
    });
  return colors;
}
