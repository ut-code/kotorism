import ExcelJS from "exceljs";

import { attachmentContentDisposition } from "@/lib/shared/content-disposition";

export async function loader({ request }: { request: Request }) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename") || "単語帳テンプレート";
  const language = searchParams.get("language") || "英語";

  const languageMap: Record<
    string,
    {
      col1: string;
      col2: string;
      col3: string;
      col4: string;
      col5: string;
      col6: string;
      col1_2: string;
      col2_2: string;
      col3_2: string;
      col4_2: string;
      col5_2: string;
      col6_2: string;
    }
  > = {
    英語: {
      col1: "単語",
      col2: "意味",
      col3: "",
      col4: "",
      col5: "",
      col6: "",
      col1_2: "example",
      col2_2: "例",
      col3_2: "",
      col4_2: "",
      col5_2: "",
      col6_2: "",
    },
    ドイツ語: {
      col1: "単語",
      col2: "意味",
      col3: "性",
      col4: "複数形",
      col5: "格・前置詞",
      col6: "",
      col1_2: "Beispiel",
      col2_2: "例",
      col3_2: "das Beispiel",
      col4_2: "die Beispiele",
      col5_2: "",
      col6_2: "",
    },
    中国語: {
      col1: "単語",
      col2: "意味",
      col3: "拼音",
      col4: "",
      col5: "",
      col6: "",
      col1_2: "例子",
      col2_2: "例",
      col3_2: "lìzi",
      col4_2: "",
      col5_2: "",
      col6_2: "",
    },
    フランス語: {
      col1: "単語",
      col2: "意味",
      col3: "性",
      col4: "格・前置詞",
      col5: "",
      col6: "",
      col1_2: "exemple",
      col2_2: "例",
      col3_2: "un exemple",
      col4_2: "",
      col5_2: "",
      col6_2: "",
    },
    スペイン語: {
      col1: "単語",
      col2: "意味",
      col3: "性",
      col4: "格・前置詞",
      col5: "",
      col6: "",
      col1_2: "ejemplo",
      col2_2: "例",
      col3_2: "el ejemplo",
      col4_2: "",
      col5_2: "",
      col6_2: "",
    },
  };

  const template = languageMap[language] ?? languageMap["英語"];

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");

  worksheet.columns = [
    { header: template.col1, key: "col1", width: 20 },
    { header: template.col2, key: "col2", width: 20 },
    { header: template.col3, key: "col3", width: 20 },
    { header: template.col4, key: "col4", width: 20 },
    { header: template.col5, key: "col5", width: 20 },
    { header: template.col6, key: "col6", width: 20 },
  ];

  worksheet.addRow([
    template.col1_2,
    template.col2_2,
    template.col3_2,
    template.col4_2,
    template.col5_2,
    template.col6_2,
  ]);
  worksheet.addRow(["", "", "", "", "", ""]);

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
