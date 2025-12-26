import { logger } from "@/lib/services/logger";
import { useEffect, useRef, useState } from "react";

export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      setTimeout(() => setIsClient(true), 0);
    }
  }, []);

  return isClient;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const isClient = typeof window !== "undefined";

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient) {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      logger.error(`Error reading localStorage key "${key}"`, error);
      return initialValue;
    }
  });

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!isClient || hasLoadedRef.current) return;

    hasLoadedRef.current = true;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          logger.error(
            `Error parsing localStorage value for key "${key}"`,
            error
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, isClient]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      logger.error(`Error setting localStorage key "${key}"`, error);
    }
  };

  return [storedValue, setValue];
}
