// @g-loot/react-tournament-brackets ships its types at `dist/cjs/index.d.ts`,
// but its package.json's `types` field points at the nonexistent
// `dist/index.d.ts`. TS therefore can't find declarations for the package
// import and falls back to `any`. This shim redirects the module name to the
// real type-definitions location so we get full IntelliSense.
declare module "@g-loot/react-tournament-brackets" {
  export * from "@g-loot/react-tournament-brackets/dist/cjs/index";
}
