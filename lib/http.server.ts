// 404 を返す。loader・action のどこからでも投げられる(Next の notFound() 相当)
export function notFound(): never {
  throw new Response("Not Found", { status: 404 });
}
