import { publishDocumentation } from "./core.js";

function input(name: string, fallback = "") {
  return process.env[`INPUT_${name.toUpperCase().replace(/-/g, "_")}`] ?? fallback;
}

publishDocumentation({
  publicationConfigPath: input("publication-config", ".mpv/publication.json"),
  buildId: input("build-id"),
  artifactDir: "mpv-pages-artifact",
}).then((result) => {
  console.log(`::notice::Built publication ${input("build-id")} at ${result.artifactDir}`);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
