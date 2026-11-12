/** Tiny synthesised sound effects. No audio files, so the game works offline. */
let ac: AudioContext | null = null;
let enabled = true;

export const setSound = (on: boolean) => (enabled = on);

function tone(freq: number, dur: number, type: OscillatorType = 'triangle', delay = 0, vol = 0.12) {
  if (!enabled) return;
  try {
    ac ??= new AudioContext();
    const t = ac.currentTime + delay;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + dur);
  } catch {
    /* audio unavailable */
  }
}

export const sfx = {
  roll: () => [0, 0.07, 0.14, 0.21].forEach((d, i) => tone(300 + i * 60, 0.06, 'square', d, 0.06)),
  step: () => tone(520, 0.05, 'triangle', 0, 0.08),
  back: () => tone(220, 0.08, 'sawtooth', 0, 0.06),
  warp: () => [0, 0.05, 0.1].forEach((d, i) => tone(500 + i * 250, 0.09, 'sine', d)),
  ability: () => { tone(660, 0.1, 'sine'); tone(880, 0.14, 'sine', 0.08); },
  daze: () => { tone(300, 0.15, 'sawtooth', 0, 0.07); tone(200, 0.2, 'sawtooth', 0.12, 0.07); },
  card: () => [0, 0.1, 0.2, 0.3].forEach((d, i) => tone([392, 494, 587, 784][i], 0.18, 'triangle', d)),
  finish: () => [0, 0.12, 0.24, 0.4].forEach((d, i) => tone([523, 659, 784, 1047][i], 0.25, 'triangle', d, 0.14)),
  out: () => [0, 0.12, 0.24].forEach((d, i) => tone([330, 247, 165][i], 0.2, 'sawtooth', d, 0.07)),
};
