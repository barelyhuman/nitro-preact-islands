import transformJSX from "@babel/plugin-transform-react-jsx";
import {
  findIslands,
  generateClientTemplate,
  injectIslandAST,
  isFunctionIsland,
  readSourceFile,
} from "@dumbjs/preland";
import { addImportToAST, codeFromAST } from "@dumbjs/preland/ast";
import babel from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import jsx from "acorn-jsx";
import fs, { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import resolvePackagePath from "resolve-package-path";

import { dirname, join, resolve } from "node:path";
import { rollup } from "rollup";

/**
 * @returns {import("rollup").Plugin}
 */
export function rollupPlugin(options) {
  let islandsDir = join(".islands");
  return {
    name: "nitro-preland",
    enforce: "pre",
    async generateBundle() {
      const loadOptions = await getLoadOption();
      const presetOptions = await loadOptions();
      const files = await readdir(islandsDir);
      let baseDist;
      for (let asset of presetOptions.publicAssets) {
        if (asset.dir != resolve(islandsDir)) continue;
        baseDist = join(presetOptions.output.publicDir, asset.baseURL);
      }
      await files.reduce((acc, item) => {
        return acc.then(() => {
          const src = join(islandsDir, item);
          const dst = join(baseDist, item);
          if (!existsSync(dst)) {
            return fs.promises.cp(src, dst);
          }
          return false;
        });
      }, Promise.resolve());
    },
    async transform(_, id) {
      if (id.includes("virtual:")) return;
      // ignore files that don't exist
      if (!existsSync(id)) return;

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

      await mkdir(join(".islands"), {
        recursive: true,
      });

      await Promise.all(
        islands.map(async (island) => {
          const clientTemplate = generateClientTemplate(island.id).replace(
            "<~~{importPath}~~>",
            id
          );
          serverCode = serverCode.replace(
            `<~{${island.id}}~>`,
            join(islandsDir, island.id + ".js")
          );
          await writeFile(join(islandsDir, island.id + ".js"), clientTemplate);
        })
      );

      const clientsToCreate = Object.fromEntries(
        islands.map((d) => [d.id, join(islandsDir, d.id + ".js")])
      );

      const builder = await rollup({
        input: clientsToCreate,
        plugins: [
          nodeResolve(),
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
          }),
        ],
        acornInjectPlugins: [jsx()],
      });

      await builder.write({
        format: "es",
        dir: islandsDir,
        entryFileNames: "[name].js",
      });

      return {
        code: serverCode,
        map: null,
      };
    },
  };
}

async function getLoadOption() {
  const pkgPath = resolvePackagePath("nitropack", process.cwd());
  const module = await import(join(dirname(pkgPath), "dist/nitro.mjs"));

  for (let k of Object.keys(module)) {
    if (typeof module[k] != "function") continue;
    if (module[k].name != "loadOptions") continue;
    return module[k];
  }
}
