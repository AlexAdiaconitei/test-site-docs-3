import { access, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Dirent } from "node:fs";
import type { DocumentationEngineAdapter } from "../types.js";
import { mergeDirectory, replaceDirectory, resolveInside } from "../fs.js";

async function exists(file: string) {
  try { await access(file); return true; } catch { return false; }
}

type Frontmatter = Record<string, string>;
type PageInfo = {
  name: string;
  order: number;
  label?: string;
  title?: string;
  hidden: boolean;
  isIndex: boolean;
};

type DirectoryInfo = {
  dir: string;
  name: string;
  order: number;
  label?: string;
  title?: string;
  pages: PageInfo[];
  children: DirectoryInfo[];
  hasVisibleContent: boolean;
};

const markdownExtensions = new Set([".md", ".mdx"]);
const metaFileName = "meta.json";
const admonitionTypes = "note|tip|info|warning|caution|danger";

function parseFrontmatter(content: string): { frontmatter: Frontmatter | null; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: null, body: content };

  const frontmatter: Frontmatter = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (field) frontmatter[field[1]!] = field[2]!.trim();
  }

  return { frontmatter, body: content.slice(match[0].length) };
}

function serializeFrontmatter(frontmatter: Frontmatter, body: string) {
  const entries = Object.entries(frontmatter).filter(([, value]) => value !== "");
  if (entries.length === 0) return body;
  return ["---", ...entries.map(([key, value]) => `${key}: ${value}`), "---", "", body].join("\n");
}

function normalizeAdmonitions(body: string) {
  return body.replace(
    new RegExp(`^:::\\s+(${admonitionTypes})(\\[[^\\]]+\\])?\\s*$`, "gim"),
    ":::$1$2",
  );
}

function materializeFumadocsFrontmatter(frontmatter: Frontmatter) {
  const next: Frontmatter = {};

  for (const [key, value] of Object.entries(frontmatter)) {
    if (["label", "order", "hidden"].includes(key)) continue;
    next[key] = value;
  }

  return next;
}

function parseOrder(value: string | undefined) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const parsed = Number(value.replace(/^['\"]|['\"]$/g, ""));
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function parseBoolean(value: string | undefined) {
  return value?.replace(/^['\"]|['\"]$/g, "").toLowerCase() === "true";
}

function pageName(fileName: string) {
  return path.basename(fileName, path.extname(fileName));
}

async function materializeMarkdownFile(file: string) {
  const content = await readFile(file, "utf8");
  const { frontmatter, body } = parseFrontmatter(content);
  const normalizedBody = normalizeAdmonitions(body);

  if (!frontmatter) {
    await writeFile(file, normalizedBody);
    return null;
  }

  await writeFile(file, serializeFrontmatter(materializeFumadocsFrontmatter(frontmatter), normalizedBody));

  return {
    name: pageName(path.basename(file)),
    order: parseOrder(frontmatter.order),
    label: frontmatter.label,
    title: frontmatter.title,
    hidden: parseBoolean(frontmatter.hidden),
    isIndex: pageName(path.basename(file)) === "index",
  } satisfies PageInfo;
}

async function materializeDirectory(directory: string): Promise<DirectoryInfo> {
  const entries: Dirent[] = await readdir(directory, { withFileTypes: true });
  const pages: PageInfo[] = [];
  const children: DirectoryInfo[] = [];

  await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      children.push(await materializeDirectory(entryPath));
      return;
    }

    if (!entry.isFile() || !markdownExtensions.has(path.extname(entry.name))) return;
    const page = await materializeMarkdownFile(entryPath);
    if (page) pages.push(page);
  }));

  const indexPage = pages.find((page) => page.isIndex);
  const visiblePages = pages.filter((page) => !page.hidden).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const visibleChildren = children.filter((child) => child.hasVisibleContent).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const metaPages = [
    ...visiblePages.map((page) => page.name),
    ...visibleChildren.map((child) => child.name),
  ];

  if (metaPages.length > 0) {
    const meta: { title?: string; pages: string[] } = { pages: metaPages };
    if (indexPage?.label || indexPage?.title) meta.title = indexPage.label ?? indexPage.title;
    await writeFile(path.join(directory, metaFileName), `${JSON.stringify(meta, null, 2)}\n`);
  }

  return {
    dir: directory,
    name: path.basename(directory),
    order: indexPage?.order ?? Number.MAX_SAFE_INTEGER,
    label: indexPage?.label,
    title: indexPage?.title,
    pages,
    children,
    hasVisibleContent: visiblePages.length > 0 || visibleChildren.length > 0,
  };
}

export const fumadocsAdapter: DocumentationEngineAdapter = {
  key: "fumadocs",
  async materialize({ siteDir, templateDir, manifest, publication }) {
    const docsSource = resolveInside(siteDir, publication.content.docsSourcePath);
    const docsTarget = resolveInside(templateDir, manifest.content.docsTarget);
    await replaceDirectory(docsSource, docsTarget);
    await materializeDirectory(docsTarget);

    if (publication.content.staticSourcePath && manifest.content.staticTarget) {
      const staticSource = resolveInside(siteDir, publication.content.staticSourcePath);
      if (await exists(staticSource)) await mergeDirectory(staticSource, resolveInside(templateDir, manifest.content.staticTarget));
    }

    const envFile = path.join(templateDir, ".env.production");
    await writeFile(envFile, [
      `DOCS_TITLE=${JSON.stringify(publication.publication.title)}`,
      `DOCS_SITE_URL=${JSON.stringify(publication.publication.siteUrl)}`,
      `DOCS_BASE_PATH=${JSON.stringify(publication.publication.basePath)}`,
      `DOCS_PORTAL_NAME=${JSON.stringify(publication.portal.name)}`,
      `DOCS_PORTAL_URL=${JSON.stringify(publication.portal.url)}`,
      "",
    ].join("\n"));
  },
};
