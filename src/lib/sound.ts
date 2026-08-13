let soundEnabled = true;
let lastHover = 0;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function playSound(kind: "hover" | "click" | "success") {
  if (!soundEnabled || typeof window === "undefined") return;
  if (kind === "hover" && Date.now() - lastHover < 100) return;
  if (kind === "hover") lastHover = Date.now();

  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const frequency = kind === "success" ? 740 : kind === "click" ? 420 : 260;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  oscillator.type = "sine";
  gain.gain.setValueAtTime(kind === "hover" ? 0.018 : 0.035, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.08);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.085);
  oscillator.addEventListener("ended", () => void context.close());
}