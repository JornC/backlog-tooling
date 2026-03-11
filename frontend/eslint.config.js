import pluginVue from "eslint-plugin-vue";
import vueTsEslintConfig from "@vue/eslint-config-typescript";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";

export default [
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"],
  },
  {
    name: "app/files-to-ignore",
    ignores: ["**/dist/**", "**/coverage/**", "**/auto-imports.d.ts", "**/components.d.ts"],
  },
  ...pluginVue.configs["flat/essential"],
  ...vueTsEslintConfig(),
  skipFormatting,
  {
    rules: {
      eqeqeq: "error",
      curly: "error",
      "no-console": ["warn", { allow: ["error", "warn"] }],
      "no-debugger": "warn",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "no-multiple-empty-lines": ["error", { max: 1 }],
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "vue/singleline-html-element-content-newline": "off",
      "vue/max-attributes-per-line": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/html-indent": "off",
      "vue/html-self-closing": [
        "error",
        {
          html: {
            void: "any",
            normal: "never",
            component: "always",
          },
          svg: "always",
          math: "always",
        },
      ],
    },
  },
];
