// ファイルをダウンロードさせる Content-Disposition ヘッダーの値を組み立てる。
// HTTP ヘッダーには Latin-1 の範囲の文字しか入れられず、日本語のファイル名をそのまま入れると
// Response の生成時に例外になる。そのため RFC 6266 / 5987 に従い、
// UTF-8 でエンコードした filename* を本命として付け、filename には ASCII だけの代替名を入れる
export function attachmentContentDisposition(fileName: string): string {
  const asciiFallback = fileName.replace(/[^\x20-\x7e]|["\\]/g, "_");
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
