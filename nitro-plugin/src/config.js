import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { rollupPlugin } from "./islands/plugin.js";
import babel from "@rollup/plugin-babel";
import transformJSX from "@babel/plugin-transform-react-jsx";

/**
 * @param {import("nitropack").NitroConfig} config
 */
export function withIslands(config) {
  config.publicAssets = config.publicAssets || [];

  config.publicAssets.push({
    dir: "./.islands",
    baseURL: ".islands",
  });

  config.esbuild = config.esbuild || {};
  config.esbuild = {
    options: {
      loaders: {
        ".js": "jsx",
      },
    },
  };

  config.plugins = config.plugins || [];
  const dir = dirname(fileURLToPath(import.meta.url));

  config.plugins.push(join(dir, "plugin.js"));

  config.externals = [].concat(
    config.externals || [],
    "preact",
    "preact/hooks"
  );

  config.rollupConfig = config.rollupConfig || {};
  config.rollupConfig.plugins = config.rollupConfig.plugins || [];

  config.rollupConfig.plugins = config.rollupConfig.plugins.concat(
    rollupPlugin(),
    babel({
      babelHelpers: "bundled",
      plugins: [
        [
          transformJSX,
          {
            runtime: "automatic",
            importSource: "preact",
          },
        ],
      ],
    })
  );

  return config;
}
