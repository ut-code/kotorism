import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { createTemplateWorkbookBuffer, ExcelParseError, parseExcelWorkbook } from "./excel";

async function workbookBuffer(rows: (string | number | null)[][]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  for (const row of rows) sheet.addRow(row);
  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}

describe("parseExcelWorkbook", () => {
  it("1 行目を列名、2 行目以降を見出し語ごとのカードに変換する", async () => {
    const result = await parseExcelWorkbook(
      await workbookBuffer([
        ["見出し語", "意味", "例文"],
        ["chat", "猫", "Un chat."],
        ["chien", "犬", null],
      ]),
    );
    expect(result.columns).toEqual(["見出し語", "意味", "例文"]);
    expect(result.rows).toEqual([
      { head: "chat", rows: [{ 意味: "猫", 例文: "Un chat." }] },
      { head: "chien", rows: [{ 意味: "犬" }] },
    ]);
  });

  it("同じ見出し語が複数行に渡ると、1 枚のカードの複数の組にまとめる", async () => {
    const result = await parseExcelWorkbook(
      await workbookBuffer([
        ["見出し語", "意味"],
        ["avocat", "弁護士"],
        ["avocat", "アボカド"],
      ]),
    );
    expect(result.rows).toEqual([
      { head: "avocat", rows: [{ 意味: "弁護士" }, { 意味: "アボカド" }] },
    ]);
  });

  it("数値のセルも文字列として読む", async () => {
    const result = await parseExcelWorkbook(
      await workbookBuffer([
        ["見出し語", "意味"],
        ["un", 1],
      ]),
    );
    expect(result.rows[0].rows).toEqual([{ 意味: "1" }]);
  });

  it("xlsx でないデータは ExcelParseError", async () => {
    await expect(parseExcelWorkbook(new TextEncoder().encode("not excel").buffer)).rejects.toThrow(
      ExcelParseError,
    );
  });
});

describe("createTemplateWorkbookBuffer", () => {
  it("1 行目だけの有効な xlsx を作る(データ行が無いので、そのままでは取り込めない)", async () => {
    const buffer = await createTemplateWorkbookBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    expect(workbook.worksheets[0].actualRowCount).toBe(1);
    await expect(parseExcelWorkbook(buffer)).rejects.toThrow(ExcelParseError);
  });
});
