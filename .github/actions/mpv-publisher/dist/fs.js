import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
export function resolveInside(root, relativePath) {
    const resolved = path.resolve(root, relativePath.replace(/^\//, ""));
    const normalizedRoot = path.resolve(root);
    if (resolved !== normalizedRoot && !resolved.startsWith(`${normalizedRoot}${path.sep}`)) {
        throw new Error(`Path escapes workspace: ${relativePath}`);
    }
    return resolved;
}
export async function replaceDirectory(source, target) {
    await rm(target, { recursive: true, force: true });
    await mkdir(path.dirname(target), { recursive: true });
    await cp(source, target, { recursive: true, force: true });
}
export async function mergeDirectory(source, target) {
    await mkdir(target, { recursive: true });
    await cp(source, target, { recursive: true, force: true });
}
