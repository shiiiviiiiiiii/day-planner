class AmbientMusicEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private timeoutId: any = null;
  private currentMeasure = 0;

  private chords = [
    [130.81, 196.00, 246.94, 329.63, 392.00], // Cmaj9
    [174.61, 220.00, 261.63, 329.63, 349.23], // Fmaj7
    [110.00, 220.00, 261.63, 329.63, 392.00], // Am9
    [196.00, 246.94, 293.66, 329.63, 392.00]  // G6
  ];

  start() {
    if (this.isPlaying) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.04, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);
      this.isPlaying = true;
      this.currentMeasure = 0;
      this.playLoop();
    } catch (e) {
      console.error("Could not start ambient music", e);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
      this.gainNode = null;
    }
  }

  private playLoop() {
    if (!this.isPlaying || !this.ctx || !this.gainNode) return;

    try {
      const now = this.ctx.currentTime;
      const chord = this.chords[this.currentMeasure % this.chords.length];

      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.gainNode) return;

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        const noteStart = now + idx * 0.15;
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.18, noteStart + 0.8);
        oscGain.gain.exponentialRampToValueAtTime(0.001, noteStart + 5.2);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(550, now);

        osc.connect(oscGain);
        oscGain.connect(filter);
        filter.connect(this.gainNode);

        osc.start(noteStart);
        osc.stop(noteStart + 5.5);
      });

      this.currentMeasure++;
      this.timeoutId = setTimeout(() => this.playLoop(), 5800);
    } catch (e) {
      console.error("Error scheduling music notes", e);
    }
  }
}

let ambientMusicInstance: AmbientMusicEngine | null = null;

export const playAmbientMusic = () => {
  if (typeof window === "undefined") return;
  if (!ambientMusicInstance) {
    ambientMusicInstance = new AmbientMusicEngine();
  }
  ambientMusicInstance.start();
};

export const stopAmbientMusic = () => {
  if (ambientMusicInstance) {
    ambientMusicInstance.stop();
  }
};

export const playTypewriterClick = () => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.015);
    
    oscGain.gain.setValueAtTime(0.06, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    const bufferSize = ctx.sampleRate * 0.02;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1200, now);
    noiseFilter.Q.setValueAtTime(4, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.04);
    noise.stop(now + 0.04);
  } catch (e) {
    console.error("Audio error", e);
  }
};

export const playCarriageReturnBell = () => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    const bellFreqs = [1250, 1875, 2500];

    bellFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(idx === 0 ? 0.25 : 0.08, now + 0.005);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.5);
    });
  } catch (e) {
    console.error("Audio error", e);
  }
};
