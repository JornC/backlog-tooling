<template>
  <div class="vibes">
    <button
      v-for="vibe in VIBES"
      :key="vibe"
      type="button"
      class="vibe"
      :disabled="locked"
      :style="{ '--vibe-color': rgb(vibe) }"
      :title="VIBE_META[vibe].label"
      @click="send(vibe, $event)">
      <span v-if="vibePercents[vibe]" class="percent-badge">{{ vibePercents[vibe] }}%</span>
      <span class="icon material-symbols-rounded">{{ VIBE_META[vibe].icon }}</span>
      <span class="label">{{ VIBE_META[vibe].label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { VIBES, VIBE_META, type Vibe } from "@/domain/types";
import { useSocketStore } from "@/ws/socketManager";
import { useRoomMood } from "@/composables/useRoomMood";

defineProps<{
  locked?: boolean;
}>();

const socketStore = useSocketStore();
const { vibePercents } = useRoomMood();

function rgb(vibe: Vibe): string {
  const [r, g, b] = VIBE_META[vibe].color;
  return `rgb(${r}, ${g}, ${b})`;
}

function send(vibe: Vibe, event: MouseEvent): void {
  socketStore.emitVibe(vibe);
  // Fresh pop on every click so rapid clicking (a "strong" vibe) keeps reacting.
  (event.currentTarget as HTMLElement).animate(
    [{ transform: "scale(0.88)" }, { transform: "scale(1)" }],
    { duration: 160, easing: "ease-out" },
  );
}
</script>

<style lang="scss" scoped>
.vibes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: calc(var(--spacer) * 0.5);
}

.vibe {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  background: transparent;
  color: var(--vibe-color);
  border: 2px solid var(--vibe-color);
  border-radius: var(--radius);
  padding: 10px 6px;
  font-size: 0.8em;
  transition: all 0.15s ease-out;

  .percent-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    min-width: 16px;
    padding: 2px 5px;
    border-radius: 999px;
    background: var(--vibe-color);
    color: white;
    font-size: 0.7em;
    font-weight: bold;
    line-height: 1.2;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    transition: all 0.3s ease-out;
  }

  .icon {
    font-size: 32px;
    line-height: 1;
  }

  .label {
    font-weight: bold;
    text-align: center;
  }

  &:hover:not(:disabled) {
    background: var(--vibe-color);
    color: white;
  }

  &:active:not(:disabled) {
    background: var(--vibe-color);
    color: white;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>
