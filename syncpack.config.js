/** @type {import("syncpack").RcFile} */
module.exports = {
  semverRange: "^",
  source: ["package.json", "apps/*/package.json", "packages/*/package.json"],
  versionGroups: [
    {
      label: "Workspace packages must use workspace protocol",
      packages: ["**"],
      dependencies: ["@repo/*"],
      dependencyTypes: ["*"],
      pinVersion: "workspace:*",
    },
  ],
};
