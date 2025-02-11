export default defineNitroConfig({
  modules: ["nitro-preact-islands"],
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
