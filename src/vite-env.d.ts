/// <reference types="vite/client" />
/// <reference types="phaser" />
/// <reference types="matter-js" />

declare global {
  interface Window {
    Phaser: typeof Phaser;
  }
}

export {};
