import ExcelJS from "exceljs";

import { attachmentContentDisposition } from "@/lib/shared/content-disposition";
import { NOTEBOOK_TEMPLATE_COLUMNS, type TemplateLanguage } from "@/lib/shared/notebook-quiz";

const COLUMN_COUNT = 6;

export async function loader({ request }: { request: Request }) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename") || "単語帳テンプレート";
  const language = searchParams.get("language") || "英語";

  // 1行目（列名）はクイズの補助（app/lib/shared/notebook-quiz.ts）と共有し、2行目に記入例を置く
  const examples: Record<TemplateLanguage, string[]> = {
    英語: ["example", "例"],
    ドイツ語: ["Beispiel", "例", "das Beispiel", "die Beispiele"],
    中国語: ["例子", "例", "lìzi"],
    フランス語: ["exemple", "例", "un exemple"],
    スペイン語: ["ejemplo", "例", "el ejemplo"],
  };
  const templateLanguage: TemplateLanguage = Object.hasOwn(NOTEBOOK_TEMPLATE_COLUMNS, language)
    ? (language as TemplateLanguage)
    : "英語";
  // 6列分の幅を取り、空いた列は空欄にする
  const pad = (values: readonly string[]) =>
    Array.from({ length: COLUMN_COUNT }, (_, i) => values[i] ?? "");
  const header = pad(NOTEBOOK_TEMPLATE_COLUMNS[templateLanguage]);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");

  worksheet.columns = header.map((name, i) => ({ header: name, key: `col${i + 1}`, width: 20 }));

  worksheet.addRow(pad(examples[templateLanguage]));
  worksheet.addRow(pad([]));

  const fileName = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": attachmentContentDisposition(fileName),
    },
  });
}
