/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "@vue/eslint-config-typescript",
    "@vue/eslint-config-prettier/skip-formatting",
    "plugin:@intlify/vue-i18n/recommended",
    "plugin:vue/vue3-recommended",
    "plugin:vue/vue3-strongly-recommended",
    "plugin:vue/vue3-essential",
  ],
  parser: "vue-eslint-parser",
  rules: {
    "prettier/prettier": "error",
    eqeqeq: "error", // Enforces use of === and !== over == and !=.
    curly: "error", // Requires all control statements to be braced.
    "no-console": ["warn", { allow: ["error", "warn"] }], // Warns on console usage in the code.
    "no-debugger": "warn", // Warns if debugger statements are present.
    "no-var": "error", // Requires usage of let or const over var.
    "prefer-const": "error", // Requires to use const for variables never reassigned.
    "prefer-template": "error", // Enforces use of template literals over string concatenation.
    "no-multiple-empty-lines": ["error", { max: 1 }], // Enforces max of one consecutive empty lines.
    "import/no-relative-parent-imports": "error", // Disallows imports with relative parent paths.
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // Warns when variables are declared but never used.
    "import/order": [
      "warn",
      {
        "newlines-between": "always", // Requires newline between import groups.
        groups: ["builtin", "external", ["parent", "sibling", "index"]], // Defines the order of import groups.
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ], // Enforces a convention in the order of require/import statements.
    "@intlify/vue-i18n/no-unused-keys": [
      "error",
      {
        extensions: [".vue"],
        ignores: [
          "/enums*/",
          "/layers/",
          "/serverError/",
          "/clientError/",
          "/country/",
          "/format/",
        ],
        enableFix: true,
      },
    ], // Disallows unused i18n keys in Vue.js components.
    "vue/singleline-html-element-content-newline": "off", // Disables the requirement for newline for content inside a singleline HTML element.
    "vue/max-attributes-per-line": "off", // Disables the limit on the number of attributes per line in a HTML element.
    "vue/html-closing-bracket-newline": "off", // Disables the requirement for newline after closing bracket of HTML element.
    "vue/html-indent": "off", // Disables indent requirements, using prettier format instead
    "vue/html-self-closing": [
      "error",
      {
        html: {
          void: "any", // Allows for void HTML elements to be self-closing or not.
          normal: "never", // Disallows self-closing for normal HTML elements.
          component: "always", // Enforces self-closing on Vue.js custom components.
        },
        svg: "always", // Enforces self-closing on SVG elements.
        math: "always", // Enforces self-closing on MathML elements.
      },
    ], // Enforces specific self-closing style depending on the type of tag.
    "no-undef": "off", // Disable the check for undeclared variables, redundant through typescript, and conflicts with unplugin.
  },
  overrides: [
    {
      files: ["cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}"],
      extends: ["plugin:cypress/recommended"],
    },
    {
      /* files in the bootstrap dir have their own i18n */
      files: ["src/bootstrap/**"],
      rules: {
        "@intlify/vue-i18n/no-missing-keys": "off",
      },
    },
  ],
  plugins: ["import", "prettier"],
  parserOptions: {
    ecmaVersion: "latest",
  },
  settings: {
    "vue-i18n": {
      localeDir: "./src/locales/*.json",
      messageSyntaxVersion: "^9.2.2",
    },
  },
};
