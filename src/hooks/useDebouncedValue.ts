import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs: number, immediateResetValue?: T): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    if (immediateResetValue !== undefined && value === immediateResetValue) {
      setDebounced(value);
      return;
    }

    if (delayMs <= 0) {
      setDebounced(value);
      return;
    }

    const handle = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => clearTimeout(handle);
  }, [value, delayMs, immediateResetValue]);

  return debounced;
}
