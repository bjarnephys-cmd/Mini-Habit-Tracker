/**
 * Web Audio API synthesized tones for notifications, habit completion, and clicks.
 * Hermetic, reliable, and does not depend on external MP3/WAV assets.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Pleasant two-tone chime for scheduled reminders */
export function playReminderChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Note 1: E5 (659.25 Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(659.25, now);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.25, now + 0.05);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.5);

  // Note 2: A5 (880 Hz) slightly delayed
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(880, now + 0.18);
  gain2.gain.setValueAtTime(0, now + 0.18);
  gain2.gain.linearRampToValueAtTime(0.3, now + 0.22);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.18);
  osc2.stop(now + 0.9);
}

/** Uplifting major chord for habit check-off completion */
export function playCheckChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
  
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.04);
    gain.gain.setValueAtTime(0, now + idx * 0.04);
    gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.04 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.04);
    osc.stop(now + idx * 0.04 + 0.35);
  });
}

/** Water droplet blip sound when logging water */
export function playWaterSipSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}
