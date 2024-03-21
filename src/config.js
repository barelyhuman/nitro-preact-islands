import preactIslandPlugins from "@barelyhuman/preact-island-plugins/rollup";
import babel from "@rollup/plugin-babel";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * @param {import("nitropack").NitroConfig} config
 */
export function withIslands(config) {
  config.publicAssets = config.publicAssets || [];

  config.publicAssets.push({
    dir: ".islands",
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

  config.plugins.push(join(dir, "plugin"));

  config.rollupConfig = config.rollupConfig || {};
  config.rollupConfig.plugins = config.rollupConfig.plugins || [];

  config.rollupConfig.plugins = config.rollupConfig.plugins.concat(
    preactIslandPlugins({
      rootDir: ".",
      baseURL: "/.islands",
      client: {
        output: ".islands",
      },
    }),
    babel({
      babelHelpers: "bundled",
      plugins: [
        [
          "@babel/plugin-transform-react-jsx",
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
