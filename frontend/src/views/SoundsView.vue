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
          Random drumrolls pick fantastic ones 3x and fine ones 2x as often as meh ones. Votes
          are counted across all sessions.
        </p>
        <div class="sort" role="group" aria-label="Sort drumrolls">
          <button
            v-for="(label, mode) in SORT_LABELS"
            :key="mode"
            :class="{ active: sortMode === mode }"
            @click="sortMode = mode">
            {{ label }}
          </button>
        </div>
        <p v-if="sortMode === 'dropped' && !drumrollGroups.length" class="message">
          No drumroll has been voted Drop yet.
        </p>
        <div v-for="group in drumrollGroups" :key="group.key" class="sound-group">
          <h3>{{ group.title }} ({{ group.items.length }})</h3>
          <div class="sound-grid">
            <sound-tile
              v-for="d in group.items"
              :key="d.id"
              :label="d.label"
              :file="`/drumrolls/${d.id}.mp3`"
              :playing="playingFile === `/drumrolls/${d.id}.mp3`"
              :summary="ratingSummary(d.id)"
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
  DRUMROLL_RATINGS,
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

type SortMode = "group" | "loved" | "dropped";
const SORT_LABELS: Record<SortMode, string> = {
  group: "By group",
  loved: "Most loved",
  dropped: "Most dropped",
};
// Fantastic counts most toward "loved"; Too long and Drop count against it.
const LOVE_SCORE: Record<string, number> = {
  Fantastic: 2,
  Fine: 1,
  Meh: 0,
  "Too long": -1,
  Drop: -2,
};

const sortMode = ref<SortMode>("group");
const ratings = ref<Record<string, Record<string, number>>>({});
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
    ratings.value = data.ratings ?? {};
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

function count(id: string, rating: string): number {
  return ratings.value[id]?.[rating] ?? 0;
}

function ratingSummary(id: string): string {
  const parts = DRUMROLL_RATINGS.filter((r) => count(id, r)).map(
    (r) => `${count(id, r)} ${r.toLowerCase()}`,
  );
  return parts.length ? parts.join(" · ") : "No votes yet";
}

function loveScore(id: string): number {
  return DRUMROLL_RATINGS.reduce((sum, r) => sum + count(id, r) * (LOVE_SCORE[r] ?? 0), 0);
}

const drumrollGroups = computed(() => {
  const visible = drumrolls.value.filter((d) => matches(d.label));
  if (sortMode.value === "group") {
    return TIERS.map((tier) => ({
      key: tier,
      title: TIER_LABELS[tier],
      items: visible.filter((d) => d.tier === tier),
    })).filter((g) => g.items.length);
  }
  const sorted =
    sortMode.value === "loved"
      ? [...visible].sort((a, b) => loveScore(b.id) - loveScore(a.id))
      : [...visible]
          .filter((d) => count(d.id, "Drop") > 0)
          .sort((a, b) => count(b.id, "Drop") - count(a.id, "Drop"));
  return sorted.length
    ? [{ key: sortMode.value, title: SORT_LABELS[sortMode.value], items: sorted }]
    : [];
});

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

.sort {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--spacer) * 0.4);

  button {
    padding: 0.3em 0.7em;
    border: 2px solid var(--brand-color-1);
    border-radius: var(--radius);
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;

    &.active {
      background: var(--brand-color-1);
      color: white;
    }
  }
}
</style>
