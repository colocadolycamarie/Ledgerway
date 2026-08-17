import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rm } from "node:fs/promises";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";

// esbuild-plugin-pino resolves dependencies with `require`.
globalThis.require = createRequire(import.meta.url);

const appDir = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const distDir = path.resolve(appDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  await esbuild({
    entryPoints: [path.resolve(appDir, "src/index.ts")],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    sourcemap: "linked",
    // Native/CJS-quirky packages that esbuild can't safely bundle.
    external: ["pg-native"],
    plugins: [
      // pino ships its transports as worker files; bundling breaks that, so
      // this plugin keeps pino-pretty working from the bundled output.
      esbuildPluginPino({ transports: ["pino-pretty"] }),
    ],
    // express and other CJS deps expect `require`/`__dirname` at runtime.
    banner: {
      js: `import { createRequire as __bannerCreateRequire } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';
globalThis.require = __bannerCreateRequire(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);`,
    },
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
