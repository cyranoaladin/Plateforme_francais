import { useEffect, useRef, useState } from 'react';

function playAlert() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Audio unavailable.
  }
}

export function useCountdown(totalSeconds: number, running: boolean, persistenceKey?: string) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const alertedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    alertedRef.current.clear();
  }, [totalSeconds]);

  useEffect(() => {
    if (!running) {
      alertedRef.current.clear();
      if (persistenceKey) {
        window.localStorage.removeItem(`timer_start_${persistenceKey}`);
      }
      return;
    }

    let startTime = Date.now();
    if (persistenceKey) {
      const stored = window.localStorage.getItem(`timer_start_${persistenceKey}`);
      if (stored) {
        startTime = Number.parseInt(stored, 10);
      } else {
        window.localStorage.setItem(`timer_start_${persistenceKey}`, String(startTime));
      }
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const left = Math.max(0, totalSeconds - elapsed);
      setRemaining(left);
      if ((left === 600 || left === 120 || left === 0) && !alertedRef.current.has(left)) {
        alertedRef.current.add(left);
        playAlert();
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [persistenceKey, running, totalSeconds]);

  return running ? remaining : totalSeconds;
}
