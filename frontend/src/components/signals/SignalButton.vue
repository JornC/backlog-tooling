<template>
  <div
    class="action-icon"
    :style="{ '--count': count, ...clownStyle }"
    tabindex="0"
    @click="sendAction(type)"
    @keyup.enter.space="sendAction(type)"
    :class="{ hasCount: count > 0, userHighlight, clown: contextStore.theme === 'funner' }">
    <div v-if="icon" class="icon material-symbols-rounded">{{ icon }}</div>
    <div :class="{ showing: count > 0 }" class="count-badge">{{ count || 1 }}</div>
    <div class="label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
import { ActionType } from "@/domain/types";
import { useContextStore } from "@/stores/contextStore";
import { useClownStyle } from "@/composables/useClownStyle";

const props = defineProps<{
  icon?: string;
  userHighlight?: boolean;
  sound?: string;
  playSound?: boolean;
  type: ActionType;
  label: string | number;
  count: number;
  soundCount: number;
}>();

const clownStyle = useClownStyle();
const contextStore = useContextStore();

const emit = defineEmits<{
  (event: "sendAction", value: ActionType): void;
}>();

function sendAction(eventType: ActionType): void {
  emit("sendAction", eventType);
}

const audioPlayer = ref<HTMLAudioElement | null>(null);

watch(
  () => props.soundCount,
  (newCount, oldCount) => {
    if (contextStore.isSoundEmbargoed) {
      return;
    }

    if (newCount > oldCount && props.sound && props.playSound) {
      if (!audioPlayer.value) {
        audioPlayer.value = new Audio(props.sound);
      }

      audioPlayer.value.play().catch((e) => console.error("Error playing sound:", e));
    }
  },
);
</script>

<style lang="scss" scoped>
.action-icon {
  position: relative;
  cursor: pointer;
  color: var(--brand-color-1);
  border: 2px solid #ddd;
  border-radius: var(--radius);
  padding: 10px;
  user-select: none;
  transition: all 0.15s ease-out;

  * {
    transition: all 0.15s ease-out;
  }

  &.userHighlight {
    background: var(--brand-color-2);
    color: white;
    z-index: 1;
  }

  .icon {
    font-size: 48px;
    min-width: 48px;
    min-height: 48px;
  }

  &.hasCount {

    .icon {
      font-size: min(calc(56px + var(--count) * 4px), 72px);
    }
  }

  &.clown.hasCount {
    animation-name: clown-rotate, clown-skew, clown-scale;
    animation-duration: var(--clown-r-dur), var(--clown-s-dur), var(--clown-sc-dur);
    animation-timing-function: ease-in-out, ease-in-out, ease-in-out;
    animation-delay: var(--clown-r-delay), var(--clown-s-delay), var(--clown-sc-delay);
    animation-iteration-count: infinite, infinite, infinite;
    animation-direction: alternate, alternate, alternate;
  }

  &:hover {
    background: var(--brand-color-2);
    border-color: var(--brand-color-2);
    color: white;
    transform: scale(var(--hover-scale)) rotate(var(--hover-rotate));
  }

  .label {
    text-align: center;
    font-weight: bold;
  }

  .count-badge {
    position: absolute;
    top: -12px;
    right: -12px;
    font-size: 14px;
    width: 14px;
    height: 14px;
    padding: 6px;
    border-radius: 50%;
    line-height: 14px;
    font-weight: bold;

    background-color: var(--brand-color-3);
    color: black;
    text-align: center;
    opacity: 0;
    transition: opacity 0.15s ease-out;
    pointer-events: none;
    aspect-ratio: 1 / 1;

    &.showing {
      opacity: 1;
    }
  }
}

@keyframes clown-rotate {
  from {
    rotate: var(--clown-r);
  }
  to {
    rotate: calc(var(--clown-r) * -1);
  }
}

@keyframes clown-skew {
  from {
    transform: skew(var(--clown-s));
  }
  to {
    transform: skew(calc(var(--clown-s) * -1));
  }
}

@keyframes clown-scale {
  from {
    scale: var(--clown-sc);
  }
  to {
    scale: calc(1 / var(--clown-sc));
  }
}
</style>
