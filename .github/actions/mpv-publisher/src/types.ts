export type TemplateManifest = {
  schemaVersion: 1;
  engine: string;
  adapterKey: string;
  content: { docsTarget: string; staticTarget?: string };
  build: { packageManager?: string; installCommand?: string; buildCommand?: string; outputDir: string };
  runtimeConfig?: Record<string, string>;
};

export type PublicationConfig = {
  schemaVersion: 1;
  site: { id: string; name: string; slug: string };
  portal: { id: string; name: string; slug: string; url: string };
  content: { docsSourcePath: string; staticSourcePath?: string | null };
  template: { id: string; repository: string; ref: string; path: string; localPath?: string | null; adapterKey: string };
  publication: { title: string; siteUrl: string; basePath: string; autoPublishOnPush: boolean };
};

export type AdapterInput = {
  siteDir: string;
  templateDir: string;
  manifest: TemplateManifest;
  publication: PublicationConfig;
};

export interface DocumentationEngineAdapter {
  key: string;
  materialize(input: AdapterInput): Promise<void>;
}
