/** Keep the same unguessable submission identity while an unchanged request is retried. */
export function createRequestAttempt() {
  let current: { scope: string; requestId: string; accessToken: string } | undefined;
  return (scope: string) => {
    if (!current || current.scope !== scope) {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      current = { scope, requestId: crypto.randomUUID(), accessToken: Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("") };
    }
    return { requestId: current.requestId, accessToken: current.accessToken };
  };
}
