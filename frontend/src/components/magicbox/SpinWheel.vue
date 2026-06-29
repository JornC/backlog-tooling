<template>
  <div class="wheel" :style="{ width: size + 'px', height: size + 'px' }">
    <div class="pointer" ></div>
    <svg
      ref="discEl"
      class="disc"
      :viewBox="`0 0 ${size} ${size}`"
      :style="{ transform: `rotate(${rotation}deg)`, transition }"
      @transitionend="onTransitionEnd">
      <defs>
        <!-- Fades titles only where they reach toward the hub: fully opaque
             outside ~0.36r, alpha -> 0 by ~0.2r (the central button). Titles
             that fit comfortably never reach the fade band, so they stay solid;
             only long ones dissolve their inner tip near the centre. -->
        <radialGradient id="mb-title-fade-grad" gradientUnits="userSpaceOnUse" :cx="c" :cy="c" :r="r">
          <stop offset="0" stop-color="#fff" stop-opacity="0" />
          <stop offset="0.2" stop-color="#fff" stop-opacity="0" />
          <stop offset="0.36" stop-color="#fff" stop-opacity="1" />
          <stop offset="1" stop-color="#fff" stop-opacity="1" />
        </radialGradient>
        <mask id="mb-title-fade" maskUnits="userSpaceOnUse" x="0" y="0" :width="size" :height="size">
          <rect x="0" y="0" :width="size" :height="size" fill="url(#mb-title-fade-grad)" />
        </mask>
      </defs>
      <g v-if="items.length === 0">
        <circle :cx="c" :cy="c" :r="r" class="empty-disc" />
        <text :x="c" :y="c" class="empty-text">{{ emptyLabel }}</text>
      </g>
      <g v-for="(seg, i) in segments" :key="i">
        <path :d="seg.path" :fill="seg.color" class="slice" />
        <text :transform="seg.numTransform" class="num" :style="{ fontSize: numberSize + 'px' }">
          {{ seg.num }}
        </text>
      </g>
      <!-- Titles masked as one group so the radial fade is evaluated in the
           disc's frame (true distance from centre), not each text's own frame. -->
      <g mask="url(#mb-title-fade)">
        <text
          v-for="(seg, i) in segments"
          :key="i"
          :transform="seg.titleTransform"
          text-anchor="start"
          class="title"
          :style="{ fontSize: titleSize + 'px' }">
          {{ seg.title }}
        </text>
      </g>
      <circle :cx="c" :cy="c" :r="hubR" class="hub" />
    </svg>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    items: string[];
    size?: number;
    palette?: string[];
    emptyLabel?: string;
  }>(),
  {
    size: 360,
    emptyLabel: "add some entries",
    palette: () => [
      "#1982c4",
      "#8ac926",
      "#ffca3a",
      "#ff595e",
      "#66b2b2",
      "#6a4c93",
      "#ff924c",
      "#52a675",
    ],
  },
);

const emit = defineEmits<{
  settled: [item: string, index: number];
  // Continuous fractional pointer position (0..n) emitted every frame during a
  // spin, so the parent can scroll its title reel in sync with the wheel.
  scroll: [position: number];
}>();

// Two chained CSS transitions (CSS keeps animating even if the tab is hidden,
// unlike rAF), giving a controlled snap independent of the total spin distance:
//   CURVE - decelerate to a random spot *inside* the winning slice (the fuzz)
//   HOLD  - a brief beat at that off-centre spot
//   SNAP  - a quick crisp move to the exact centre of the slice (the pick)
const CURVE_MS = 6500;
const HOLD_MS = 130;
const SNAP_MS = 300;
const CURVE_EASE = "cubic-bezier(0.25, 0.4, 0.55, 1)";
const SNAP_EASE = "cubic-bezier(0.3, 0, 0.2, 1)";

// Random resting orientation on load, so the wheel doesn't always start the same.
const rotation = ref(Math.random() * 360);
const spinning = ref(false);
const transition = ref("none");
const discEl = ref<SVGSVGElement | null>(null);

let pendingIndex = -1;
let phase = 0;
let centerTarget = 0;
let rafId = 0;

const c = computed(() => props.size / 2);
const r = computed(() => props.size / 2 - 4);
const hubR = computed(() => Math.max(14, props.size * 0.06));
const numberSize = computed(() => Math.max(15, Math.min(46, props.size * 0.075)));
const titleSize = computed(() => {
  const n = Math.max(props.items.length, 1);
  // Scales with wheel size, but tapers as slices get thinner (more items).
  return Math.max(8, Math.min(props.size * 0.034, 320 / n + props.size * 0.006));
});

function polar(angleDeg: number, radius: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [c.value + radius * Math.cos(a), c.value + radius * Math.sin(a)];
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

const segments = computed(() => {
  const n = props.items.length;
  if (n === 0) {
    return [];
  }
  const seg = 360 / n;
  const titleMax = Math.max(10, Math.round(20 - n * 0.25));
  return props.items.map((item, i) => {
    const start = i * seg;
    const end = (i + 1) * seg;
    const [x1, y1] = polar(start, r.value);
    const [x2, y2] = polar(end, r.value);
    const largeArc = seg > 180 ? 1 : 0;
    const path =
      n === 1
        ? `M ${c.value - r.value} ${c.value} a ${r.value} ${r.value} 0 1 0 ${r.value * 2} 0 a ${r.value} ${r.value} 0 1 0 ${-r.value * 2} 0`
        : `M ${c.value} ${c.value} L ${x1} ${y1} A ${r.value} ${r.value} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const mid = start + seg / 2;

    // Number tight to the rim, rotated so its top points outward (rotate by mid).
    const [nx, ny] = polar(mid, r.value * 0.91);
    const match = item.match(/^\s*(\d+)/);
    const num = match ? match[1] : String(i + 1);

    // Theme title below the number, at 90° to it (running along the radius),
    // anchored just inside the number and growing inward toward the hub.
    const [tx, ty] = polar(mid, r.value * 0.8);
    const title = truncate(item.replace(/^\s*\d+[.)]?\s*/, "").trim(), titleMax);

    return {
      path,
      color: props.palette[i % props.palette.length],
      num,
      numTransform: `translate(${nx} ${ny}) rotate(${mid})`,
      title,
      titleTransform: `translate(${tx} ${ty}) rotate(${mid + 90})`,
    };
  });
});

function spinTo(index: number) {
  if (props.items.length === 0 || spinning.value) {
    return;
  }
  const n = props.items.length;
  const seg = 360 / n;
  // Base distance brings the slice centre exactly under the pointer.
  const targetMod = (((-(index * seg + seg / 2)) % 360) + 360) % 360;
  const currentMod = ((rotation.value % 360) + 360) % 360;
  const delta = ((targetMod - currentMod) % 360 + 360) % 360;
  const extraTurns = 3 + Math.floor(Math.random() * 2);

  centerTarget = rotation.value + extraTurns * 360 + delta;
  // Curve toward a random spot inside the slice, then snap away from it. Random
  // sign + magnitude (up to ~0.4 of a slice - nearly the neighbour) is the
  // "fuzz"; the snap distance equals this offset. Min magnitude keeps a visible
  // snap (and guarantees the phase-2 transitionend fires).
  const fuzz = (Math.random() < 0.5 ? -1 : 1) * seg * (0.16 + Math.random() * 0.24);

  pendingIndex = index;
  phase = 1;
  spinning.value = true;
  transition.value = `transform ${CURVE_MS}ms ${CURVE_EASE}`;
  rotation.value = centerTarget + fuzz;
  startTracking();
}

function spinRandom() {
  if (props.items.length === 0) {
    return;
  }
  spinTo(Math.floor(Math.random() * props.items.length));
}

function onTransitionEnd(e: TransitionEvent) {
  if (e.propertyName !== "transform") {
    return;
  }
  if (phase === 1) {
    phase = 2;
    // Brief beat, then a quick crisp snap to the exact centre.
    setTimeout(() => {
      transition.value = `transform ${SNAP_MS}ms ${SNAP_EASE}`;
      rotation.value = centerTarget;
    }, HOLD_MS);
  } else if (phase === 2) {
    phase = 0;
    spinning.value = false;
    stopTracking();
    const i = pendingIndex;
    pendingIndex = -1;
    if (i >= 0 && i < props.items.length) {
      emit("scroll", i);
      emit("settled", props.items[i], i);
    }
  }
}

// Continuous fractional pointer position (0..n) read from the live transform,
// so the reel scrolls in step with the wheel. (-angle)/seg equals index+0.5
// when slice `index` is dead under the pointer, so subtract 0.5 to align the
// reel exactly with the arrow.
function pointerPosition(): number {
  const el = discEl.value;
  const n = props.items.length;
  if (!el || n === 0) {
    return 0;
  }
  const t = getComputedStyle(el).transform;
  let angle = 0;
  if (t && t !== "none") {
    const m = new DOMMatrixReadOnly(t);
    angle = (Math.atan2(m.b, m.a) * 180) / Math.PI;
  }
  const seg = 360 / n;
  const raw = ((((-angle) % 360) + 360) % 360) / seg - 0.5;
  return ((raw % n) + n) % n;
}

function track() {
  if (!spinning.value) {
    return;
  }
  emit("scroll", pointerPosition());
  rafId = requestAnimationFrame(track);
}

function startTracking() {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(track);
}

function stopTracking() {
  cancelAnimationFrame(rafId);
}

onUnmounted(stopTracking);

defineExpose({ spinTo, spinRandom, isSpinning: () => spinning.value });
</script>

<style lang="scss" scoped>
.wheel {
  position: relative;
  display: grid;
  place-items: center;
}

.disc {
  width: 100%;
  height: 100%;
  transform-origin: 50% 50%;
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.45));
  border-radius: 50%;
  /* The transition (duration + easing) is driven from script. */
}

.slice {
  stroke: rgba(0, 0, 0, 0.35);
  stroke-width: 1.5;
}

.num {
  fill: #11151a;
  font-weight: 800;
  text-anchor: middle;
  dominant-baseline: central;
  paint-order: stroke;
  stroke: rgba(255, 255, 255, 0.45);
  stroke-width: 1px;
  pointer-events: none;
}

.title {
  fill: #11151a;
  font-weight: 700;
  dominant-baseline: central;
  paint-order: stroke;
  stroke: rgba(255, 255, 255, 0.35);
  stroke-width: 0.5px;
  pointer-events: none;
}

.hub {
  fill: #11151a;
  stroke: #ffffff;
  stroke-width: 3;
}

.empty-disc {
  fill: rgba(255, 255, 255, 0.06);
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 2;
  stroke-dasharray: 6 6;
}

.empty-text {
  fill: rgba(255, 255, 255, 0.5);
  text-anchor: middle;
  dominant-baseline: middle;
  font-size: 16px;
}

.pointer {
  position: absolute;
  top: -6px;
  left: 50%;
  z-index: 2;
  width: 0;
  height: 0;
  transform: translateX(-50%);
  border-left: 16px solid transparent;
  border-right: 16px solid transparent;
  border-top: 30px solid #ffffff;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5));
}
</style>
