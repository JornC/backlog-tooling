import { ref } from "vue";

// Synthesized wheel sounds via the Web Audio API - no external assets.
//   ticks: short band-passed noise bursts (peg "toks"). They are SCHEDULED at
//          their exact peg-crossing times (computed from the spin's easing
//          curve), so they decelerate on the same curve as the wheel with no
//          per-frame jitter, overlap, or stutter.
//   ding:  a short rising bell chime when the wheel settles on the winner.
// The AudioContext can only start from a user gesture, so call ensure() (or any
// play*/schedule* helper, which call it) from the spin/toggle click.
export function useWheelSounds() {
  const enabled = ref(true);
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;

  function ensure(): AudioContext {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = enabled.value ? 1 : 0;
      master.connect(ctx.destination);
      // One short white-noise buffer, reused for every tick.
      const len = Math.floor(ctx.sampleRate * 0.05);
      noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    return ctx;
  }

  // Mute/unmute via the master gain so it also silences already-scheduled ticks.
  function setEnabled(on: boolean) {
    enabled.value = on;
    if (ctx && master) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(on ? 1 : 0, t, 0.015);
    }
  }

  function tickAt(when: number) {
    if (!ctx || !noiseBuffer || !master) {
      return;
    }
    const ac = ctx;
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer;
    // Band-pass with slight per-tick variation gives a woody, mechanical click.
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800 + Math.random() * 700;
    bp.Q.value = 5;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.5, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.028);
    src.connect(bp).connect(g).connect(master);
    src.start(when);
    src.stop(when + 0.04);
  }

  // Schedule one tick per offset (ms from now). Sample-accurate timing.
  function scheduleTicks(offsetsMs: number[]) {
    if (!enabled.value) {
      return;
    }
    const ac = ensure();
    const base = ac.currentTime;
    for (const ms of offsetsMs) {
      tickAt(base + ms / 1000);
    }
  }

  function playTick() {
    if (!enabled.value) {
      return;
    }
    const ac = ensure();
    tickAt(ac.currentTime);
  }

  function bell(t: number, freq: number, dur: number) {
    if (!ctx || !master) {
      return;
    }
    const ac = ctx;
    // Fundamental + octave + an inharmonic shimmer = a bell-ish strike.
    const partials = [
      { m: 1, g: 0.5, d: dur },
      { m: 2, g: 0.2, d: dur * 0.7 },
      { m: 2.76, g: 0.07, d: dur * 0.5 },
    ];
    for (const p of partials) {
      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * p.m;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(p.g, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p.d);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + p.d + 0.05);
    }
  }

  // A rising C-major bell arpeggio (C6 - E6 - G6) - a celebratory "you won".
  function playDing() {
    if (!enabled.value) {
      return;
    }
    const ac = ensure();
    const t0 = ac.currentTime;
    bell(t0, 1046.5, 0.5);
    bell(t0 + 0.09, 1318.5, 0.5);
    bell(t0 + 0.18, 1568.0, 1.1);
  }

  return { enabled, ensure, setEnabled, playTick, scheduleTicks, playDing };
}
