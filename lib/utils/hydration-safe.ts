import { useState } from "react";
import useLocalStorageState from "use-local-storage-state";

export function useIsClient(): boolean {
  return useState(() => typeof window !== "undefined")[0];
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [value, setValue] = useLocalStorageState<T>(key, {
    defaultValue: initialValue,
  });
  return [value, setValue];
}
