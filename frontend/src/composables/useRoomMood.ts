import { MOOD_WINDOW_MS, VIBE_META, type Vibe } from "@/domain/types";
import { useSocketStore } from "@/ws/socketManager";
import { computed, onUnmounted, ref, watch } from "vue";

const TICK_MS = 100;
// Total decayed weight at which the tint reaches full strength.
const SATURATION = 6;
// Cap so the overlay never fully obscures the content, no matter how hard people spam.
const MAX_INTENSITY = 0.6;

/**
 * Derives a decaying ambient "mood" from the room's recent vibe stream.
 *
 * Each vibe contributes a linearly-decaying weight (full at arrival, zero after
 * MOOD_WINDOW_MS). Weights stack, so repeated clicks produce a stronger, longer mood.
 * The per-sentiment weights are blended in RGB to a single tint colour and intensity.
 */
export function useRoomMood() {
  const socketStore = useSocketStore();
  const now = ref(Date.now());

  let timer: ReturnType<typeof setInterval> | null = null;

  function startTicking() {
    if (timer !== null) {
      return;
    }
    timer = setInterval(() => {
      now.value = Date.now();
      if (socketStore.recentVibes.length === 0) {
        stopTicking();
      }
    }, TICK_MS);
  }

  function stopTicking() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Resume the decay loop whenever a fresh vibe lands.
  watch(
    () => socketStore.recentVibes.length,
    (len) => {
      if (len > 0) {
        now.value = Date.now();
        startTicking();
      }
    },
    { immediate: true },
  );

  onUnmounted(stopTicking);

  const mood = computed(() => {
    const t = now.value;
    const weights = new Map<Vibe, number>();
    let total = 0;

    for (const { vibe, t: vibeTime } of socketStore.recentVibes) {
      const age = t - vibeTime;
      const w = Math.max(0, 1 - age / MOOD_WINDOW_MS);
      if (w <= 0) {
        continue;
      }
      weights.set(vibe, (weights.get(vibe) ?? 0) + w);
      total += w;
    }

    const percents = {} as Record<Vibe, number>;

    if (total === 0) {
      return { color: "transparent", intensity: 0, dominant: null as Vibe | null, percents };
    }

    let r = 0;
    let g = 0;
    let b = 0;
    let dominant: Vibe | null = null;
    let dominantWeight = 0;
    for (const [vibe, w] of weights) {
      const [vr, vg, vb] = VIBE_META[vibe].color;
      r += vr * w;
      g += vg * w;
      b += vb * w;
      // Per-vibe intensity (0-100%): how hard this vibe is being pushed right now,
      // independent of the others. One click reads low; stacking clicks climbs toward 100%.
      percents[vibe] = Math.round(Math.min(1, w / SATURATION) * 100);
      if (w > dominantWeight) {
        dominantWeight = w;
        dominant = vibe;
      }
    }

    const color = `rgb(${Math.round(r / total)}, ${Math.round(g / total)}, ${Math.round(b / total)})`;
    const intensity = Math.min(MAX_INTENSITY, (total / SATURATION) * MAX_INTENSITY);

    return { color, intensity, dominant, percents };
  });

  return {
    moodColor: computed(() => mood.value.color),
    moodIntensity: computed(() => mood.value.intensity),
    dominantVibe: computed(() => mood.value.dominant),
    vibePercents: computed(() => mood.value.percents),
  };
}
