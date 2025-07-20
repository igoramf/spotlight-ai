/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_OPENAI_API_KEY: string
  readonly VITE_AZURE_BASE_URL: string
  readonly VITE_AZURE_OPENAI_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  electronAPI: {
    setContentProtection: (flag: boolean) => Promise<boolean>;
    getContentProtectionStatus: () => Promise<boolean>;
    takeScreenshot: () => Promise<string>;
  };
}
