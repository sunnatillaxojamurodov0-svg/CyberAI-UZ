// Sound effects using Web Audio API
const audioContext =
  typeof window !== "undefined"
    ? new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )()
    : null;

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.3,
) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

export function playSuccessSound() {
  // Play a pleasant success chime
  playTone(523.25, 0.15, "sine", 0.2); // C5
  setTimeout(() => playTone(659.25, 0.15, "sine", 0.2), 100); // E5
  setTimeout(() => playTone(783.99, 0.2, "sine", 0.2), 200); // G5
  setTimeout(() => playTone(1046.5, 0.3, "sine", 0.15), 300); // C6
}

export function playErrorSound() {
  // Play a lower-pitched error tone
  playTone(200, 0.2, "sawtooth", 0.1);
  setTimeout(() => playTone(150, 0.3, "sawtooth", 0.1), 150);
}

export function playKeySound() {
  // Subtle keypress sound
  playTone(800, 0.05, "sine", 0.05);
}

export function playRevealSound() {
  // Mysterious reveal sound
  playTone(440, 0.2, "sine", 0.15);
  setTimeout(() => playTone(554.37, 0.2, "sine", 0.15), 150);
  setTimeout(() => playTone(659.25, 0.3, "sine", 0.1), 300);
}

export function playBookmarkSound() {
  // Quick toggle sound
  playTone(600, 0.1, "sine", 0.1);
}
