import { useImperativeHandle, useRef, type Ref } from "react";

// Object refs bridge the primitive's React types; React manages callback cleanup.
export function usePrimitiveRef<T>(ref: Ref<T> | undefined) {
  const primitiveRef = useRef<T | null>(null);
  useImperativeHandle<T | null, T | null>(ref, () => primitiveRef.current);
  return primitiveRef;
}
