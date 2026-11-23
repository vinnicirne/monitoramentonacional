import { useCallback, useEffect, useRef, useState } from 'react';

function playSignal(context: AudioContext) {
  if (context.state !== 'running') return;
  const start = context.currentTime;
  for (const [index, frequency] of [660, 880, 1040].entries()) {
    const at = start + index * 0.24;
    const tone = context.createOscillator();
    const volume = context.createGain();
    tone.type = 'triangle';
    tone.frequency.value = frequency;
    volume.gain.setValueAtTime(0.001, at);
    volume.gain.exponentialRampToValueAtTime(0.15, at + 0.025);
    volume.gain.exponentialRampToValueAtTime(0.001, at + 0.18);
    tone.connect(volume);
    volume.connect(context.destination);
    tone.onended = () => { tone.disconnect(); volume.disconnect(); };
    tone.start(at);
    tone.stop(at + 0.2);
  }
}

export function useSosSound(pendingKeys: string[]) {
  const contextRef = useRef<AudioContext | undefined>(undefined);
  const [enabled, setEnabled] = useState(false);
  const [silenced, setSilenced] = useState<string[]>([]);
  const supported = typeof window.AudioContext === 'function';
  const audible = pendingKeys.filter(key => !silenced.includes(key)).join('\n');

  const enable = useCallback(() => {
    if (!supported) return;
    try {
      const context = contextRef.current ??= new AudioContext();
      if (context.state === 'running') {
        setEnabled(true);
        return;
      }
      void context.resume().then(() => {
        if (contextRef.current === context) setEnabled(context.state === 'running');
      }).catch(() => {});
    } catch { /* The visual alert remains available. */ }
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    const controller = new AbortController();
    const options = { capture: true, signal: controller.signal };
    function enableAfterInteraction(event: Event) {
      if (!(event.target instanceof Element && event.target.closest('[data-sos-audio-enable]'))) enable();
    }
    window.addEventListener('pointerdown', enableAfterInteraction, options);
    window.addEventListener('keydown', enableAfterInteraction, options);
    return () => {
      controller.abort();
      const context = contextRef.current;
      contextRef.current = undefined;
      if (context && context.state !== 'closed') void context.close().catch(() => {});
    };
  }, [enable, supported]);

  useEffect(() => {
    if (!enabled || !audible || !contextRef.current) return;
    const context = contextRef.current;
    playSignal(context);
    const timer = window.setInterval(() => playSignal(context), 12000);
    return () => window.clearInterval(timer);
  }, [audible, enabled]);

  return { enabled, supported, enable, ringing: Boolean(audible), silence: () => setSilenced(pendingKeys) };
}
