import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  globalIgnores([
    ".react-router/**",
    "build/**",
    "app/generated/**",
    ".worktree/**",
    ".worktrees/**",
  ]),
]);

export default eslintConfig;
