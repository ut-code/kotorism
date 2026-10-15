import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

// app/routes/ 以下を React Router のファイル規約(flat routes)でルートにする。
// 1 ルート = 1 フォルダ(<ルート名>/route.tsx)で、同じフォルダの他のファイルはルートにならない
export default flatRoutes() satisfies RouteConfig;
