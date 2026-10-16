<template>
  <div ref="stageRef" class="spotlight-stage" aria-hidden="true">
    <div class="house-lights"></div>
    <div class="hot-spot" :style="hotSpotStyle">
      <span v-for="n in 5" :key="n" class="sparkle"></span>
    </div>
    <div
      v-for="lamp in LAMPS"
      :key="`beam-${lamp.name}`"
      class="rig light"
      :class="lamp.name"
      :style="rigStyle(lamp)">
      <div class="sweep"><div class="beam"></div></div>
    </div>
    <div class="truss"></div>
    <div
      v-for="lamp in LAMPS"
      :key="`can-${lamp.name}`"
      class="rig fixture"
      :class="lamp.name"
      :style="rigStyle(lamp)">
      <div class="sweep">
        <div class="can">
          <span class="eye"></span>
          <span class="eye"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Lamp {
  name: string;
  /** Horizontal position as a fraction of the stage width. */
  x: number;
  rgb: string;
}

const LAMPS: Lamp[] = [
  { name: "left", x: 0.18, rgb: "255, 236, 170" },
  { name: "center", x: 0.5, rgb: "255, 150, 215" },
  { name: "right", x: 0.82, rgb: "140, 225, 255" },
];
// Where each lamp swivels, measured from the top of the stage.
const PIVOT_Y = 26;

const props = defineProps<{ target?: HTMLElement }>();

const stageRef = ref<HTMLElement>();
const layout = ref({ stageWidth: 0, x: 0, y: 0, width: 0, height: 0 });

function measure() {
  const stage = stageRef.value;
  if (!stage || !props.target) {
    return;
  }
  const s = stage.getBoundingClientRect();
  const t = props.target.getBoundingClientRect();
  const next = {
    stageWidth: s.width,
    x: t.left - s.left + t.width / 2,
    y: t.top - s.top + t.height / 2,
    width: t.width,
    height: t.height,
  };
  const prev = layout.value;
  const moved = (Object.keys(next) as Array<keyof typeof next>).some(
    (k) => Math.abs(next[k] - prev[k]) > 0.5,
  );
  if (moved) {
    layout.value = next;
  }
}

// The title shifts whenever the content around it grows, so follow it every frame
// instead of guessing which resize to watch.
let frame = 0;
function track() {
  measure();
  frame = requestAnimationFrame(track);
}
onMounted(track);
onUnmounted(() => cancelAnimationFrame(frame));

function rigStyle(lamp: Lamp) {
  const { stageWidth, x, y } = layout.value;
  const aim = -Math.atan2(x - lamp.x * stageWidth, y - PIVOT_Y) * (180 / Math.PI);
  return {
    left: `${lamp.x * 100}%`,
    top: `${PIVOT_Y}px`,
    transform: `rotate(${aim}deg)`,
    "--beam-rgb": lamp.rgb,
  };
}

const hotSpotStyle = computed(() => ({
  left: `${layout.value.x}px`,
  top: `${layout.value.y}px`,
  width: `${layout.value.width * 1.6}px`,
  height: `${layout.value.height * 2.6}px`,
}));
</script>

<style lang="scss" scoped>
// One show cycle: the lamps search around, all land on the title together from 40% to
// 64%, then wander off again. The sweeps, hot spot and sparkles share it to stay in sync.
$cycle: 9s;

.spotlight-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.house-lights {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 35%, rgba(20, 14, 48, 0.3), rgba(20, 14, 48, 0.62));
  animation: lights-down 0.8s ease-out both;
}

.truss {
  position: absolute;
  top: 6px;
  left: 10%;
  right: 10%;
  height: 8px;
  border-radius: 4px;
  background: repeating-linear-gradient(60deg, #3a3a46 0 6px, #6b6b7a 6px 9px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.rig {
  position: absolute;
  width: 0;
  height: 0;
  transform-origin: 0 0;
  transition: transform 0.3s ease-out;
}

// Only the beams brighten what they hit; the lamp bodies stay solid.
.light {
  mix-blend-mode: screen;
}

.sweep {
  position: absolute;
  transform-origin: 0 0;
  animation: $cycle cubic-bezier(0.34, 1.56, 0.64, 1) infinite;

  .left & {
    animation-name: sweep-left;
  }
  .center & {
    animation-name: sweep-center;
  }
  .right & {
    animation-name: sweep-right;
  }
}

.beam {
  position: absolute;
  left: -700px;
  top: 20px;
  width: 1400px;
  height: 1600px;
  background: conic-gradient(
    from 166deg at 50% 0%,
    transparent 0deg,
    rgba(var(--beam-rgb), 0.45) 7deg,
    rgba(var(--beam-rgb), 0.45) 21deg,
    transparent 28deg
  );
  mask-image: radial-gradient(circle 1300px at 50% 0%, #000 0, #000 360px, transparent 1100px);
  animation: power-on 0.8s linear both;

  .left & {
    animation-delay: 0.3s;
  }
  .right & {
    animation-delay: 0.65s;
  }
  .center & {
    animation-delay: 1s;
  }
}

.can {
  position: absolute;
  left: -20px;
  top: -14px;
  width: 40px;
  height: 36px;
  border-radius: 10px 10px 6px 6px;
  background: linear-gradient(90deg, #1d1d24, #4f4f5e 45%, #1d1d24);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.45);

  // The lens, glowing in the beam's colour.
  &::after {
    content: "";
    position: absolute;
    left: 4px;
    right: 4px;
    bottom: -4px;
    height: 9px;
    border-radius: 50%;
    background: rgb(var(--beam-rgb));
    box-shadow: 0 0 14px 5px rgba(var(--beam-rgb), 0.9);
  }
}

.eye {
  position: absolute;
  top: 9px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: white;
  box-shadow: inset 0 0 0 1px #222;

  &:first-child {
    left: 5px;
  }
  &:last-child {
    right: 5px;
  }

  &::after {
    content: "";
    position: absolute;
    left: 4px;
    top: 6px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #111;
    animation: googly 0.7s ease-in-out infinite alternate;
  }

  &:last-child::after {
    animation-duration: 0.55s;
    animation-delay: -0.2s;
  }
}

.hot-spot {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  mix-blend-mode: screen;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 248, 220, 0.3),
    rgba(255, 248, 220, 0.2) 45%,
    transparent 70%
  );
  animation: spot-on $cycle ease-in-out infinite;
}

.sparkle {
  position: absolute;
  width: 22px;
  height: 22px;
  background: #fffbe6;
  clip-path: polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%);
  animation: ta-da $cycle ease-out infinite;

  &:nth-child(1) {
    left: 8%;
    top: 12%;
  }
  &:nth-child(2) {
    right: 6%;
    top: 4%;
    animation-delay: 0.08s;
  }
  &:nth-child(3) {
    left: 18%;
    bottom: 6%;
    animation-delay: 0.16s;
  }
  &:nth-child(4) {
    right: 14%;
    bottom: 12%;
    animation-delay: 0.04s;
  }
  &:nth-child(5) {
    left: 48%;
    top: -4%;
    animation-delay: 0.12s;
  }
}

@keyframes lights-down {
  from {
    opacity: 0;
  }
}

@keyframes power-on {
  0% {
    opacity: 0;
  }
  8% {
    opacity: 1;
  }
  14% {
    opacity: 0.15;
  }
  22% {
    opacity: 0.9;
  }
  28% {
    opacity: 0.3;
  }
  100% {
    opacity: 1;
  }
}

// Angles are relative to the title; 0deg means "pointing right at it".
@keyframes sweep-left {
  0%,
  100% {
    transform: rotate(-55deg);
  }
  14% {
    transform: rotate(30deg);
  }
  28% {
    transform: rotate(-20deg);
  }
  40%,
  64% {
    transform: rotate(0deg);
  }
  52% {
    transform: rotate(2deg);
  }
  80% {
    transform: rotate(45deg);
  }
}

@keyframes sweep-center {
  0%,
  100% {
    transform: rotate(40deg);
  }
  12% {
    transform: rotate(-45deg);
  }
  26% {
    transform: rotate(25deg);
  }
  40%,
  64% {
    transform: rotate(0deg);
  }
  52% {
    transform: rotate(-2deg);
  }
  78% {
    transform: rotate(-35deg);
  }
  90% {
    transform: rotate(20deg);
  }
}

@keyframes sweep-right {
  0%,
  100% {
    transform: rotate(50deg);
  }
  16% {
    transform: rotate(-25deg);
  }
  30% {
    transform: rotate(35deg);
  }
  40%,
  64% {
    transform: rotate(0deg);
  }
  52% {
    transform: rotate(2deg);
  }
  82% {
    transform: rotate(-50deg);
  }
}

@keyframes spot-on {
  0%,
  40% {
    opacity: 0;
  }
  44%,
  64% {
    opacity: 1;
  }
  69%,
  100% {
    opacity: 0;
  }
}

@keyframes ta-da {
  0%,
  41% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  45% {
    transform: scale(1.3) rotate(45deg);
    opacity: 1;
  }
  50%,
  60% {
    transform: scale(0.9) rotate(90deg);
    opacity: 1;
  }
  66%,
  100% {
    transform: scale(0) rotate(180deg);
    opacity: 0;
  }
}

@keyframes googly {
  0% {
    transform: translate(-2px, 0);
  }
  50% {
    transform: translate(1px, -2px);
  }
  100% {
    transform: translate(2px, 1px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .house-lights,
  .sweep,
  .beam,
  .eye::after {
    animation: none;
  }

  .hot-spot {
    animation: none;
    opacity: 1;
  }

  .sparkle {
    display: none;
  }
}
</style>
