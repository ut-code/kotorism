type CryptoLike = Pick<Crypto, "getRandomValues"> & Partial<Pick<Crypto, "randomUUID">>;

// ランダムなID（UUID v4の形）を作る。crypto.randomUUID は https か localhost でしか使えず
// （スマホから開発サーバーへ http://<IP> でつないだときなど）、iOS 15.3 以前の Safari にも無いため、
// 無いときは どこでも使える getRandomValues から同じ形のIDを組み立てる
export function createRandomId(cryptoLike: CryptoLike = globalThis.crypto): string {
  if (typeof cryptoLike.randomUUID === "function") return cryptoLike.randomUUID();

  const bytes = cryptoLike.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // バージョン4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // バリアント
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
