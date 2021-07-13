module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:prettier/recommended",
  ],
  env: {
    es2021: true,
    browser: true,
    node: true,
    jquery: true,
    webextensions: true,
  },
  rules: {
    "sort-imports": 0,
    "import/order": [2, { alphabetize: { order: "asc" } }],
  },
}
