import { SOUND_VOLUME, SOUND_FADE_SECONDS } from "./settings.js";

// A soft pad made with the Web Audio API, so the app needs no audio files.
// Each note is two slightly out-of-tune sine waves (that gives the gentle "shimmer").
// A low-pass filter opens as the lungs fill, so the sound breathes with you.
export const createSoundscapePlayer = () => {
  let audioContext = null; // created on the first click (browsers only allow sound after a click)
  let currentVoice = null; // the soundscape playing now: { output, filter, oscillators }

  const createVoice = (soundscape) => {
    const output = audioContext.createGain();
    output.gain.value = 0;

    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;
    filter.Q.value = 0.4;
    filter.connect(output);
    output.connect(audioContext.destination);

    const oscillators = [];
    soundscape.notes.forEach((frequency, noteIndex) => {
      [-4, 4].forEach((detuneCents) => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = noteIndex === 0 ? "triangle" : "sine"; // a slightly richer bass note
        oscillator.frequency.value = frequency;
        oscillator.detune.value = detuneCents;

        const noteVolume = audioContext.createGain();
        noteVolume.gain.value = 0.22 / (noteIndex + 1); // higher notes are softer
        oscillator.connect(noteVolume).connect(filter);
        oscillator.start();
        oscillators.push(oscillator);
      });
    });

    return { output, filter, oscillators };
  };

  const fadeOutAndStop = (voice) => {
    const now = audioContext.currentTime;
    voice.output.gain.cancelScheduledValues(now);
    voice.output.gain.setValueAtTime(voice.output.gain.value, now);
    voice.output.gain.linearRampToValueAtTime(0, now + SOUND_FADE_SECONDS);
    voice.oscillators.forEach((oscillator) => oscillator.stop(now + SOUND_FADE_SECONDS + 0.1));
  };

  return {
    // Start a soundscape. If one is already playing, the two cross-fade.
    play(soundscape) {
      audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
      audioContext.resume();
      if (currentVoice) fadeOutAndStop(currentVoice);

      currentVoice = createVoice(soundscape);
      const now = audioContext.currentTime;
      currentVoice.output.gain.setValueAtTime(0, now);
      currentVoice.output.gain.linearRampToValueAtTime(SOUND_VOLUME, now + SOUND_FADE_SECONDS);
    },

    stop() {
      if (!currentVoice) return;
      fadeOutAndStop(currentVoice);
      currentVoice = null;
    },

    // Called every frame: brighter sound as the lungs fill
    followBreath(fullness) {
      if (!currentVoice) return;
      currentVoice.filter.frequency.setTargetAtTime(380 + fullness * 1400, audioContext.currentTime, 0.15);
    },
  };
};
