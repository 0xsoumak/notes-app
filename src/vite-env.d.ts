/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GitHub account that owns the notes repository. See `.env.example`. */
  readonly VITE_GITHUB_OWNER: string
  /** Repository the notes are stored in. See `.env.example`. */
  readonly VITE_GITHUB_REPO: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
