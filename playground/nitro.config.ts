export default defineNitroConfig({
  modules: ["nitro-preact-islands"],
  esbuild: {
    options: {
      jsx: "automatic",
      jsxImportSource: "preact",
    },
  },
  rollupConfig: {
    jsx: {
      mode: "automatic",
      importSource: "preact",
    },
  },
  imports: {
    imports: [
      {
        name: "default",
        as: "renderToString",
        from: "preact-render-to-string",
      },
    ],
  },
  compatibilityDate: "2025-02-11",
});
