/** @type {import("eslint").Linter.Config} */

/** @param {string[]} types */
function allowTypes(types) {
  return types.map((type) => ({ to: { type } }));
}

/** @type {import("eslint").Linter.Config} */
module.exports = {
  plugins: ["boundaries"],
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.json",
      },
    },
    "boundaries/dependency-nodes": ["import"],
    "boundaries/elements": [
      { type: "domain", pattern: ["src/domain/**"] },
      { type: "application", pattern: ["src/application/**"] },
      { type: "contracts", pattern: ["src/contracts/**", "../../packages/contracts/src/**"] },
      { type: "infrastructure", pattern: ["src/infrastructure/**"] },
      { type: "ui", pattern: ["src/ui/**"] },
      { type: "shared", pattern: ["src/shared/**"] },
      { type: "packages-result", pattern: ["../../packages/result/src/**"] },
      { type: "packages-db", pattern: ["../../packages/db/src/**"] },
      { type: "packages-auth", pattern: ["../../packages/auth/src/**"] },
      { type: "packages-mail", pattern: ["../../packages/mail/src/**"] },
      { type: "app", pattern: ["app/**"] },
      { type: "legacy-lib", pattern: ["lib/**"] },
      { type: "legacy-comp", pattern: ["components/**"] },
      { type: "test-helpers", pattern: ["src/test-helpers/**"] },
    ],
  },
  rules: {
    "boundaries/no-unknown": "off",
  },
  overrides: [
    {
      files: ["**/*.integration.ts", "**/*.test.ts", "**/*.test.tsx"],
      rules: {
        "boundaries/dependencies": "off",
      },
    },
    {
      files: ["src/**/*.ts", "src/**/*.tsx"],
      excludedFiles: ["**/*.test.ts", "**/*.test.tsx", "**/*.integration.ts"],
      rules: {
        "boundaries/dependencies": [
          "error",
          {
            default: "disallow",
            rules: [
              {
                from: { type: "domain" },
                allow: allowTypes(["domain", "shared", "packages-result"]),
              },
              {
                from: { type: "application" },
                allow: allowTypes([
                  "domain",
                  "application",
                  "contracts",
                  "shared",
                  "packages-result",
                  "legacy-lib",
                  "infrastructure",
                ]),
              },
              {
                from: { type: "contracts" },
                allow: allowTypes(["contracts", "shared", "packages-result"]),
              },
              {
                from: { type: "infrastructure" },
                allow: allowTypes([
                  "domain",
                  "application",
                  "contracts",
                  "infrastructure",
                  "shared",
                  "packages-result",
                  "packages-db",
                  "packages-auth",
                  "packages-mail",
                  "legacy-lib",
                  "test-helpers",
                ]),
              },
              {
                from: { type: "ui" },
                allow: allowTypes(["ui", "shared", "contracts"]),
              },
              {
                from: { type: "shared" },
                allow: allowTypes(["shared", "packages-result"]),
              },
            ],
          },
        ],
      },
    },
    {
      files: ["app/**/*.ts", "app/**/*.tsx"],
      rules: {
        "boundaries/dependencies": [
          "error",
          {
            default: "disallow",
            rules: [
              {
                from: { type: "app" },
                allow: allowTypes([
                  "app",
                  "application",
                  "infrastructure",
                  "ui",
                  "contracts",
                  "shared",
                  "legacy-lib",
                  "legacy-comp",
                  "packages-result",
                  "packages-db",
                  "packages-auth",
                  "packages-mail",
                  "domain",
                ]),
              },
            ],
          },
        ],
      },
    },
    {
      files: [
        "lib/**/*.ts",
        "lib/**/*.tsx",
        "components/**/*.ts",
        "components/**/*.tsx",
        "scripts/**/*.ts",
      ],
      rules: {
        "boundaries/dependencies": "off",
      },
    },
  ],
};
