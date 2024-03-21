# nitro-preact-islands

> UnJS Nitro plugin to render preact islands

## Usage

1. Create a new [nitro project](https://nitro.unjs.io/guide#quick-start)

2. Install the plugin and it's other dependencies

```sh
; npm i -D nitro-preact-islands preact
```

3. Modify `nitro.config.ts` to use the plugin

```js
import { withIslands } from "nitro-preact-islands";

export default withIslands(
  defineNitroConfig({
    // ...any nitro options
  })
);
```
