import { toast } from "sonner";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMountedRef } from "@/hooks/useMountedRef";
import type { WorkspaceContext } from "@/types/workspace";
import { selectablePerpsChains } from "../../../config/chains";
import {
  normalizePartnerProfile,
  validatePartnerProfile,
  type PartnerProfile,
  type ProfileErrors,
} from "../profile";
import { loadPartnerProfile, savePartnerProfile } from "../profile-storage";

interface EditorState {
  owner: string;
  revision: string;
  profile: PartnerProfile;
  baseline: PartnerProfile;
  errors: ProfileErrors;
  saved: boolean;
  saveError: string;
}

function editorOwner(address: `0x${string}`, workspace?: WorkspaceContext) {
  return JSON.stringify([address.toLowerCase(), workspace?.key ?? null]);
}

function isDirty(state: EditorState) {
  return JSON.stringify(state.profile) !== JSON.stringify(state.baseline);
}

function initialEditor(address: `0x${string}`, workspace?: WorkspaceContext): EditorState {
  const profile = loadPartnerProfile(address, workspace);
  return {
    owner: editorOwner(address, workspace), revision: workspace?.revision ?? "", profile, baseline: profile,
    errors: {}, saved: false, saveError: "",
  };
}

export function usePartnerSettings(address: `0x${string}`, workspace?: WorkspaceContext) {
  const owner = editorOwner(address, workspace);
  const revision = workspace?.revision ?? "";
  const toastId = `partner-settings:${owner}`;
  const mounted = useMountedRef();
  const liveOwner = useRef(owner);
  useLayoutEffect(() => { liveOwner.current = owner; }, [owner]);
  useEffect(() => () => { toast.dismiss(toastId); }, [toastId]);
  const [state, setState] = useState(() => initialEditor(address, workspace));
  // Switch identities before commit; refresh saved defaults only while no edits can be lost.
  if (state.owner !== owner || (state.revision !== revision && !isDirty(state)))
    setState(initialEditor(address, workspace));
  const current = () => mounted.current && liveOwner.current === owner && state.owner === owner;

  function edit(profile: PartnerProfile) {
    if (!current()) return;
    toast.dismiss(toastId);
    setState((current) => current.owner !== owner ? current : {
      ...current, profile, errors: {}, saved: false, saveError: "",
    });
  }

  function save() {
    if (!current()) return;
    const profile = state.profile;
    const errors = validatePartnerProfile(profile);
    if (Object.keys(errors).length) {
      setState((current) => current.owner !== owner ? current : { ...current, errors, saved: false });
      return;
    }
    try {
      const saved = savePartnerProfile(address, normalizePartnerProfile(profile, workspace), workspace);
      setState((current) => current.owner !== owner ? current : {
        ...current, revision, profile: saved, baseline: saved, errors: {}, saved: true, saveError: "",
      });
      toast.success("Changes saved", { id: toastId, description: "Your settings are saved in this browser." });
    } catch {
      setState((current) => current.owner !== owner ? current : {
        ...current, profile, saved: false,
        saveError: "We couldn’t save your changes in this browser. Please try again.",
      });
      toast.error("We couldn’t save your changes", { id: toastId, description: "Browser storage is unavailable. Please try again." });
    }
  }

  return {
    profile: state.profile,
    errors: state.errors,
    dirty: isDirty(state),
    saved: state.saved,
    saveError: state.saveError,
    toggleChain(id: number) {
      if (!selectablePerpsChains.some((chain) => chain.id === id)) return;
      edit({
        ...state.profile,
        chainIds: [id],
      });
    },
    save,
  };
}
