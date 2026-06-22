export default [
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        console: "readonly",
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        Date: "readonly",
        Math: "readonly",
        JSON: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        addEventListener: "readonly",
        removeEventListener: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "error",
      "no-undef": "error",
      "semi": ["error", "always"],
      "quotes": ["error", "single"],
      "indent": ["error", 2],
      "no-trailing-spaces": "error",
      "eol-last": "error"
    }
  }
];