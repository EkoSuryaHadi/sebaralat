'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useToast(durationMs = 3400) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = useCallback(
    (msg: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setToastMsg(msg);
      timerRef.current = setTimeout(() => {
        setToastMsg(null);
        timerRef.current = null;
      }, durationMs);
    },
    [durationMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { toastMsg, triggerToast };
}

