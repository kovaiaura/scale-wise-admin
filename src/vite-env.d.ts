/// <reference types="vite/client" />

// Tauri API types
interface Window {
  __TAURI__?: {
    invoke: <T = any>(cmd: string, args?: any) => Promise<T>;
    tauri: any;
  };
}
