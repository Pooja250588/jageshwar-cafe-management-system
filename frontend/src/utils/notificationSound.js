let audioCtxInstance = null;

/**
 * Returns a shared AudioContext instance.
 */
export const getAudioContext = () => {
  if (!audioCtxInstance) {
    audioCtxInstance = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtxInstance;
};

/**
 * Attempts to resume/unlock the AudioContext using a user gesture.
 */
export const unlockAudio = async () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    // Play a brief silent note to fully initialize
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(0.01);
    console.log("AudioContext unlocked and running!");
    return true;
  } catch (e) {
    console.warn("Failed to unlock AudioContext:", e);
    return false;
  }
};

/**
 * Plays a notification sound using the Web Audio API.
 * No external file needed — generates a chime programmatically.
 * @param {"bell"|"success"|"alert"} type
 */
export const playNotificationSound = (type = "bell") => {
  try {
    const ctx = getAudioContext();
    
    // If context is suspended (browser autoplay policy), try to resume it
    if (ctx.state === "suspended") {
      ctx.resume().catch(e => console.warn("Failed to auto-resume audio context:", e));
    }

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);

    const configs = {
      bell: [
        { freq: 880, time: 0, duration: 0.35 },
        { freq: 1100, time: 0.12, duration: 0.35 },
        { freq: 1320, time: 0.24, duration: 0.65 },
      ],
      success: [
        { freq: 523, time: 0, duration: 0.15 },
        { freq: 659, time: 0.1, duration: 0.15 },
        { freq: 784, time: 0.2, duration: 0.25 },
      ],
      alert: [
        { freq: 440, time: 0, duration: 0.2 },
        { freq: 440, time: 0.25, duration: 0.2 },
        { freq: 440, time: 0.5, duration: 0.3 },
      ],
    };

    const notes = configs[type] || configs.bell;

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(masterGain);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + time + duration
      );

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + duration + 0.05);
    });
  } catch (e) {
    console.warn("Audio notification failed:", e);
  }
};

/**
 * Speaks a message aloud using the browser's SpeechSynthesis API.
 * Uses Indian English voice if available.
 * @param {string} text
 */
export const speakText = (text) => {
  try {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    // Prefer an Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(
      (v) => v.lang === "en-IN" || v.name.includes("India")
    );
    if (indianVoice) utterance.voice = indianVoice;

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Speech synthesis failed:", e);
  }
};
