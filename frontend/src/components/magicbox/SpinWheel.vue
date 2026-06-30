<template>
  <div class="wheel" :class="{ spinning }" :style="{ width: size + 'px', height: size + 'px' }">
    <!-- A non-spinning circle behind the disc; its stacked box-shadows form the
         wheel's thick "coin" edge, giving it depth under the tilt. -->
    <div class="disc-base" aria-hidden="true"></div>
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
      <!-- Counter-rotate by the disc's current rotation so the prompt stays
           upright even though the disc rests at an arbitrary angle. -->
      <g v-if="items.length === 0" :transform="`rotate(${-rotation} ${c} ${c})`">
        <circle :cx="c" :cy="c" :r="r" class="empty-disc" />
        <text :x="c" :y="c" class="empty-text">{{ emptyLabel }}</text>
      </g>
      <g v-for="(seg, i) in segments" :key="i" class="slice-group">
        <path
          :d="seg.path"
          :fill="seg.color"
          class="slice"
          :class="{ dim: isDimmed(i) }"
          @click="onSliceClick(i)" />
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
      <circle v-if="items.length > 0" :cx="c" :cy="c" :r="hubR" class="hub" />
    </svg>
    <!-- Glossy dome highlight + edge vignette overlay; doesn't rotate with the
         disc (fixed light), and lets clicks through to the slices. -->
    <div class="disc-sheen" aria-hidden="true"></div>
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
  // Peg-crossing times (ms from spin start) for the whole curve, so the parent
  // can schedule tick sounds that follow the deceleration exactly.
  ticks: [offsetsMs: number[]];
  // A slice was clicked to explore it: the parent surfaces what the option is,
  // without the "fate picked" framing.
  preview: [index: number];
}>();

// Two chained CSS transitions (CSS keeps animating even if the tab is hidden,
// unlike rAF), giving a controlled snap independent of the total spin distance:
//   CURVE - decelerate to a random spot *inside* the winning slice (the fuzz)
//   HOLD  - a brief beat at that off-centre spot
//   SNAP  - a quick crisp move to the exact centre of the slice (the pick)
const CURVE_MS = 6500;
const HOLD_MS = 130;
const SNAP_MS = 300;
const CURVE_BEZIER = [0.25, 0.4, 0.55, 1] as const;
const CURVE_EASE = `cubic-bezier(${CURVE_BEZIER.join(", ")})`;
const SNAP_EASE = "cubic-bezier(0.3, 0, 0.2, 1)";

// A short, direct glide for clicking a slice to explore it (no spin theatrics).
const MOVE_MS = 600;
const MOVE_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

// Where the pointer sits, in degrees clockwise from the top. 270 = left (9
// o'clock), pointing right into the wheel. The winner is centred here, ticks
// fire as boundaries cross here, and the neutral rest leaves a boundary here.
const POINTER_ANGLE = 270;

// Cubic value with end points 0 and 1 and the two given control values.
function cubic(c1: number, c2: number, s: number): number {
  const u = 1 - s;
  return 3 * u * u * s * c1 + 3 * u * s * s * c2 + s * s * s;
}

// Invert the curve easing: given an output progress y (0..1), return the time
// fraction x (0..1). Binary search on the Bézier parameter (y is monotonic).
function easeTimeForProgress(y: number): number {
  const [x1, y1, x2, y2] = CURVE_BEZIER;
  let lo = 0;
  let hi = 1;
  let s = y;
  for (let i = 0; i < 28; i++) {
    s = (lo + hi) / 2;
    if (cubic(y1, y2, s) < y) {
      lo = s;
    } else {
      hi = s;
    }
  }
  return cubic(x1, x2, s);
}

// Rest on a random slice *boundary* (pointer between two slices), so the wheel
// varies on load but no single topic looks selected.
function neutralStart(): number {
  const n = props.items.length;
  if (n === 0) {
    return Math.random() * 360;
  }
  const seg = 360 / n;
  return Math.floor(Math.random() * n) * seg + POINTER_ANGLE;
}
const rotation = ref(neutralStart());
const spinning = ref(false);
// The slice currently chosen (a settled spin or a clicked preview), or -1 for
// none. Once set and the wheel is at rest, the other slices are desaturated so
// the winner stands out. Cleared on a new spin, on clear, or when items change.
const selectedIndex = ref(-1);
const transition = ref("none");

// A slice is dimmed when something is selected, the wheel is at rest, and this
// isn't the chosen slice.
function isDimmed(i: number): boolean {
  return selectedIndex.value >= 0 && !spinning.value && i !== selectedIndex.value;
}

// Reset the highlight whenever the wheel's contents change (e.g. switching from
// the names wheel to the topics wheel).
watch(
  () => props.items,
  () => {
    selectedIndex.value = -1;
  },
);
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
  const targetMod = (((POINTER_ANGLE - (index * seg + seg / 2)) % 360) + 360) % 360;
  const currentMod = ((rotation.value % 360) + 360) % 360;
  const delta = ((targetMod - currentMod) % 360 + 360) % 360;
  const extraTurns = 3 + Math.floor(Math.random() * 2);

  centerTarget = rotation.value + extraTurns * 360 + delta;
  // Curve toward a random spot inside the slice, then snap away from it. Random
  // sign + magnitude (up to ~0.4 of a slice - nearly the neighbour) is the
  // "fuzz"; the snap distance equals this offset. Min magnitude keeps a visible
  // snap (and guarantees the phase-2 transitionend fires).
  const fuzz = (Math.random() < 0.5 ? -1 : 1) * seg * (0.16 + Math.random() * 0.24);

  // A peg is crossed every `seg` degrees, at the slice *boundaries* (which sit
  // under the pointer when rotation ≡ POINTER_ANGLE mod seg). Offset the first
  // tick to the next such boundary so ticks land on boundaries, not slice
  // centres, then map each through the easing to its exact time so they
  // decelerate on the same curve as the wheel.
  const totalDist = extraTurns * 360 + delta + fuzz;
  const firstPeg = (((POINTER_ANGLE - rotation.value) % seg) + seg) % seg;
  const tickTimes: number[] = [];
  for (let adv = firstPeg; adv <= totalDist; adv += seg) {
    if (adv > 0.001) {
      tickTimes.push(CURVE_MS * easeTimeForProgress(adv / totalDist));
    }
  }
  emit("ticks", tickTimes);

  pendingIndex = index;
  phase = 1;
  spinning.value = true;
  selectedIndex.value = -1; // all slices vibrant while spinning
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

// Click a slice to glide it under the pointer for a closer look. This is not a
// spin: a short move along the shortest path, no extra turns, fuzz, ticks or
// `settled`. The parent shows the option's info via the `preview` event.
function onSliceClick(index: number) {
  if (props.items.length === 0 || spinning.value) {
    return;
  }
  const n = props.items.length;
  const seg = 360 / n;
  const targetMod = (((POINTER_ANGLE - (index * seg + seg / 2)) % 360) + 360) % 360;
  const currentMod = ((rotation.value % 360) + 360) % 360;
  let delta = (((targetMod - currentMod) % 360) + 360) % 360;
  if (delta > 180) {
    delta -= 360; // take the shortest way round
  }
  transition.value = `transform ${MOVE_MS}ms ${MOVE_EASE}`;
  rotation.value = rotation.value + delta;
  selectedIndex.value = index;
  emit("preview", index);
}

// Glide to the nearest slice boundary (pointer between slices), so nothing is
// selected. Used by the parent's "clear selection" button.
function clearSelection() {
  if (props.items.length === 0 || spinning.value) {
    return;
  }
  const seg = 360 / props.items.length;
  const nearest = Math.round((rotation.value - POINTER_ANGLE) / seg) * seg + POINTER_ANGLE;
  if (Math.abs(nearest - rotation.value) < 0.001) {
    return;
  }
  transition.value = `transform ${MOVE_MS}ms ${MOVE_EASE}`;
  rotation.value = nearest;
  selectedIndex.value = -1;
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
      selectedIndex.value = i; // dim the rest now that a winner is locked in
      emit("scroll", i);
      emit("settled", props.items[i], i);
    }
  }
}

// Continuous fractional pointer position (0..n) read from the live transform,
// so the reel scrolls in step with the wheel. (POINTER_ANGLE-angle)/seg equals
// index+0.5 when slice `index` is dead under the pointer, so subtract 0.5 to
// align the reel exactly with the arrow.
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
  const raw = ((((POINTER_ANGLE - angle) % 360) + 360) % 360) / seg - 0.5;
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

defineExpose({ spinTo, spinRandom, clearSelection, isSpinning: () => spinning.value });
</script>

<style lang="scss" scoped>
.wheel {
  position: relative;
  display: grid;
  place-items: center;
  // A fixed 3D tilt (with the extruded edge below, this gives the wheel real
  // depth at rest). The tilt lives on the container so pointer and disc tilt
  // together and stay aligned; the disc keeps its own 2D spin inside this frame.
  // No `preserve-3d` - the children are flat and it makes hit-testing the SVG
  // slices through the tilt unreliable.
  transform-origin: 50% 50%;
  transform: rotateX(16deg);
  transition: transform 0.5s ease-out;
  will-change: transform;
  // Clicking slices shouldn't select the SVG numbers/titles as text.
  user-select: none;
}

// The wobble only runs during a spin; at rest the wheel is static, so clicking
// slices is reliable. The keyframes pass through the rest tilt (0/50/100%) so it
// blends in and out, and the transition eases any leftover when it stops.
.wheel.spinning {
  animation: wheel-wobble 2.8s ease-in-out infinite;
}

@keyframes wheel-wobble {
  0%,
  100% {
    transform: rotateX(16deg);
  }
  25% {
    transform: rotateX(14.5deg) rotateY(2.6deg) rotateZ(0.6deg);
  }
  75% {
    transform: rotateX(17.5deg) rotateY(-2.6deg) rotateZ(-0.6deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wheel.spinning {
    animation: none;
  }
}

// The wheel's thickness: stacked hard box-shadows step straight down to form a
// solid dark "side wall" under the disc, darkening with depth, plus a soft cast
// shadow on the ground. It doesn't spin, so the edge stays put under the tilt.
.disc-base {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: 50%;
  pointer-events: none;
  background: #1b1f27;
  box-shadow:
    0 1px 0 #1a1e26,
    0 2px 0 #191d25,
    0 3px 0 #181c23,
    0 4px 0 #171b22,
    0 5px 0 #161920,
    0 6px 0 #15181f,
    0 7px 0 #14171e,
    0 8px 0 #13161c,
    0 9px 0 #12151b,
    0 10px 0 #111419,
    0 11px 0 #101318,
    0 12px 0 #0f1217,
    0 13px 0 #0e1116,
    0 14px 0 #0d1014,
    0 15px 0 #0c0f13,
    0 16px 0 #0b0e12,
    0 26px 30px rgba(0, 0, 0, 0.55);
}

.disc {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  transform-origin: 50% 50%;
  /* The SVG clips to its viewport by default; allow a hovered slice to grow
     past the rim without being cut off. */
  overflow: visible;
  /* The transition (duration + easing) is driven from script. */
}

.disc-sheen {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: 50%;
  pointer-events: none;
  background:
    radial-gradient(
      135% 110% at 30% 22%,
      rgba(255, 255, 255, 0.38) 0%,
      rgba(255, 255, 255, 0.1) 22%,
      rgba(255, 255, 255, 0) 43%
    ),
    radial-gradient(circle at 50% 54%, rgba(0, 0, 0, 0) 58%, rgba(0, 0, 0, 0.34) 100%);
}

// Hovering a slice grows it outward from the wheel centre, so it juts past the
// rim within its own wedge (no neighbour overlap, so nothing covers it). Gated
// to the resting wheel - no hover-grow mid-spin.
.slice-group {
  transform-box: view-box;
  transform-origin: 50% 50%;
  transition: transform 0.16s ease-out;
}

.wheel:not(.spinning) .slice-group:hover {
  transform: scale(1.065);
}

.slice {
  stroke: rgba(0, 0, 0, 0.35);
  stroke-width: 1.5;
  cursor: pointer;
  transition:
    filter 0.45s ease-out,
    opacity 0.45s ease-out;
}

/* Once a winner is locked in, fade the rest back so the chosen slice pops. */
.slice.dim {
  filter: saturate(0.4) brightness(0.85);
  opacity: 0.85;
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
  top: 50%;
  left: -6px;
  z-index: 3;
  width: 0;
  height: 0;
  transform: translateY(-50%);
  border-top: 16px solid transparent;
  border-bottom: 16px solid transparent;
  border-left: 30px solid #ffffff;
  filter: drop-shadow(2px 0 3px rgba(0, 0, 0, 0.5));
}
</style>
