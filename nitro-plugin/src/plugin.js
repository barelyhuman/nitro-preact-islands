import { defineNitroPlugin } from "nitropack/runtime/plugin";
import { renderToString } from "preact-render-to-string";

export default defineNitroPlugin(async (context) => {
  context.hooks.hook("render:response", (response) => {
    if (!("__k" in response.body)) return;

    try {
      response.body = renderToString(response.body);
    } catch (err) {
      console.error(err);
      //
    }
  });
});
