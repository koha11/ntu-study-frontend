/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GOOGLE_REDIRECT_URI: string;
  readonly VITE_GOOGLE_HD?: string;
  readonly VITE_CANVA_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
