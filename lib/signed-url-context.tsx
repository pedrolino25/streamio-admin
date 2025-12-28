"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { logger } from "./services/logger";

interface SignedUrlResponse {
  baseUrl: string;
  queryParams: string;
  expiresAt?: number;
}

interface SignedUrlContextType {
  baseUrl: string | null;
  queryParams: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const SignedUrlContext = createContext<SignedUrlContextType | undefined>(
  undefined
);

const SIGNED_URL_ENDPOINT = "https://api.stream-io.cloud/presigned-play-url";
const REFRESH_BUFFER = 1 * 60 * 1000; // 1 minutes before expiration
const DEFAULT_EXPIRATION = 10 * 60 * 1000; // 10 minutes

export function SignedUrlProvider({
  children,
  apiKey,
}: {
  children: ReactNode;
  apiKey: string;
}) {
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchSignedUrl = async () => {
    if (!apiKey || loading) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(SIGNED_URL_ENDPOINT, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch signed URL`);
      }

      const result: SignedUrlResponse = await response.json();
      console.log("result", result);
      setBaseUrl(result.baseUrl);
      setQueryParams(result.queryParams);
      setExpiresAt(result.expiresAt || Date.now() + DEFAULT_EXPIRATION);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch signed URL";
      setError(message);
      logger.error("Error fetching signed URL", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchSignedUrl();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!expiresAt || !apiKey) return;

    const refreshTime = Math.max(expiresAt - Date.now() - REFRESH_BUFFER, 0);
    if (refreshTime > 0) {
      timeoutRef.current = setTimeout(fetchSignedUrl, refreshTime);
    } else {
      fetchSignedUrl();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, apiKey]);

  const value = useMemo(
    () => ({
      baseUrl,
      queryParams,
      loading,
      error,
      refresh: () => fetchSignedUrl(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseUrl, queryParams, loading, error]
  );

  return (
    <SignedUrlContext.Provider value={value}>
      {children}
    </SignedUrlContext.Provider>
  );
}

export function useSignedUrl() {
  const context = useContext(SignedUrlContext);
  if (context === undefined) {
    throw new Error("useSignedUrl must be used within a SignedUrlProvider");
  }
  return context;
}
