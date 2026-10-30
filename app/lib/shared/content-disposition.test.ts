import { describe, expect, it } from "vite-plus/test";

import { attachmentContentDisposition } from "./content-disposition";

describe("attachmentContentDisposition", () => {
  it("日本語のファイル名でも Response のヘッダーに設定できる", () => {
    const value = attachmentContentDisposition("単語帳テンプレート.xlsx");
    expect(() => new Response(null, { headers: { "Content-Disposition": value } })).not.toThrow();
  });

  it("filename* に UTF-8 でパーセントエンコードしたファイル名を入れる", () => {
    expect(attachmentContentDisposition("単語帳.xlsx")).toContain(
      `filename*=UTF-8''${encodeURIComponent("単語帳.xlsx")}`,
    );
  });

  it("ASCII のファイル名はそのまま filename に入れる", () => {
    expect(attachmentContentDisposition("words.xlsx")).toContain(`filename="words.xlsx"`);
  });

  it("filename の ASCII 以外の文字と引用符・バックスラッシュは _ に置き換える", () => {
    expect(attachmentContentDisposition(`単語"a\\b.xlsx`)).toContain(`filename="___a_b.xlsx"`);
  });

  it("filename* では ' ( ) * もエンコードする", () => {
    expect(attachmentContentDisposition("it's (1)*.xlsx")).toContain(
      "filename*=UTF-8''it%27s%20%281%29%2A.xlsx",
    );
  });
});
