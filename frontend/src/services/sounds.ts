/**
 * Sound service using Web Audio API.
 * Generates subtle UI feedback sounds without external audio files.
 * All sounds are short synthesized tones — no downloads, no CORS issues.
 */

let audioCtx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch { /* AudioContext not available */ }
}

export const sounds = {
  success() {
    playTone(523, 0.08, "sine", 0.12); // C5
    setTimeout(() => playTone(659, 0.08, "sine", 0.12), 80); // E5
    setTimeout(() => playTone(784, 0.12, "sine", 0.12), 160); // G5
  },

  error() {
    playTone(330, 0.15, "sawtooth", 0.08); // E4
    setTimeout(() => playTone(262, 0.2, "sawtooth", 0.08), 120); // C4
  },

  click() {
    playTone(800, 0.03, "sine", 0.06);
  },

  notification() {
    playTone(880, 0.06, "sine", 0.1); // A5
    setTimeout(() => playTone(1100, 0.1, "sine", 0.1), 70); // C6
  },

  delete() {
    playTone(400, 0.1, "triangle", 0.1);
    setTimeout(() => playTone(300, 0.15, "triangle", 0.1), 80);
  },

  upload() {
    playTone(600, 0.06, "sine", 0.08);
    setTimeout(() => playTone(900, 0.08, "sine", 0.08), 60);
  },

  setMuted(value: boolean) { muted = value; },
  isMuted() { return muted; },
};
