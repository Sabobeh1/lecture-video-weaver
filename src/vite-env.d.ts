
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SSH_HOST: string;
  readonly VITE_SSH_PORT: string;
  readonly VITE_SSH_USER: string;
  readonly VITE_SSH_TARGET_DIR: string;
  readonly VITE_SSH_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
