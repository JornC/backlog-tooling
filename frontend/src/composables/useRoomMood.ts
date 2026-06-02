import { MOOD_WINDOW_MS, type Vibe } from "@/domain/types";
import { useSocketStore } from "@/ws/socketManager";
import { computed, onUnmounted, ref, watch } from "vue";

const TICK_MS = 200;
// Total decayed weight at which a vibe reaches full strength.
const SATURATION = 6;

/**
 * Derives a decaying ambient "mood" from the room's recent vibe stream.
 *
 * Each vibe contributes a linearly-decaying weight (full at arrival, zero after
 * MOOD_WINDOW_MS). Weights stack, so repeated clicks produce a stronger, longer mood.
 *
 * Exposes only per-vibe magnitudes (0-100). Rendering blends fixed-colour layers by
 * opacity rather than animating a colour, so there is no per-frame repaint cost.
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

  // Per-vibe magnitude (0-100): how hard each vibe is being pushed right now,
  // independent of the others. One click reads low; stacking clicks climbs toward 100%.
  const vibePercents = computed(() => {
    const t = now.value;
    const weights = {} as Record<Vibe, number>;

    for (const { vibe, t: vibeTime } of socketStore.recentVibes) {
      const w = Math.max(0, 1 - (t - vibeTime) / MOOD_WINDOW_MS);
      if (w <= 0) {
        continue;
      }
      weights[vibe] = (weights[vibe] ?? 0) + w;
    }

    const percents = {} as Record<Vibe, number>;
    for (const vibe of Object.keys(weights) as Vibe[]) {
      percents[vibe] = Math.round(Math.min(1, weights[vibe] / SATURATION) * 100);
    }
    return percents;
  });

  return { vibePercents };
}
