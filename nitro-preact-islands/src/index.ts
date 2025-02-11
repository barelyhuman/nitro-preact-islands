import { djb2 } from "@dumbjs/quick-hash/djb2";
import {
  findIslands,
  generateClientTemplate,
  injectIslandAST,
  isFunctionIsland,
  readSourceFile,
} from "@dumbjs/preland";
import { addImportToAST, codeFromAST } from "@dumbjs/preland/ast";
import { defu } from "defu";
import { build } from "esbuild";
import { loadOptions } from "nitropack/core";
import { defineNitroModule } from "nitropack/kit";
import fs, { existsSync, mkdirSync, statSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type IslandOptions = {
  outDir: string;
  maxAge?: number;
};

declare module "nitropack" {
  interface NitroConfig {
    islands?: IslandOptions;
  }

  interface NitroOptions {
    islands?: IslandOptions;
  }
}

const defaultOptions: IslandOptions = {
  maxAge: 60 * 60 * 24,
  outDir: "./.islands",
};

export default defineNitroModule({
  name: "nitro-modules-island",
  setup(nitro) {
    const islandOptions = defu(nitro.options.islands ?? {}, defaultOptions);
    // Enable mapping jsx to preact
    nitro.options.esbuild ||= {};
    nitro.options.esbuild.options ||= {};
    nitro.options.esbuild.options.jsx = "automatic";
    nitro.options.esbuild.options.jsxImportSource = "preact";

    nitro.options.publicAssets ||= [];
    const islandsAssets = {
      baseURL: join("/", islandOptions.outDir, "/"),
      dir: islandOptions.outDir,
      maxAge: 60 * 60 * 24,
    };
    nitro.options.publicAssets.push(islandsAssets);

    // @ts-expect-error fix types
    nitro.options.rollupConfig ||= {
      plugins: [],
    };

    nitro.options.rollupConfig.plugins ||= [];
    if (Array.isArray(nitro.options.rollupConfig.plugins)) {
      nitro.options.rollupConfig.plugins.push(
        islandRollupPlugin(islandOptions)
      );
    }
  },
});

function islandRollupPlugin(options: IslandOptions) {
  let islandsDir = join(options.outDir);

  mkdirSync(islandsDir, {
    recursive: true,
  });

  const islandEntries = {};

  return {
    name: "nitro-preland",
    async generateBundle() {
      try {
        await build({
          entryPoints: islandEntries,
          jsx: "automatic",
          allowOverwrite: true,
          jsxImportSource: "preact",
          bundle: true,
          format: "esm",
          platform: "browser",
          outdir: islandsDir,
          entryNames: "[name]",
        });

        const presetOptions = await loadOptions();
        const files = await readdir(islandsDir, {
          recursive: true,
        });
        const baseDist = join(presetOptions.output.publicDir, ".islands");
        await Promise.all(
          files.map(async (item) => {
            const src = join(islandsDir, item);
            const dst = join(baseDist, item);
            await fs.promises.mkdir(dirname(dst), { recursive: true });
            await fs.promises.cp(src, dst);
          })
        );
      } catch (err) {
        console.error(err);
      }
    },
    async transform(_, id) {
      if (id.includes("virtual:")) return;
      // ignore files that don't exist or are part of `node_modules`
      if (!existsSync(id)) return;
      if (id.includes("node_modules")) return;

      const source = readSourceFile(id);

      const islands = findIslands(source, {
        isFunctionIsland: (ast, options) =>
          isFunctionIsland(ast, {
            ...options,
            transpiledIdentifiers:
              options.transpiledIdentifiers.concat("_jsxDEV"),
          }),
      });

      if (!(islands && islands.length)) return;
      islands.forEach((i) => {
        // @ts-expect-error invalid types from @dumbjs/preland
        injectIslandAST(i.ast, i);
      });
      const addImport = addImportToAST(islands[0].ast);
      addImport("h", "preact", {
        named: true,
      });
      addImport("Fragment", "preact", {
        named: true,
      });
      let serverCode = codeFromAST(islands[0].ast);
      await mkdir(islandsDir, {
        recursive: true,
      });
      let islandHashes = {};
      await Promise.all(
        islands.map(async (island) => {
          const clientTemplate = generateClientTemplate(island.id).replace(
            "<~~{importPath}~~>",
            id
          );

          islandHashes[island.id] = djb2(clientTemplate);

          serverCode = serverCode.replace(
            `<~{${island.id}}~>`,
            "/" +
            join(
              islandsDir,
              island.id + "-" + islandHashes[island.id] + ".js"
            )
          );

          await writeFile(join(islandsDir, island.id + ".js"), clientTemplate);
        })
      );

      const newIslandEntries = islands.reduce((acc, d) => {
        acc[`${d.id}-${islandHashes[d.id]}`] = join(islandsDir, `${d.id}.js`);
        return acc;
      }, {})

      Object.assign(
        islandEntries,
        newIslandEntries
      );

      return {
        code: serverCode,
        map: null,
      };
    },
  };
}
