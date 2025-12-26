import { useCallback, useState } from "react";

interface UseClipboardReturn {
  copyToClipboard: (text: string) => Promise<void>;
  copiedId: string | null;
}

export function useClipboard(): UseClipboardReturn {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return {
    copyToClipboard,
    copiedId,
  };
}
