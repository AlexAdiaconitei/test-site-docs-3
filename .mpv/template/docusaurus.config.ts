import type { Config } from "@docusaurus/types";
import type { Preset } from "@docusaurus/preset-classic";

const siteTitle = process.env.DOCS_TITLE ?? "Documentation";
const portalName = process.env.DOCS_PORTAL_NAME ?? siteTitle;
const portalUrl = process.env.DOCS_PORTAL_URL ?? "/";

const config: Config = {
  title: siteTitle,
  tagline: process.env.DOCS_TAGLINE ?? "Documentation site",
  favicon: "img/favicon.ico",
  url: process.env.DOCS_SITE_URL ?? "https://example.com",
  baseUrl: process.env.DOCS_BASE_PATH ?? "/",
  organizationName: process.env.DOCS_ORG_NAME ?? "mpv",
  projectName: process.env.DOCS_PROJECT_NAME ?? "docs",
  future: {
    v4: true,
  },
  trailingSlash: true,
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  i18n: { defaultLocale: "es", locales: ["es"] },
  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
        },
        blog: false,
        theme: { customCss: "./src/css/custom.css" },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: portalName,
      logo: {
        alt: portalName,
        src: "img/logo.svg",
        href: portalUrl,
        target: "_self",
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
