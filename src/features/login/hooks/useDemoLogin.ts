import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { useAccount, useConfig, useSignMessage } from "wagmi";
import { getAccount, watchAccount } from "wagmi/actions";
import { verifyMessage } from "viem";
import { useMountedRef } from "../../../hooks/useMountedRef";
import { createLoginMessage } from "../login-message";
import { clearLoginSession, hasLoginSession, readLoginSession, saveLoginSession, verifyLoginSession } from "../login-session";
import type { LoginSession } from "../login-session";
import { useLoginConnection } from "./useLoginConnection";

export const LOGIN_TOAST_ID = "login";

/** A verified demo session, restored from this tab's signed proof on refresh. */
export function useDemoLogin(onSuccess: () => void) {
  const config = useConfig();
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const walletConnecting = isConnecting || isReconnecting;
  const { signMessageAsync } = useSignMessage();
  const [session, setSession] = useState<LoginSession | null>(null);
  const [signing, setSigning] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [phase, setPhase] = useState<"signature" | "verification">("signature");
  const [error, setError] = useState("");
  const mountedRef = useMountedRef();
  const operationInFlightRef = useRef(false);
  const generationRef = useRef(0);

  useEffect(() => () => { toast.dismiss(LOGIN_TOAST_ID); }, []);

  useEffect(() => {
    let active = true;
    let restoringGeneration: number | undefined;
    async function restore() {
      const account = getAccount(config);
      if (account.status === "connecting" || account.status === "reconnecting") {
        // Without a saved proof there is no session to wait for: show setup right away.
        if (!hasLoginSession() && !operationInFlightRef.current) setRestoring(false);
        return;
      }
      if (account.status !== "connected" || !account.address) {
        setRestoring(false);
        return;
      }
      if (operationInFlightRef.current) return;
      const proof = readLoginSession(account.address, window.location.origin);
      if (!proof) {
        setRestoring(false);
        return;
      }
      const generation = generationRef.current;
      restoringGeneration = generation;
      operationInFlightRef.current = true;
      setRestoring(true);
      try {
        const verified = await verifyLoginSession(proof);
        const live = getAccount(config);
        if (!active || generation !== generationRef.current || live.status !== "connected" || live.address?.toLowerCase() !== proof.address.toLowerCase()) return;
        if (!verified) { clearLoginSession(); return; }
        setSession(proof);
        // Restore authentication without leaving the initial setup page.
      } finally {
        if (active && generation === generationRef.current) {
          operationInFlightRef.current = false;
          restoringGeneration = undefined;
          setRestoring(false);
        }
      }
    }
    const unwatch = watchAccount(config, { onChange(next, prior) {
      if (
        (prior.address && prior.address.toLowerCase() !== next.address?.toLowerCase()) ||
        (prior.isConnected && !next.isConnected)
      ) {
        const wasPending = operationInFlightRef.current;
        generationRef.current += 1;
        operationInFlightRef.current = false;
        setSigning(false);
        setRestoring(false);
        setSession(null);
        clearLoginSession();
        if (wasPending)
          setError("Your wallet changed. Please log in again.");
      }
      if (next.status !== prior.status && (next.status === "connected" || next.status === "disconnected")) void restore();
    } });
    void restore();
    return () => {
      active = false;
      unwatch();
      if (restoringGeneration === generationRef.current) operationInFlightRef.current = false;
    };
  }, [config]);

  async function signIn() {
    const account = getAccount(config);
    if (account.status !== "connected" || !account.address) {
      operationInFlightRef.current = false;
      setError(account.status === "connecting" || account.status === "reconnecting"
        ? "Your wallet is still connecting. Please try again in a moment."
        : "Connect your wallet to log in.");
      return;
    }
    const signer = account.address;
    const generation = generationRef.current;
    const assertCurrent = () => {
      const live = getAccount(config);
      if (
        !mountedRef.current ||
        generationRef.current !== generation ||
        live.status !== "connected" ||
        live.address?.toLowerCase() !== signer.toLowerCase()
      ) throw new Error("Your wallet changed. Please log in again.");
    };
    setSigning(true);
    setPhase("signature");
    setError("");
    try {
      assertCurrent();
      const details = {
        address: signer,
        origin: window.location.origin,
        signedAt: new Date().toISOString(),
        nonce: crypto.randomUUID(),
      };
      const message = createLoginMessage(details);
      const signature = await signMessageAsync({ account: signer, message });
      assertCurrent();
      setPhase("verification");
      const verified = await verifyMessage({ address: signer, message, signature });
      assertCurrent();
      if (!verified) throw new Error("We couldn’t verify your signature. Please try again.");
      const proof: LoginSession = { ...details, version: 1, signature };
      const saved = saveLoginSession(proof);
      setSession(proof);
      toast.success("Logged in", {
        id: LOGIN_TOAST_ID,
        description: saved ? "Your workspace is open." : "Your browser couldn’t save this login. Refreshing will require another signature.",
        action: undefined,
      });
      onSuccess();
    } catch (cause) {
      if (!mountedRef.current || generationRef.current !== generation) return;
      const message = cause instanceof Error ? cause.message : "";
      setError(/reject|denied|cancelled|canceled/i.test(message)
        ? "You cancelled the login request. You can try again."
        : message.split("\n")[0].slice(0, 180) || "We couldn’t log you in. Please try again.");
    } finally {
      if (generationRef.current === generation) {
        operationInFlightRef.current = false;
        if (mountedRef.current) setSigning(false);
      }
    }
  }
  const { requestLogin, cancelLogin, awaitingConnection } = useLoginConnection({
    operationInFlightRef,
    onLogin: () => { void signIn(); },
    onError: setError,
  });
  const isLoggedIn = !!session && isConnected && session.address.toLowerCase() === address?.toLowerCase();
  function login() {
    if (operationInFlightRef.current) return;
    const account = getAccount(config);
    if (account.status === "connecting" || account.status === "reconnecting") {
      setError("Your wallet is still connecting. Please try again in a moment.");
      return;
    }
    if (isLoggedIn) { onSuccess(); return; }
    operationInFlightRef.current = true;
    setError("");
    setPhase("signature");
    requestLogin();
  }
  function logout() {
    generationRef.current += 1;
    cancelLogin();
    setSigning(false);
    setRestoring(false);
    setSession(null);
    clearLoginSession();
    setError("");
    toast.dismiss(LOGIN_TOAST_ID);
  }
  return {
    address, isConnected, walletConnecting, isLoggedIn, busy: signing || restoring || awaitingConnection, signing, restoring,
    phase, error, login, logout, session: isLoggedIn ? session : null,
  };
}

export type DemoLogin = ReturnType<typeof useDemoLogin>;
