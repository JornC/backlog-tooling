<template>
  <div class="sounds-page">
    <header class="sounds-header">
      <router-link class="back" :to="{ name: 'home' }">
        <span class="material-symbols-rounded">arrow_back</span>
        Home
      </router-link>
      <h1>Sounds</h1>
      <input
        v-model="query"
        class="search"
        type="search"
        placeholder="Search sounds"
        autocomplete="off"
        spellcheck="false" />
    </header>

    <p v-if="loadError" class="message">Could not load the sound list.</p>
    <p v-else-if="loading" class="message">Loading...</p>

    <template v-else>
      <section class="sound-section">
        <h2>Drumrolls</h2>
        <p class="hint">
          Random drumrolls pick fantastic ones 3x and fine ones 2x as often as meh ones.
        </p>
        <div v-for="group in drumrollGroups" :key="group.tier" class="sound-group">
          <h3>{{ TIER_LABELS[group.tier] }} ({{ group.items.length }})</h3>
          <div class="sound-grid">
            <sound-tile
              v-for="d in group.items"
              :key="d.id"
              :label="d.label"
              :file="`/drumrolls/${d.id}.mp3`"
              :playing="playingFile === `/drumrolls/${d.id}.mp3`"
              @toggle="toggle" />
          </div>
        </div>
      </section>

      <section class="sound-section">
        <h2>Vibe sounds</h2>
        <p class="hint">Plays when a vibe hits 100%, at most once a minute per room.</p>
        <div
          v-for="group in vibeGroups"
          :key="group.vibe"
          class="sound-group"
          :style="{ '--vibe-color': vibeColor(group.vibe) }">
          <h3 class="vibe-title">
            <span class="material-symbols-rounded">{{ VIBE_META[group.vibe].icon }}</span>
            {{ VIBE_META[group.vibe].label }} ({{ group.items.length }})
          </h3>
          <div class="sound-grid">
            <sound-tile
              v-for="v in group.items"
              :key="v.id"
              :label="vibeSoundLabel(v)"
              :file="`/vibes/${v.id}.mp3`"
              :playing="playingFile === `/vibes/${v.id}.mp3`"
              @toggle="toggle" />
          </div>
        </div>
      </section>

      <p v-if="!drumrollGroups.length && !vibeGroups.length" class="message">
        No sounds match "{{ query }}".
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import SoundTile from "@/components/sounds/SoundTile.vue";
import {
  VIBES,
  VIBE_META,
  type Drumroll,
  type DrumrollTier,
  type Vibe,
  type VibeSound,
} from "@/domain/types";

const TIERS: DrumrollTier[] = ["fantastic", "fine", "meh"];
const TIER_LABELS: Record<DrumrollTier, string> = {
  fantastic: "Fantastic",
  fine: "Fine",
  meh: "Meh",
};

const drumrolls = ref<Drumroll[]>([]);
const vibeSounds = ref<VibeSound[]>([]);
const loading = ref(true);
const loadError = ref(false);
const query = ref("");

onMounted(async () => {
  try {
    const res = await fetch("/api/sounds");
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    drumrolls.value = data.drumrolls;
    vibeSounds.value = data.vibeSounds;
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
});

function matches(text: string): boolean {
  return text.toLowerCase().includes(query.value.trim().toLowerCase());
}

/** "coffee-tired-grandpa" -> "Tired grandpa": drop the vibe prefix, humanize the rest. */
function vibeSoundLabel(sound: VibeSound): string {
  const words = sound.id.split("-").slice(1).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const drumrollGroups = computed(() =>
  TIERS.map((tier) => ({
    tier,
    items: drumrolls.value.filter((d) => d.tier === tier && matches(d.label)),
  })).filter((g) => g.items.length),
);

const vibeGroups = computed(() =>
  VIBES.map((vibe) => ({
    vibe,
    items: vibeSounds.value.filter(
      (v) => v.vibe === vibe && (matches(vibeSoundLabel(v)) || matches(VIBE_META[vibe].label)),
    ),
  })).filter((g) => g.items.length),
);

function vibeColor(vibe: Vibe): string {
  const [r, g, b] = VIBE_META[vibe].color;
  return `rgb(${r}, ${g}, ${b})`;
}

const player = new Audio();
player.volume = 0.5;
const playingFile = ref<string | undefined>();
player.addEventListener("ended", () => (playingFile.value = undefined));
player.addEventListener("error", () => (playingFile.value = undefined));

function toggle(file: string) {
  if (playingFile.value === file) {
    player.pause();
    playingFile.value = undefined;
    return;
  }
  player.src = file;
  playingFile.value = file;
  player.play().catch(() => (playingFile.value = undefined));
}

onBeforeUnmount(() => player.pause());
</script>

<style lang="scss" scoped>
.sounds-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--spacer);
  box-sizing: border-box;
}

.sounds-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacer);
  margin-bottom: var(--spacer);

  h1 {
    margin: 0;
    flex: 1;
  }

  .back {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
    color: var(--brand-color-1);
  }

  .search {
    flex: 0 1 260px;
    min-width: 0;
    padding: 0.4em 0.6em;
    font: inherit;
  }
}

.sound-section {
  margin-bottom: calc(var(--spacer) * 2);

  h2 {
    margin-bottom: 0.2em;
  }
}

.hint {
  margin-top: 0;
  opacity: 0.7;
}

.sound-group {
  margin-bottom: var(--spacer);

  h3 {
    margin: calc(var(--spacer) * 0.75) 0 calc(var(--spacer) * 0.4);
  }
}

.vibe-title {
  display: flex;
  align-items: center;
  gap: 0.3em;
  color: var(--vibe-color);
}

.sound-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: calc(var(--spacer) * 0.5);
}

.message {
  opacity: 0.7;
}
</style>
