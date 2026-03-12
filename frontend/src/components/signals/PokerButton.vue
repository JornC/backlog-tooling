<template>
  <div
    class="action-icon"
    @click="sendAction"
    @keyup.enter.space="sendAction"
    tabindex="0"
    :style="{ '--count': count, ...clownStyle }"
    :class="{ hasCount: count > 0, userHighlight, scale, clown: contextStore.theme === 'funner' }">
    <div v-if="icon" class="icon material-symbols-rounded">{{ icon }}</div>
    <div :class="{ showing: count > 0 }" class="count-badge">{{ count || 1 }}</div>
    <div class="label">{{ value || label }}</div>
  </div>
</template>

<script setup lang="ts">
import { ActionType } from "@/domain/types";
import { useClownStyle } from "@/composables/useClownStyle";
import { useContextStore } from "@/stores/contextStore";

const props = defineProps<{
  icon?: string;
  userHighlight?: boolean;
  scale?: boolean;
  type: ActionType;
  value?: string | number;
  count: number;
  label?: string;
}>();

const clownStyle = useClownStyle();
const contextStore = useContextStore();

const emit = defineEmits<{
  (event: "sendAction"): void;
}>();

function sendAction(): void {
  emit("sendAction");
}
</script>

<style lang="scss" scoped>
.action-icon {
  position: relative;
  cursor: pointer;
  color: var(--brand-color-1);
  border: var(--signal-border-width) var(--signal-border-style) #ddd;
  border-radius: var(--radius);
  padding: 10px;
  user-select: none;
  transition: all 0.15s ease-out;

  * {
    transition: all 0.15s ease-out;
  }

  &.scale {
    font-size: min(calc(16px + var(--count) * 12px), 64px);
  }

  .icon {
    font-size: 96px;
    min-width: 96px;
    min-height: 96px;
    transition: font-size 0.15s ease-out;
  }

  &.hasCount {
    border: var(--signal-border-width) var(--signal-border-style) var(--brand-color) !important;

    .icon {
      font-size: 128px;
    }
  }

  &.userHighlight {
    background: var(--brand-color-2);
    color: white;
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
    top: -20px;
    right: -20px;
    font-size: 20px;
    width: 20px;
    height: 20px;
    padding: 10px;
    border-radius: 50%;
    line-height: 20px;
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
