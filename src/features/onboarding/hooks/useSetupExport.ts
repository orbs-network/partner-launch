import { downloadSetup } from "../setup-download";
import { useOnboardingStore } from "../store";

export function useSetupExport() {
  const draft = useOnboardingStore();

  function download() {
    downloadSetup(useOnboardingStore.getState());
  }

  return { draft, download };
}
