/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
  },
};
