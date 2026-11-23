import type { PersistStorage, StorageValue } from "zustand/middleware";
import type { OnboardingDraft } from "./types";

type StoredDraft = StorageValue<OnboardingDraft>;

function isPending(value: StoredDraft | null | PromiseLike<StoredDraft | null>): value is PromiseLike<StoredDraft | null> {
  return value !== null && typeof value === "object" && "then" in value && typeof value.then === "function";
}

/** Only the active wizard uses this adapter; completed workspace snapshots keep their own serializer. */
export function createActiveDraftStorage(storage: PersistStorage<OnboardingDraft> | undefined): PersistStorage<OnboardingDraft> | undefined {
  if (!storage) return;
  const backing = storage;
  function unfinished(name: string, value: StoredDraft | null): StoredDraft | null {
    if (value?.state?.completed !== true) return value;
    // Also discard completed active drafts written before completion stopped persisting.
    backing.removeItem(name);
    return null;
  }
  return {
    getItem(name) {
      const value = backing.getItem(name);
      return isPending(value) ? Promise.resolve(value).then(stored => unfinished(name, stored)) : unfinished(name, value);
    },
    setItem(name, value) {
      // The live store keeps the completed draft; only its persisted active copy is removed.
      return value.state.completed === true ? backing.removeItem(name) : backing.setItem(name, value);
    },
    removeItem: name => backing.removeItem(name),
  };
}
