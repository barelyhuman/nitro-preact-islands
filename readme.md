# nitro-preact-islands

> UnJS Nitro module to render preact islands

## Usage

1. Create a new [nitro project](https://nitro.unjs.io/guide#quick-start)

2. Install the module and it's other dependencies

```sh
; npm i -D nitro-preact-islands preact preact-render-to-string
```

3. Modify `nitro.config.ts` to use the module and helper for rendering

```js
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
});
```

4. You can now just render preact from the route handlers as normal

```jsx
import { Counter } from "~/ui/components/counter";

export default defineEventHandler(() => {
  return renderToString(<Counter />);
});
```

5. This would turn `Counter` intro an island if it has any amount of interactivity