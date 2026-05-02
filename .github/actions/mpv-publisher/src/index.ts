import { cp, rm, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync, execSync } from "node:child_process";
import { docusaurusAdapter } from "./adapters/docusaurus.js";
import { fumadocsAdapter } from "./adapters/fumadocs.js";
import type { DocumentationEngineAdapter, PublicationConfig, TemplateManifest } from "./types.js";

const adapters = new Map<string, DocumentationEngineAdapter>([
  [docusaurusAdapter.key, docusaurusAdapter],
  [fumadocsAdapter.key, fumadocsAdapter],
]);

function input(name: string, fallback = "") {
  return process.env[`INPUT_${name.toUpperCase().replace(/-/g, "_")}`] ?? fallback;
}

function run(command: string, cwd: string) {
  execSync(command, { cwd, stdio: "inherit", env: process.env, shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash" });
}

function assertManifest(value: any): TemplateManifest {
  if (value?.schemaVersion !== 1) throw new Error("Unsupported docs-template.json schemaVersion");
  if (!value.adapterKey || !value.content?.docsTarget || !value.build?.outputDir) throw new Error("Invalid docs-template.json");
  return value;
}

function assertPublication(value: any): PublicationConfig {
  if (value?.schemaVersion !== 1) throw new Error("Unsupported publication.json schemaVersion");
  if (!value.template?.repository || !value.template?.ref || !value.content?.docsSourcePath) throw new Error("Invalid publication config");
  return value;
}

async function main() {
  const configPath = input("publication-config", ".mpv/publication.json");
  const publication = assertPublication(JSON.parse(await readFile(configPath, "utf8")));
  const adapter = adapters.get(publication.template.adapterKey);
  if (!adapter) throw new Error(`Unsupported adapter: ${publication.template.adapterKey}`);

  const workspace = await mkdtemp(path.join(tmpdir(), "mpv-publisher-"));
  const templateDir = path.join(workspace, "template");
  const templateRoot = publication.template.localPath
    ? path.resolve(process.cwd(), publication.template.localPath)
    : path.resolve(templateDir, publication.template.path ?? ".");
  if (!publication.template.localPath) {
    execFileSync("git", ["clone", "--depth", "1", "--branch", publication.template.ref, `https://github.com/${publication.template.repository}.git`, templateDir], { stdio: "inherit" });
  }

  const manifest = assertManifest(JSON.parse(await readFile(path.join(templateRoot, "docs-template.json"), "utf8")));
  if (manifest.adapterKey !== adapter.key) throw new Error(`Template adapter ${manifest.adapterKey} does not match publication adapter ${adapter.key}`);

  await adapter.materialize({ siteDir: process.cwd(), templateDir: templateRoot, manifest, publication });
  process.env.DOCS_TITLE = publication.publication.title;
  process.env.DOCS_SITE_URL = publication.publication.siteUrl;
  process.env.DOCS_BASE_PATH = publication.publication.basePath;
  process.env.DOCS_PORTAL_NAME = publication.portal.name;
  process.env.DOCS_PORTAL_URL = publication.portal.url;
  run(manifest.build.installCommand ?? "npm ci", templateRoot);
  run(manifest.build.buildCommand ?? "npm run build", templateRoot);

  const outputDir = path.resolve(templateRoot, manifest.build.outputDir);
  const artifactDir = path.join(process.cwd(), "mpv-pages-artifact");
  await rm(artifactDir, { recursive: true, force: true });
  await cp(outputDir, artifactDir, { recursive: true, force: true });
  console.log(`::notice::Built publication ${input("build-id")} at ${artifactDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
