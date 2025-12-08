import '@testing-library/jest-dom';

// Mock Tauri APIs for testing
const mockTauriApis = {
  path: {
    homeDir: async () => '/mock/home',
    join: async (...parts: string[]) => parts.join('/'),
  },
  fs: {
    exists: async () => false,
    mkdir: async () => {},
    readTextFile: async () => '',
    writeTextFile: async () => {},
    readDir: async () => [],
    remove: async () => {},
    rename: async () => {},
  },
  clipboard: {
    writeText: async () => {},
    readText: async () => '',
  },
  globalShortcut: {
    register: async () => {},
    unregister: async () => {},
    isRegistered: async () => false,
  },
};

// @ts-expect-error - mocking module
globalThis.__TAURI__ = mockTauriApis;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
