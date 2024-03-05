<template>
  <div
    class="action-icon"
    @click="sendAction"
    @keyup.enter.space="sendAction"
    tabindex="0"
    :style="{ '--count': count }"
    :class="{ hasCount: count > 0, userHighlight, scale }">
    <div v-if="icon" class="icon material-symbols-rounded">{{ icon }}</div>
    <div :class="{ showing: count > 0 }" class="count-badge">{{ count || 1 }}</div>
    <div class="label">{{ value || label }}</div>
  </div>
</template>

<script setup lang="ts">
import { ActionType } from "@/domain/types";

const props = defineProps<{
  icon?: string;
  userHighlight?: boolean;
  scale?: boolean;
  type: ActionType;
  value?: string | number;
  count: number;
  label?: string;
}>();

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
  border: 5px solid #ddd;
  padding: 10px;
  user-select: none;

  transition: all 0.15s ease-out;

  &.scale {
    font-size: min(calc(16px + var(--count) * 12px), 64px);
  }

  .icon {
    font-size: 96px;
    min-width: 96px;
    min-height: 96px;
    transition: all 0.1s ease-out;
  }

  &.hasCount {
    border: 5px solid var(--brand-color) !important;

    .icon {
      font-size: 128px;
    }
  }

  &.userHighlight {
    background: var(--brand-color-2);
    color: white;
  }

  &:hover {
    background: var(--brand-color-2);
    border-color: var(--brand-color-2);
    color: white;
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
    transition: all 0.15s ease-out;
    pointer-events: none;
    aspect-ratio: 1 / 1;

    &.showing {
      opacity: 1;
    }
  }
}
</style>
