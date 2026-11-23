import type { StateStorage } from "zustand/middleware";

const memoryStorage = new Map<string, string>();
let storageAvailable = true;

export const safeStorage: StateStorage = {
  getItem(key) {
    try {
      const value = globalThis.localStorage.getItem(key);
      storageAvailable = true;
      return value ?? memoryStorage.get(key) ?? null;
    } catch {
      storageAvailable = false;
      return memoryStorage.get(key) ?? null;
    }
  },
  setItem(key, value) {
    memoryStorage.set(key, value);
    try {
      globalThis.localStorage.setItem(key, value);
      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }
  },
  removeItem(key) {
    memoryStorage.delete(key);
    try {
      globalThis.localStorage.removeItem(key);
    } catch {
      storageAvailable = false;
    }
  },
};

export function getStorageAvailable(): boolean {
  return storageAvailable;
}
