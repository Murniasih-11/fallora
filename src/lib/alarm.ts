// ============================================================
// FALLORA — Alarm Utility
// Generates a loud siren sound using the Web Audio API
// ============================================================

class AlarmManager {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private isPlaying = false;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  play() {
    if (this.isPlaying) return;
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.osc = this.ctx.createOscillator();
    this.gain = this.ctx.createGain();

    this.osc.type = 'square';
    this.osc.connect(this.gain);
    this.gain.connect(this.ctx.destination);

    // Loud volume
    this.gain.gain.value = 0.5;
    this.osc.start();

    this.isPlaying = true;

    // Siren effect: oscillate frequency
    let high = true;
    this.osc.frequency.setValueAtTime(800, this.ctx.currentTime);

    this.interval = setInterval(() => {
      if (!this.osc || !this.ctx) return;
      if (high) {
        this.osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      } else {
        this.osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      }
      high = !high;
    }, 400); // toggle every 400ms
  }

  stop() {
    if (!this.isPlaying) return;
    if (this.interval) clearInterval(this.interval);
    if (this.osc) {
      this.osc.stop();
      this.osc.disconnect();
    }
    if (this.gain) {
      this.gain.disconnect();
    }
    this.osc = null;
    this.gain = null;
    this.isPlaying = false;
  }
}

export const alarm = typeof window !== 'undefined' ? new AlarmManager() : null;
