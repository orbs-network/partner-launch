import { useEffect, useRef } from "react";

/** Prevent asynchronous workflows from updating an unmounted interface. */
export function useMountedRef() {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}
