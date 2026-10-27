declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** sandboxed showcase build: no service worker, no file downloads (.env.showcase) */
  readonly VITE_SHOWCASE?: string;
  /** shared demo builds: one-tap demo data on the first screen and the demo switch in Meira */
  readonly VITE_DEMO?: string;
}
