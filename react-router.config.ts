import type { Config } from "@react-router/dev/config";

// 本番はリバースプロキシの背後で動くため、サーバーから見た URL は http://、ブラウザの Origin は
// https:// になり、CSRF チェックで action がすべて 400 になる。公開ホストを許可して回避する
const publicHost = process.env.BETTER_AUTH_URL ? new URL(process.env.BETTER_AUTH_URL).host : null;

export default {
  ssr: true,
  allowedActionOrigins: publicHost ? [publicHost] : [],
} satisfies Config;
