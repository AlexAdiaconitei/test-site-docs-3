import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

function normalizeBasePath(value) {
  if (!value || value === '/') return undefined;
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.replace(/\/$/, '');
}

const basePath = normalizeBasePath(process.env.DOCS_BASE_PATH);

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
  images: { unoptimized: true },
};

export default withMDX(config);
