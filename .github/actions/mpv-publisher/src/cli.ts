import { publishDocumentation } from "./core.js";

function arg(name: string, fallback?: string) {
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1] ?? fallback;
  return fallback;
}

publishDocumentation({
  publicationConfigPath: arg("publication-config", ".mpv/publication.json"),
  buildId: arg("build-id", process.env.MPV_BUILD_ID),
  artifactDir: arg("artifact-dir", "public"),
  siteDir: arg("site-dir", process.cwd()),
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
