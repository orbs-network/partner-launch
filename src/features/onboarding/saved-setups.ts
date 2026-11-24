import { keccak256, stringToHex, type Address } from "viem";
import { sanitizeDraft, selectDraft } from "./state/hydration";
import type { OnboardingDraft } from "./state/types";
import { getFundingSigner } from "./placeholder-funding";
import { hasSetupRequestReceipt } from "./setup-request-receipt";

function setupOwner(draft: OnboardingDraft): Address | undefined {
  return (hasSetupRequestReceipt(draft) && draft.setupRequestReceipt?.verification === "unsigned" ? draft.setupRequestReceipt.ownerWallet : undefined) ??
    draft.setupSubmission?.address ?? getFundingSigner(draft);
}

export interface SavedSetup {
  id: string;
  savedAt: string;
  draft: OnboardingDraft;
}

// These snapshots exist only while this page is open. No completed setup is read
// from or written to browser storage.
const pageSetups = new Map<string, Map<string, string>>();

function walletKey(address: Address): string {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw new Error("Invalid wallet address.");
  return address.toLowerCase();
}

function completedSnapshot(value: unknown, owner?: Address): OnboardingDraft {
  const draft = sanitizeDraft(value);
  const signer = setupOwner(draft);
  if (!draft.completed || !signer ||
    (owner && signer.toLowerCase() !== owner.toLowerCase())) {
    throw new Error("Only a completed setup can be saved to its wallet workspace.");
  }
  return draft;
}

function snapshotId(draft: OnboardingDraft): string {
  return keccak256(stringToHex(JSON.stringify(draft)));
}

function readSetup(raw: string, address: Address, id: string): SavedSetup {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object" || !("version" in data) || data.version !== 1 ||
    !("id" in data) || data.id !== id || !("savedAt" in data) || typeof data.savedAt !== "string" ||
    !Number.isFinite(Date.parse(data.savedAt)) || !("draft" in data)) throw new Error("Saved setup is unreadable.");
  const draft = completedSnapshot(data.draft, address);
  if (snapshotId(draft) !== id) throw new Error("Saved setup does not match its record.");
  return { id, savedAt: data.savedAt, draft };
}

export function loadSavedSetups(address: Address): SavedSetup[] {
  const setups = pageSetups.get(walletKey(address));
  return [...(setups ?? [])]
    .map(([id, raw]) => readSetup(raw, address, id))
    .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
}

/** Retain a detached, immutable completed snapshot for this page only. */
export function rememberCompletedSetup(draft: OnboardingDraft): SavedSetup {
  const snapshot = completedSnapshot(selectDraft(draft));
  const owner = setupOwner(snapshot)!;
  const id = snapshotId(snapshot);
  const key = walletKey(owner);
  const setups = pageSetups.get(key) ?? new Map<string, string>();
  const prior = setups.get(id);
  if (prior) return readSetup(prior, owner, id);
  const saved: SavedSetup = { id, savedAt: new Date().toISOString(), draft: snapshot };
  const serialized = JSON.stringify({ version: 1, ...saved });
  setups.set(id, serialized);
  pageSetups.set(key, setups);
  return saved;
}
