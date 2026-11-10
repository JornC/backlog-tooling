<template>
  <div class="sound-tile" :class="{ playing }">
    <button class="play" :aria-label="(playing ? 'Stop ' : 'Play ') + label" @click="emit('toggle', file)">
      <span class="material-symbols-rounded">{{ playing ? "stop" : "play_arrow" }}</span>
      <span class="text">
        <span class="label">{{ label }}</span>
        <span v-if="summary" class="summary">{{ summary }}</span>
      </span>
    </button>
    <a class="open" :href="file" target="_blank" rel="noopener" :title="`Open ${label} mp3`">
      <span class="material-symbols-rounded">open_in_new</span>
    </a>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  file: string;
  playing: boolean;
  summary?: string;
}>();

const emit = defineEmits<{
  (event: "toggle", file: string): void;
}>();
</script>

<style lang="scss" scoped>
.sound-tile {
  display: flex;
  align-items: stretch;
  border: 2px solid var(--vibe-color, var(--brand-color-1));
  border-radius: var(--radius);
  transition: background var(--anim);

  &.playing {
    background: color-mix(in srgb, var(--vibe-color, var(--brand-color-1)) 20%, transparent);
  }
}

.play {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.4em 0.6em;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .label,
  .summary {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .summary {
    font-size: 0.8em;
    opacity: 0.7;
  }
}

.open {
  display: flex;
  align-items: center;
  padding: 0 0.5em;
  color: inherit;
  opacity: 0.6;

  &:hover {
    opacity: 1;
  }

  .material-symbols-rounded {
    font-size: 1.1em;
  }
}
</style>
