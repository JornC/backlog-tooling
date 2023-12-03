<template>
  <div class="action-icon" @click="sendAction(type)" :class="{ hasCount: count > 0 }">
    <div class="icon material-icons">{{ icon }}</div>
    <div :class="{ showing: count > 0 }" class="count-badge">{{ count || 1 }}</div>
    <div class="label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
import { ActionType } from "@/domain/types";

defineProps<{
  icon: string;
  type: ActionType;
  label: string;
  count: number;
}>();

const emit = defineEmits<{
  (event: "sendAction", value: ActionType): void;
}>();

function sendAction(eventType: ActionType): void {
  emit("sendAction", eventType);
}
</script>

<style lang="scss" scoped>
.action-icon {
  position: relative;
  cursor: pointer;
  color: var(--brand-color-1);
  border: 5px solid #ddd;
  padding: 10px;

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
