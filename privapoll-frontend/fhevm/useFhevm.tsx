"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FhevmInstance } from "./fhevmTypes";
import { createFhevmInstance } from "./internal/fhevm";

export type FhevmGoState = "idle" | "loading" | "ready" | "error";

export function useFhevm(parameters: {
  provider: string | ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  enabled?: boolean;
  initialMockChains?: Readonly<Record<number, string>>;
}): {
  instance: FhevmInstance | undefined;
  refresh: () => void;
  error: Error | undefined;
  status: FhevmGoState;
} {
  const { provider, chainId, initialMockChains, enabled = true } = parameters;

  const [instance, _setInstance] = useState<FhevmInstance | undefined>(
    undefined
  );
  const [status, _setStatus] = useState<FhevmGoState>("idle");
  const [error, _setError] = useState<Error | undefined>(undefined);
  const [_isRunning, _setIsRunning] = useState<boolean>(enabled);
  const [_providerChanged, _setProviderChanged] = useState<number>(0);
  const _abortControllerRef = useRef<AbortController | null>(null);
  const _providerRef = useRef<string | ethers.Eip1193Provider | undefined>(
    provider
  );
  const _chainIdRef = useRef<number | undefined>(chainId);
  const _mockChainsRef = useRef<Record<number, string> | undefined>(
    initialMockChains
  );

  const refresh = useCallback(() => {
    // Provider or chainId has changed. Abort immediately
    if (_abortControllerRef.current) {
      // Make sure _providerRef.current + _chainIdRef.current are undefined during abort
      _providerRef.current = undefined;
      _chainIdRef.current = undefined;

      _abortControllerRef.current.abort();
      _abortControllerRef.current = null;
    }

    _providerRef.current = provider;
    _chainIdRef.current = chainId;

    // Nullify instance immediately
    _setInstance(undefined);
    _setError(undefined);
    _setStatus("idle");

    if (provider !== undefined) {
      // Force call main useEffect
      _setProviderChanged((prev) => prev + 1);
    }

    // Do not modify the running flag.
  }, [provider, chainId]);

  // Merge in main useEffect!!!
  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    _setIsRunning(enabled);
  }, [enabled]);

  // Main useEffect
  useEffect(() => {
    if (_isRunning === false) {
      // cancelled
      console.log("cancelled");
      if (_abortControllerRef.current) {
        _abortControllerRef.current.abort();
        _abortControllerRef.current = null;
      }
      // May already be null if provider was changed in the previous render-cycle
      _setInstance(undefined);
      _setError(undefined);
      _setStatus("idle");
      return;
    }

    if (_isRunning === true) {
      if (_providerRef.current === undefined) {
        _setInstance(undefined);
        _setError(undefined);
        _setStatus("idle");
        return;
      }

      const abortController = new AbortController();
      _abortControllerRef.current = abortController;

      _setStatus("loading");
      _setError(undefined);

      createFhevmInstance({
        provider: _providerRef.current,
        signal: abortController.signal,
        mockChains: _mockChainsRef.current,
        onStatusChange: (status) => {
          console.log("FHEVM status:", status);
        },
      })
        .then((newInstance) => {
          if (
            _providerRef.current === provider &&
            _chainIdRef.current === chainId
          ) {
            _setInstance(newInstance);
            _setStatus("ready");
            _setError(undefined);
          }
        })
        .catch((err) => {
          if (err.name === "FhevmAbortError") {
            console.log("FHEVM creation was aborted");
            return;
          }
          if (
            _providerRef.current === provider &&
            _chainIdRef.current === chainId
          ) {
            _setInstance(undefined);
            _setStatus("error");
            _setError(err);
          }
        });
    }

    return () => {
      if (_abortControllerRef.current) {
        _abortControllerRef.current.abort();
        _abortControllerRef.current = null;
      }
    };
  }, [_isRunning, _providerChanged, provider, chainId]);

  return {
    instance,
    refresh,
    error,
    status,
  };
}

