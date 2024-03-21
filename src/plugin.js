import { defineNitroPlugin } from "nitropack/runtime/plugin";

import renderComponent from "preact-render-to-string";

export default defineNitroPlugin((context) => {
  context.hooks.hook("render:response", (response) => {
    if (!("__k" in response)) return;
    try {
      response.body = renderComponent(response);
    } catch (err) {
      //
    }
  });
});
