<template>
  <div class="home-container">
    <div class="home-card">
      <p class="tagline">A shared session for working through agenda items together.</p>
      <div class="session-notice" :class="{ active: socketStore.hasPin }">
        <span class="material-symbols-rounded notice-icon">
          {{ socketStore.hasPin ? "play_circle" : "pause_circle" }}
        </span>
        <div>
          <p class="notice-title">
            {{ socketStore.hasPin ? "Session is active" : "Session is not yet active" }}
          </p>
          <p class="notice-body">
            {{
              socketStore.hasPin
                ? "The agenda is available in the sidebar. The moderator will navigate to each item as the session progresses."
                : "Wait for the moderator to start the session."
            }}
          </p>
        </div>
      </div>

      <!-- State 1: Not identified -->
      <template v-if="!socketStore.isIdentified">
        <div class="name-group">
          <label class="group-label">Optionally set your name</label>
          <div class="name-row">
            <input
              type="text"
              v-model="name"
              placeholder="Your name"
              @keyup.enter="updateName" />
            <button @click="updateName">
              <span class="material-symbols-rounded">badge</span>
            </button>
          </div>
          <p class="hint" v-if="!showError">Needed for moderation and scratchboard contributions.</p>
          <p class="error" v-if="showError">Enter a name first</p>
          <button class="subtle" @click="pickRandomName">
            <span class="material-symbols-rounded button-icon">shuffle</span>
            Random name: {{ randomName }}
          </button>
        </div>
      </template>

      <!-- State 2: Identified, no moderator -->
      <template v-else-if="!socketStore.moderator && !socketStore.moderatorReconnecting">
        <p class="greeting">Welcome, <strong>{{ socketStore.name }}</strong></p>
        <button class="primary" @click="claimModeration">
          <span class="material-symbols-rounded button-icon">stars</span>
          Claim moderation
        </button>
        <p class="subtle-text">Or wait for someone else to moderate.</p>
      </template>

      <!-- State 2b: Moderator reconnecting (grace period) -->
      <template v-else-if="socketStore.moderatorReconnecting">
        <p class="greeting">
          <strong>{{ socketStore.moderatorGraceName }}</strong> is reconnecting...
        </p>
        <button class="primary" @click="claimModeration">
          <span class="material-symbols-rounded button-icon">stars</span>
          Claim moderation
        </button>
        <p class="subtle-text">The moderator may return shortly.</p>
      </template>

      <!-- State 3: Identified, someone else is moderating -->
      <template v-else-if="!socketStore.isModerator">
        <p class="greeting">
          <strong>{{ socketStore.moderator }}</strong> is moderating
        </p>
        <p class="subtle-text">
          Follow along via the sidebar - the moderator will navigate to each item.
        </p>
      </template>

      <!-- State 4: You are the moderator -->
      <template v-else>
        <p class="greeting">You are moderating</p>
        <button class="primary" @click="openSessionTab">
          <span class="material-symbols-rounded button-icon">settings</span>
          Open Session tab to set PIN and schedule
        </button>
      </template>

      <!-- Changelog: collapsed at bottom -->
      <div class="changelog-toggle" @click="changelogRevealed = !changelogRevealed">
        Changelog <span class="reveal">{{ changelogRevealed ? "-" : "+" }}</span>
      </div>
      <template v-if="changelogRevealed">
        <article v-for="entry in changelog.slice().reverse()" :key="entry.version">
          <h3>
            {{ entry.version }} -
            <time :datetime="entry.date.toISOString()">{{ formatDate(entry.date) }}</time>
          </h3>
          <ul>
            <li v-for="change in entry.changes" :key="change.description">
              <strong>{{ change.type }}:</strong> {{ change.description }}
            </li>
          </ul>
        </article>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useContextStore } from "@/stores/contextStore";
import { useSocketStore } from "@/ws/socketManager";
import dockerNames from "docker-names";

interface Change {
  type: string;
  description: string;
}

interface ChangelogEntry {
  version: string;
  date: Date;
  changes: Change[];
}

const socketStore = useSocketStore();
const contextStore = useContextStore();

const name = ref(socketStore.name || localStorage.getItem("moderatorName") || "");
const showError = ref(false);
const randomName = ref(generateRandomName());
const changelogRevealed = ref(false);

function updateName() {
  if (!name.value) {
    showError.value = true;
    return;
  }

  showError.value = false;
  localStorage.setItem("moderatorName", name.value);
  socketStore.updateName(name.value);
}

function pickRandomName() {
  name.value = randomName.value;
  localStorage.removeItem("moderatorName");
  socketStore.updateName(randomName.value);
  randomName.value = generateRandomName();
}

function generateRandomName(): string {
  return dockerNames
    .getRandomName()
    .split("_")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function claimModeration() {
  socketStore.claimModeration();
  contextStore.setUserPanelActive(true);
}

function openSessionTab() {
  contextStore.setUserPanelActive(true);
}

const changelog = ref<ChangelogEntry[]>([
  {
    version: "v0.1",
    date: new Date("2023-12-03"),
    changes: [
      { type: "Added", description: "Signal mechanism" },
      { type: "Added", description: "Estimation mechanism" },
    ],
  },
  {
    version: "v0.2",
    date: new Date("2023-12-04"),
    changes: [
      { type: "Added", description: "Schedule" },
      { type: "Added", description: "Moderator panel" },
    ],
  },
  {
    version: "v1.0",
    date: new Date("2023-12-05"),
    changes: [
      { type: "Updated", description: "Estimates split into test/dev" },
      { type: "Added", description: "Drumroll" },
    ],
  },
  {
    version: "v1.1",
    date: new Date("2023-12-10"),
    changes: [{ type: "Updated", description: "Estimate reveal is now a moderator responsibility" }],
  },
  {
    version: "v1.2",
    date: new Date("2023-12-11"),
    changes: [
      { type: "Updated", description: "More organised moderator panel" },
      { type: "Added", description: "Summary page" },
    ],
  },
  {
    version: "v1.3",
    date: new Date("2023-12-12"),
    changes: [{ type: "Updated", description: "Schedule items can now be organised into groups" }],
  },
  {
    version: "v1.4",
    date: new Date("2023-12-16"),
    changes: [
      { type: "Updated", description: "Usability changes and mobile compatibility/accessibility" },
    ],
  },
  {
    version: "v1.5",
    date: new Date("2024-01-18"),
    changes: [
      { type: "Added", description: "Changelog" },
      { type: "Added", description: "Optional item descriptions" },
    ],
  },
  {
    version: "v1.6",
    date: new Date("2024-01-23"),
    changes: [{ type: "Added", description: "User counts per item" }],
  },
  {
    version: "v1.7",
    date: new Date("2024-01-29"),
    changes: [
      {
        type: "Updated",
        description: "Locked item states are no longer modified when users disconnect",
      },
    ],
  },
  {
    version: "v1.7",
    date: new Date("2024-02-13"),
    changes: [
      {
        type: "Updated",
        description: "Drumroll sound is now random by default",
      },
      {
        type: "Updated",
        description: "Item descriptions can now be added more compactly",
      },
    ],
  },
  {
    version: "v1.8",
    date: new Date("2024-02-20"),
    changes: [
      {
        type: "Updated",
        description: "Jira links now work on mobile",
      },
    ],
  },
  {
    version: "v1.9",
    date: new Date("2024-03-01"),
    changes: [
      {
        type: "Added",
        description: "Added ? to the estimate options",
      },
    ],
  },
  {
    version: "v1.10",
    date: new Date("2024-03-01"),
    changes: [
      {
        type: "Updated",
        description: "Don't play sounds when entering a room",
      },
      {
        type: "Added",
        description: "Added 'tap out' signal",
      },
    ],
  },
  {
    version: "v1.11",
    date: new Date("2024-06-22"),
    changes: [
      {
        type: "Updated",
        description: "Changed the way that locked rooms are visualised and moved to/from etc.",
      },
      {
        type: "Added",
        description:
          "A scratchboard which users can use when they have registered a name to create a common text for each item",
      },
      {
        type: "Updated",
        description: "Made the design slightly more compact",
      },
      {
        type: "Updated",
        description:
          "Change the way that user and moderation controls work - users can now always claim moderation",
      },
      {
        type: "Updated",
        description: "Remove double colons from aer-* items",
      },
    ],
  },
  {
    version: "v2.0",
    date: new Date("2026-03-11"),
    changes: [
      { type: "Added", description: "Theme system: modern, fun, and funner (clown) themes" },
      { type: "Added", description: "Shy mode: your signals don't make sound for others" },
      { type: "Added", description: "Collapsible settings panel with persisted preferences" },
      { type: "Added", description: "Toggle visibility of signals and scratchboard sections" },
      { type: "Added", description: "Mobile-friendly two-tab layout (Agenda / Item)" },
      { type: "Updated", description: "Smooth CSS transitions when switching themes" },
      { type: "Updated", description: "All user preferences persisted to local storage" },
      { type: "Updated", description: "Renamed poker to estimates" },
      { type: "Updated", description: "Modernised dependency stack (Vite 6, Vue 3.5, ESLint 9)" },
      { type: "Updated", description: "Combined API and frontend into a single service" },
    ],
  },
  {
    version: "v2.1",
    date: new Date("2026-03-12"),
    changes: [
      { type: "Added", description: "PIN-based sessions with email summary on reset" },
      {
        type: "Added",
        description:
          "JIRA integration: consensus story point estimates are posted on session finish",
      },
      {
        type: "Added",
        description: "Moderators can provide their email to receive the session summary",
      },
      { type: "Added", description: "Tracks which moderator locked each item" },
      { type: "Added", description: "Summary view shows locked-by and estimates per item" },
      { type: "Updated", description: "Session tab replaces PIN tab with finish session workflow" },
      { type: "Updated", description: "Name and email are remembered across sessions" },
      {
        type: "Updated",
        description: "Client state is fully reset when disconnected by session finish",
      },
    ],
  },
  {
    version: "v2.2",
    date: new Date("2026-03-12"),
    changes: [
      { type: "Updated", description: "Clean, stateful home page: name input, claim moderation, and contextual guidance" },
      { type: "Updated", description: "Navigation hides schedule items when no session is active" },
      { type: "Updated", description: "Controls tab shows hint when not on an agenda item" },
      { type: "Added", description: "Auto-reset notice: idle sessions are finished after 24 hours" },
    ],
  },
  {
    version: "v2.3",
    date: new Date("2026-03-13"),
    changes: [
      { type: "Updated", description: "Redesigned agenda page layout: compact, vertically centered, fits on laptops without scrolling" },
      { type: "Updated", description: "Title row: side-by-side item badge with integrated Jira link icon and description" },
      { type: "Updated", description: "Signals and scratchboard displayed side-by-side in fieldsets" },
      { type: "Updated", description: "Smaller signal icons, larger estimate buttons for visual hierarchy" },
      { type: "Updated", description: "Consistent 800px max-width alignment across all sections" },
      { type: "Removed", description: "Signals/scratchboard visibility toggles (always shown now)" },
      { type: "Added", description: "Highlighted buttons (selected signals/estimates) render above neighbours" },
    ],
  },
  {
    version: "v2.4",
    date: new Date("2026-03-13"),
    changes: [
      { type: "Added", description: "Moderator disconnect grace period: 60s window to auto-reclaim on reconnect" },
      { type: "Added", description: "Reconnecting state shown in nav and home page during grace period" },
    ],
  },
]);

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Intl.DateTimeFormat("en-CA", options).format(date);
};
</script>

<style lang="scss" scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: calc(var(--spacer) * 3) var(--spacer);
  min-height: 100%;
}

.home-card {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacer) * 0.75);
  max-width: 400px;
  width: 100%;
}

.tagline {
  font-size: 0.85em;
  opacity: 0.8;
  margin: 0;
  max-width: 50ch;
}

.name-group {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacer) * 0.5);
}

.group-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.6;
}

.name-row {
  display: flex;
  gap: calc(var(--spacer) * 0.5);

  input {
    flex: 1;
    min-width: 0;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
  }
}

.session-notice {
  display: flex;
  gap: calc(var(--spacer) * 0.75);
  padding: calc(var(--spacer) * 0.75);
  border-radius: var(--radius);
  background: var(--brand-color-4);
  transition: background var(--anim);

  &.active {
    background: var(--brand-color-2);
  }

  .notice-icon {
    font-size: 24px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .notice-title {
    margin: 0;
    font-weight: bold;
    font-size: 0.9em;
  }

  .notice-body {
    margin: 4px 0 0;
    font-size: 0.8em;
    opacity: 0.8;
  }
}

.hint {
  font-size: 0.8rem;
  opacity: 0.5;
  margin: 0;
}

.error {
  color: red;
  margin: 0;
  font-size: 0.85rem;
}

.greeting {
  font-size: 1.2em;
  margin: 0;
}

.subtle-text {
  font-size: 0.85em;
  opacity: 0.6;
  margin: 0;
}

button.primary {
  background: var(--brand-color-1);
  color: white;
}

button.subtle {
  background: var(--brand-color-4);
  font-size: 0.85rem;
}

.changelog-toggle {
  cursor: pointer;
  font-size: 0.75em;
  opacity: 0.5;
  margin-top: calc(var(--spacer) * 2);
  transition: opacity var(--anim);

  &:hover {
    opacity: 0.8;
  }
}

.reveal {
  font-size: 0.9em;
}

article {
  font-size: 0.8em;

  h3 {
    margin: var(--spacer) 0 calc(var(--spacer) * 0.25);
  }

  ul {
    margin: 0;
    padding-left: 1.5em;
  }
}
</style>
