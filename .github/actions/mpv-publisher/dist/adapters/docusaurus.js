import { access, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { mergeDirectory, replaceDirectory, resolveInside } from "../fs.js";
async function exists(file) {
    try {
        await access(file);
        return true;
    }
    catch {
        return false;
    }
}
const markdownExtensions = new Set([".md", ".mdx"]);
const admonitionTypes = "note|tip|info|warning|caution|danger";
function parseFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match)
        return { frontmatter: null, body: content };
    const frontmatter = {};
    for (const line of match[1].split(/\r?\n/)) {
        const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (field)
            frontmatter[field[1]] = field[2].trim();
    }
    return { frontmatter, body: content.slice(match[0].length) };
}
function serializeFrontmatter(frontmatter, body) {
    const entries = Object.entries(frontmatter).filter(([, value]) => value !== "");
    if (entries.length === 0)
        return body;
    return ["---", ...entries.map(([key, value]) => `${key}: ${value}`), "---", "", body].join("\n");
}
function materializeDocusaurusFrontmatter(frontmatter) {
    const next = {};
    for (const [key, value] of Object.entries(frontmatter)) {
        if (["label", "order", "hidden"].includes(key))
            continue;
        next[key] = value;
    }
    if (frontmatter.label)
        next.sidebar_label = frontmatter.label;
    if (frontmatter.order)
        next.sidebar_position = frontmatter.order;
    if (frontmatter.hidden === "true")
        next.unlisted = "true";
    return next;
}
function materializeDocusaurusMarkdown(content) {
    const { frontmatter, body } = parseFrontmatter(content);
    const normalizedBody = body.replace(new RegExp(`^:::\\s+(${admonitionTypes})(\\[[^\\]]+\\])?\\s*$`, "gim"), ":::$1$2");
    if (!frontmatter)
        return normalizedBody;
    return serializeFrontmatter(materializeDocusaurusFrontmatter(frontmatter), normalizedBody);
}
async function materializeDocusaurusMarkdownFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    await Promise.all(entries.map(async (entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            await materializeDocusaurusMarkdownFiles(entryPath);
            return;
        }
        if (!entry.isFile() || !markdownExtensions.has(path.extname(entry.name)))
            return;
        const content = await readFile(entryPath, "utf8");
        await writeFile(entryPath, materializeDocusaurusMarkdown(content));
    }));
}
export const docusaurusAdapter = {
    key: "docusaurus",
    async materialize({ siteDir, templateDir, manifest, publication }) {
        const docsSource = resolveInside(siteDir, publication.content.docsSourcePath);
        const docsTarget = resolveInside(templateDir, manifest.content.docsTarget);
        await replaceDirectory(docsSource, docsTarget);
        await materializeDocusaurusMarkdownFiles(docsTarget);
        if (publication.content.staticSourcePath && manifest.content.staticTarget) {
            const staticSource = resolveInside(siteDir, publication.content.staticSourcePath);
            if (await exists(staticSource))
                await mergeDirectory(staticSource, resolveInside(templateDir, manifest.content.staticTarget));
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
