import { beforeEach } from "vitest";

const store = new Map<string, string>();

const localStorageMock = {
  getItem(key: string): string | null {
    return store.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    store.set(key, value);
  },
  removeItem(key: string): void {
    store.delete(key);
  },
  clear(): void {
    store.clear();
  },
  get length(): number {
    return store.size;
  },
  key(index: number): string | null {
    return [...store.keys()][index] ?? null;
  },
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

beforeEach(() => {
  store.clear();
});
