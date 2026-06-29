<template>
  <div class="magicbox">
    <div class="top-controls">
      <button
        class="sound-toggle"
        :class="{ off: !soundOn }"
        :aria-label="soundOn ? 'Geluid uit' : 'Geluid aan'"
        @click="toggleSound">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
          <template v-if="soundOn">
            <path
              d="M15.5 9a3.5 3.5 0 010 6"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round" />
            <path
              d="M18 6.5a7 7 0 010 11"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round" />
          </template>
          <g v-else stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <line x1="16" y1="9.5" x2="21" y2="14.5" />
            <line x1="21" y1="9.5" x2="16" y2="14.5" />
          </g>
        </svg>
      </button>
      <div class="lang-switch">
        <button :class="{ active: lang === 'nl' }" @click="lang = 'nl'">NL</button>
        <button :class="{ active: lang === 'en' }" @click="lang = 'en'">EN</button>
      </div>
    </div>

    <header class="mb-header">
      <h1>{{ t.title }}</h1>
      <p class="tagline">{{ t.tagline }}</p>
    </header>

    <div class="name-bar">
      <label for="presenter">{{ t.nameLabel }}</label>
      <input
        id="presenter"
        ref="nameInput"
        v-model="name"
        type="text"
        :placeholder="t.placeholder"
        autocomplete="off"
        spellcheck="false"
        @keyup.enter="spin" />
    </div>

    <div class="columns">
      <div class="wheel-col">
        <p class="spin-caption" :class="{ live: spinning }">
          <template v-if="spinning">{{ t.spinPre }}<strong>{{ displayName }}</strong>{{ t.spinPost }}</template>
          <template v-else>{{ t.idlePre }}<strong>{{ displayName }}</strong>{{ t.idlePost }}</template>
        </p>

        <div class="stage">
          <SpinWheel
            ref="themeWheel"
            :items="themeTitles"
            :size="wheelSize"
            :palette="themePalette"
            :empty-label="t.empty"
            @scroll="onScroll"
            @ticks="onTicks"
            @settled="onSettled" />

          <button class="spin-btn" :disabled="!canSpin" @click="spin">
            {{ spinning ? "…" : t.spinBtn }}
          </button>
        </div>
      </div>

      <div class="panel">
        <transition name="reveal">
          <div v-if="showCard" ref="resultEl" class="result" :class="{ live: spinning }">
            <span class="result-label">{{ spinning ? t.resultSpinning : t.resultDone }}</span>
            <p class="result-line">
              <strong class="who">{{ cardPerson }}</strong>
              <span class="arrow">{{ t.presents }}</span>
            </p>

            <div class="reel" :style="{ height: REEL_LINE + 'px' }">
              <div class="reel-strip" :style="{ transform: `translateY(${reelOffset}px)` }">
                <div
                  v-for="(title, i) in reelLines"
                  :key="i"
                  class="reel-line"
                  :style="{ height: REEL_LINE + 'px' }">
                  {{ title }}
                </div>
              </div>
            </div>

            <div class="result-desc-wrap" :class="{ open: revealed && card }">
              <div class="result-desc-inner">
                <p class="result-desc">{{ card?.description }}</p>
              </div>
            </div>
          </div>
        </transition>

        <div class="controls">
          <button class="ghost" @click="showEdit = !showEdit">
            {{ showEdit ? t.manageClose : t.manage }}
          </button>
        </div>

        <transition name="fade">
          <div v-if="showEdit" class="editor">
            <div class="edit-head">
              <label>{{ t.editorHead }}</label>
              <button class="link" @click="resetThemes">{{ t.reset }}</button>
            </div>
            <textarea
              v-model="themesText"
              class="edit-area"
              :class="{ invalid: parseError }"
              spellcheck="false"></textarea>
            <p v-if="parseError" class="edit-error">{{ parseError }}</p>
            <p class="edit-hint">{{ t.editorHint }}</p>
          </div>
        </transition>
      </div>
    </div>

    <div ref="confettiHost" class="confetti-host" aria-hidden="true"></div>
  </div>
</template>

<script setup lang="ts">
import SpinWheel from "@/components/magicbox/SpinWheel.vue";
import { useWheelSounds } from "@/components/magicbox/useWheelSounds";

interface Theme {
  title: string;
  description: string;
}

type Lang = "nl" | "en";

interface Copy {
  title: string;
  tagline: string;
  nameLabel: string;
  placeholder: string;
  idlePre: string;
  idlePost: string;
  spinPre: string;
  spinPost: string;
  spinBtn: string;
  manage: string;
  manageClose: string;
  resultSpinning: string;
  resultDone: string;
  presents: string;
  editorHead: string;
  reset: string;
  editorHint: string;
  empty: string;
}

const STRINGS: Record<Lang, Copy> = {
  nl: {
    title: "Het Epische Rad van Fortuin",
    tagline: "Wie is aan de beurt - en welk thema kiest het lot?",
    nameLabel: "Wie presenteert?",
    placeholder: "Henkie",
    idlePre: "Draai aan het rad en ontdek wat ",
    idlePost: " mag toelichten",
    spinPre: "Het rad draait voor ",
    spinPost: "…",
    spinBtn: "DRAAI",
    manage: "thema's beheren",
    manageClose: "sluit beheer",
    resultSpinning: "het rad draait…",
    resultDone: "en het lot bepaalt…",
    presents: "presenteert",
    editorHead: "Inhoud - regels met een nummer ('1.') zijn thema's, de regel eronder is de toelichting",
    reset: "terug naar standaard",
    editorHint:
      "Eén regel per thema, beginnend met een nummer (bijv. '1.'). De regel eronder is de toelichting (mag weg). Gebruik #nl / #en secties voor twee talen - met evenveel thema's - of laat ze weg voor één taal. Wijzigingen blijven alleen lokaal in deze browser bewaard.",
    empty: "voeg thema's toe",
  },
  en: {
    title: "The Epic Wheel of Fortune",
    tagline: "Whose turn is it - and which topic will fate choose?",
    nameLabel: "Who's presenting?",
    placeholder: "name…",
    idlePre: "Spin the wheel and discover what ",
    idlePost: " gets to present",
    spinPre: "The wheel is spinning for ",
    spinPost: "…",
    spinBtn: "SPIN",
    manage: "edit topics",
    manageClose: "close editor",
    resultSpinning: "the wheel is spinning…",
    resultDone: "and fate decides…",
    presents: "presents",
    editorHead: "Content - lines starting with a number ('1.') are topics, the line below is the description",
    reset: "reset to defaults",
    editorHint:
      "One line per topic, starting with a number (e.g. '1.'). The line below it is the description (optional). Use #nl / #en sections for two languages - with equal counts - or omit them for one. Changes are kept only locally in this browser.",
    empty: "add some topics",
  },
};

const DEFAULT_THEMES_EN: Theme[] = [
  {
    title: "1. Code quality",
    description:
      "Pick a recent PR, module, or refactor and walk through it. What's clean and worth copying, what's fragile or confusing, what you'd do differently. Less “judging someone,” more “here's a concrete example we can all learn from.”",
  },
  {
    title: "2. Technical debt",
    description:
      "Name one specific piece of debt. Why does it slow us down or cause bugs? What would it cost to pay down versus the cost of continuing to carry it? Make the trade-off visible so we can decide deliberately instead of by default.",
  },
  {
    title: "3. Architecture",
    description:
      "Take one recent or upcoming design choice and explain the trade-offs: what we picked, what we rejected, and why. Good for surfacing assumptions early and making sure the reasoning is shared, not locked in one person's head.",
  },
  {
    title: "4. Defensibility",
    description:
      "Can we reliably reproduce a past calculation given its version and input data? Is our versioning and data-lineage tooling solid enough that an old result can be regenerated exactly? This is output traceability as an engineering property - critical for a system whose results get cited and contested.",
  },
  {
    title: "5. Incident retro",
    description:
      "Take one notable defect or production incident. What happened, what was the root cause (not just the symptom), how was it fixed, and what would have caught it earlier? Blameless - the goal is prevention, not fault.",
  },
  {
    title: "6. Tests",
    description:
      "Where are we flying blind? Coverage gaps, flaky tests, areas of the calculation engine that aren't well validated. Point at the risk: what could break without a test catching it?",
  },
  {
    title: "7. Performance",
    description:
      "Highlight a slow path, a heavy computation, or something that works now but won't age well as data or load grows. Especially relevant for spatial/calculation-heavy work. What's the bottleneck and when does it bite?",
  },
  {
    title: "8. Observability",
    description:
      "Can we actually see what the system is doing in production? Look at logging, monitoring, and alerting. Where would we be blind if something went wrong right now, and what would we wish we'd been recording?",
  },
  {
    title: "9. Release",
    description:
      "Look ahead to the next version or data cutover. Technical dependencies, migration risks, rollback plan. Are we ready, and what could go wrong at the moment of switchover? The deadline is usually externally fixed, so surprises are expensive.",
  },
  {
    title: "10. CI/CD",
    description:
      "One source of friction in build, deploy, or local setup. The thing that makes everyone sigh when they hit it. What's the fix, and is it worth doing now?",
  },
  {
    title: "11. Ways of working",
    description:
      "A bottleneck in how we work: review latency, handoffs, branching strategy, meeting load. Name one and propose a concrete tweak. Small, specific, testable changes beat grand reorganizations.",
  },
  {
    title: "12. Documentation",
    description:
      "A gap in technical docs, onboarding material, or runbooks that's currently costing the team time. Where does knowledge live only in someone's head? What would you have wanted documented when you last got stuck?",
  },
  {
    title: "13. Security",
    description:
      "A vulnerability, an aging or unmaintained dependency, an auth/access concern, or whatever the latest scan flagged. What's our exposure, and what's the cost of patching versus the risk of waiting?",
  },
  {
    title: "14. Refactoring",
    description:
      "A specific area ripe for cleanup, with the case for doing it now rather than later. What makes it painful to work in, and what would the cleanup unlock? Tie it to real friction, not just aesthetics.",
  },
  {
    title: "15. Science & data",
    description:
      "The seam where RIVM's models and data meet our software. Where do mismatches, undocumented assumptions, or ambiguous specs bite us? A lot of real defects originate at this handoff rather than in our own code - so it's worth inspecting deliberately.",
  },
];

const DEFAULT_THEMES_NL: Theme[] = [
  {
    title: "1. Codekwaliteit",
    description:
      "Pak een recente PR, module of refactor en loop er samen doorheen. Wat is netjes en het kopiëren waard, wat is broos of verwarrend, wat zou je anders doen? Minder “iemand beoordelen”, meer “hier is een concreet voorbeeld waar we allemaal van kunnen leren.”",
  },
  {
    title: "2. Technische schuld",
    description:
      "Benoem één concreet stuk technische schuld. Waarom vertraagt het ons of veroorzaakt het bugs? Wat kost het om af te lossen versus de kosten van het blijven meedragen? Maak de afweging zichtbaar zodat we bewust kunnen kiezen in plaats van uit gewoonte.",
  },
  {
    title: "3. Architectuur",
    description:
      "Neem één recente of aankomende ontwerpkeuze en leg de afwegingen uit: wat we kozen, wat we verwierpen en waarom. Goed om aannames vroeg boven tafel te krijgen en te zorgen dat de redenering gedeeld wordt, niet opgesloten in één hoofd.",
  },
  {
    title: "4. Verdedigbaarheid",
    description:
      "Kunnen we een eerdere berekening betrouwbaar reproduceren op basis van versie en invoerdata? Is onze versionering en data-lineage degelijk genoeg om een oud resultaat exact te herproduceren? Dit is traceerbaarheid van output als technische eigenschap - cruciaal voor een systeem waarvan de resultaten worden aangehaald en aangevochten.",
  },
  {
    title: "5. Incidentretro",
    description:
      "Neem één opvallende fout of productie-incident. Wat gebeurde er, wat was de grondoorzaak (niet alleen het symptoom), hoe is het opgelost en wat had het eerder kunnen onderscheppen? Zonder schuldvraag - het doel is preventie, niet schuld.",
  },
  {
    title: "6. Tests",
    description:
      "Waar vliegen we blind? Gaten in dekking, flaky tests, delen van de rekenmotor die slecht gevalideerd zijn. Wijs het risico aan: wat kan stuk zonder dat een test het opmerkt?",
  },
  {
    title: "7. Prestaties",
    description:
      "Licht een traag pad uit, een zware berekening of iets dat nu werkt maar slecht veroudert naarmate data of belasting groeit. Vooral relevant voor ruimtelijk en rekenintensief werk. Wat is de bottleneck en wanneer gaat het pijn doen?",
  },
  {
    title: "8. Observeerbaarheid",
    description:
      "Kunnen we daadwerkelijk zien wat het systeem in productie doet? Kijk naar logging, monitoring en alerting. Waar zouden we blind zijn als er nú iets misging, en wat zouden we willen dat we hadden vastgelegd?",
  },
  {
    title: "9. Release",
    description:
      "Kijk vooruit naar de volgende versie of dataovergang. Technische afhankelijkheden, migratierisico's, terugrolplan. Zijn we klaar, en wat kan er misgaan op het moment van omschakelen? De deadline ligt meestal extern vast, dus verrassingen zijn duur.",
  },
  {
    title: "10. CI/CD",
    description:
      "Eén bron van wrijving in build, deploy of lokale setup. Dat ding waar iedereen van zucht als ze het tegenkomen. Wat is de oplossing, en is het de moeite waard om het nu te doen?",
  },
  {
    title: "11. Werkwijze",
    description:
      "Een knelpunt in hoe we werken: reviewdoorlooptijd, overdrachten, branchingstrategie, vergaderdruk. Benoem er één en stel een concrete aanpassing voor. Kleine, specifieke, toetsbare veranderingen verslaan grote reorganisaties.",
  },
  {
    title: "12. Documentatie",
    description:
      "Een gat in technische docs, inwerkmateriaal of runbooks dat het team nu tijd kost. Waar zit kennis alleen in iemands hoofd? Wat had je gedocumenteerd willen hebben toen je laatst vastliep?",
  },
  {
    title: "13. Beveiliging",
    description:
      "Een kwetsbaarheid, een verouderde of niet-onderhouden dependency, een auth-/toegangskwestie, of wat de laatste scan ook markeerde. Wat is onze blootstelling, en wat kost patchen versus het risico van wachten?",
  },
  {
    title: "14. Refactoring",
    description:
      "Een specifiek gebied dat rijp is voor opschoning, met het argument om het nu te doen in plaats van later. Wat maakt het pijnlijk om erin te werken, en wat zou de opschoning ontsluiten? Koppel het aan echte wrijving, niet alleen esthetiek.",
  },
  {
    title: "15. Wetenschap & data",
    description:
      "De naad waar RIVM's modellen en data onze software ontmoeten. Waar bijten mismatches, ongedocumenteerde aannames of dubbelzinnige specs ons? Veel echte defects ontstaan bij deze overdracht in plaats van in onze eigen code - dus het is de moeite waard om er bewust naar te kijken.",
  },
];

const DEFAULTS: Record<Lang, Theme[]> = { nl: DEFAULT_THEMES_NL, en: DEFAULT_THEMES_EN };

const STORAGE_KEY = "magicbox.v4";

const themePalette = [
  "#ff595e", // red
  "#ff924c", // orange
  "#ffca3a", // yellow
  "#8ac926", // green
  "#2ec4b6", // teal
  "#4cc9f0", // sky blue
  "#5e9eff", // blue
  "#b07cff", // purple
  "#f15bb5", // pink
  "#ffb703", // amber
];

function cloneDefaults(l: Lang): Theme[] {
  return DEFAULTS[l].map((t) => ({ ...t }));
}

type ThemesByLang = Record<Lang, Theme[]>;

interface SavedState {
  name: string;
  themes: ThemesByLang;
  lang: Lang;
  sound: boolean;
}

// Accepts only a non-empty array of theme-like objects, normalized; else null.
function sanitizeThemes(value: unknown): Theme[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  return value.map((t) => ({
    title: (t as Theme)?.title ?? "",
    description: (t as Theme)?.description ?? "",
  }));
}

function load(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const lang: Lang = parsed.lang === "en" ? "en" : "nl";
      let themes: ThemesByLang;
      if (parsed.themes && typeof parsed.themes === "object" && !Array.isArray(parsed.themes)) {
        // Current format: { nl: [...], en: [...] }.
        const byLang = parsed.themes as Record<string, unknown>;
        themes = {
          nl: sanitizeThemes(byLang.nl) ?? cloneDefaults("nl"),
          en: sanitizeThemes(byLang.en) ?? cloneDefaults("en"),
        };
      } else {
        // Legacy format: a single English array under `themes`.
        themes = {
          nl: cloneDefaults("nl"),
          en: sanitizeThemes(parsed.themes) ?? cloneDefaults("en"),
        };
      }
      const sound = typeof parsed.sound === "boolean" ? parsed.sound : true;
      return { name: typeof parsed.name === "string" ? parsed.name : "", themes, lang, sound };
    }
  } catch {
    // fall through to defaults
  }
  return {
    name: "",
    themes: { nl: cloneDefaults("nl"), en: cloneDefaults("en") },
    lang: "nl",
    sound: true,
  };
}

// In the editor each theme is a line starting with its number ("1. ..."); that
// numbered line is the title (number included - the wheel shows it). The very
// next line, if it isn't blank or another numbered theme, is its description.
const THEME_LINE = /^\s*\d+\.\s*\S/;

function serializeThemes(list: Theme[]): string {
  return list.map((t) => (t.description ? `${t.title}\n${t.description}` : t.title)).join("\n");
}

function parseThemes(text: string): Theme[] {
  const lines = text.split("\n");
  const out: Theme[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (!THEME_LINE.test(line)) {
      continue; // only numbered lines start a theme
    }
    const title = line.trim();
    // The next line is the description unless it's blank or another theme.
    const next = lines[i + 1];
    let description = "";
    if (next !== undefined && next.trim() && !THEME_LINE.test(next)) {
      description = next.trim();
      i += 1;
    }
    out.push({ title, description });
  }
  return out;
}

// Both languages live in one textarea, each under a `#nl` / `#en` marker line.
function serializeCombined(byLang: ThemesByLang): string {
  return `#nl\n${serializeThemes(byLang.nl)}\n\n#en\n${serializeThemes(byLang.en)}`;
}

function parseCombined(text: string): { themes?: ThemesByLang; error?: string } {
  const nl = lang.value === "nl";
  const lines = text.split("\n");

  // No #nl / #en markers -> single language: one list, used for both languages,
  // with no per-section count validation.
  if (!lines.some((l) => l.trim().startsWith("#"))) {
    const list = parseThemes(text);
    if (list.length === 0) {
      return { error: nl ? "Voeg minstens één thema toe." : "Add at least one topic." };
    }
    return { themes: { nl: list, en: list.map((x) => ({ ...x })) } };
  }

  const sections: Partial<Record<Lang, string[]>> = {};
  let current: Lang | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      const tag = trimmed.slice(1).trim().toLowerCase();
      if (tag !== "nl" && tag !== "en") {
        return {
          error: nl
            ? `Onbekende sectie "${trimmed}" - gebruik #nl en #en.`
            : `Unknown section "${trimmed}" - use #nl and #en.`,
        };
      }
      if (sections[tag]) {
        return {
          error: nl ? `Sectie #${tag} staat er dubbel in.` : `Section #${tag} is duplicated.`,
        };
      }
      sections[tag] = [];
      current = tag;
      continue;
    }
    if (current) {
      sections[current]!.push(line);
    }
  }
  if (!sections.nl || !sections.en) {
    return {
      error: nl
        ? "Beide secties #nl en #en zijn vereist."
        : "Both #nl and #en sections are required.",
    };
  }
  const parsedNl = parseThemes(sections.nl.join("\n"));
  const parsedEn = parseThemes(sections.en.join("\n"));
  if (parsedNl.length === 0 || parsedEn.length === 0) {
    return {
      error: nl
        ? "Beide talen moeten minstens één thema bevatten."
        : "Both languages need at least one topic.",
    };
  }
  if (parsedNl.length !== parsedEn.length) {
    return {
      error: nl
        ? `Aantal thema's verschilt - NL: ${parsedNl.length}, EN: ${parsedEn.length}.`
        : `Topic counts differ - NL: ${parsedNl.length}, EN: ${parsedEn.length}.`,
    };
  }
  return { themes: { nl: parsedNl, en: parsedEn } };
}

// --- Deterministic shuffle -------------------------------------------------
// FNV-1a hash -> 32-bit seed; mulberry32 PRNG -> seeded Fisher-Yates. Same data
// always yields the same order; editing the content yields a new (but stable)
// one. No Math.random, so it's reproducible across loads.
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededPermutation(n: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

const initial = load();

const name = ref(initial.name);
const lang = ref<Lang>(initial.lang);
const t = computed(() => STRINGS[lang.value]);

// Themes are kept per language; the wheel follows the active language. The
// editor is one copy-pasteable textarea holding both languages, split by #nl /
// #en marker lines, so all content is configurable from the one screen.
const themesByLang = ref<ThemesByLang>(initial.themes);
const themes = computed(() => themesByLang.value[lang.value]);
const themesText = ref(serializeCombined(themesByLang.value));
const parseError = ref("");

const themeWheel = ref<InstanceType<typeof SpinWheel> | null>(null);
const confettiHost = ref<HTMLElement | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);
const resultEl = ref<HTMLElement | null>(null);

const spinning = ref(false);
const showEdit = ref(false);
const showCard = ref(false);
const revealed = ref(false);
const cardPerson = ref("");
// The result is stored as the wheel index (not a snapshot) so the card follows
// the active language: switching NL/EN re-derives the same theme, translated.
const cardIndex = ref(-1);
const card = computed<Theme | null>(() => wheelThemes.value[cardIndex.value] ?? null);

// Slot-machine reel: the titles are stacked and scroll vertically, driven by
// the wheel's continuous position. Three copies make the wrap seamless.
const REEL_LINE = 76;
const reelPos = ref(0);
const reelLines = computed(() => {
  const t = themeTitles.value;
  return [...t, ...t, ...t];
});
const reelOffset = computed(() => {
  const n = themeTitles.value.length || 1;
  const p = ((reelPos.value % n) + n) % n;
  return -((n + p) * REEL_LINE);
});

const wheelSize = ref(computeWheelSize());

function computeWheelSize(): number {
  const w = typeof window !== "undefined" ? window.innerWidth : 1200;
  const h = typeof window !== "undefined" ? window.innerHeight : 800;
  // Wide screens use the 2-column layout, so the wheel gets a generous share of
  // the left column; narrow screens fall back to a single centered column.
  const twoCol = w >= 980;
  const budget = twoCol
    ? Math.min(w * 0.55 - 80, h - 200)
    : Math.min(w - 40, h - 320);
  return Math.max(260, Math.min(twoCol ? 720 : 480, budget));
}

function onResize() {
  wheelSize.value = computeWheelSize();
}

// The wheel order is a deterministic shuffle of the themes, seeded from BOTH
// languages' titles so the slice positions are identical in NL and EN (keeps the
// result card translating in place by index) and only change when content does.
// The editor reads `themes` directly, so it stays in natural order.
const dataSeed = computed(() => {
  const nlTitles = themesByLang.value.nl.map((t) => t.title).join("\n");
  const enTitles = themesByLang.value.en.map((t) => t.title).join("\n");
  return hashString(`${nlTitles}␟${enTitles}`);
});
const wheelOrder = computed(() => seededPermutation(themes.value.length, dataSeed.value));
const wheelThemes = computed(() => wheelOrder.value.map((i) => themes.value[i]));
const themeTitles = computed(() => wheelThemes.value.map((t) => t.title));

const displayName = computed(() => name.value.trim() || "…");

const canSpin = computed(
  () => !spinning.value && wheelThemes.value.length > 0 && name.value.trim().length > 0,
);

const { enabled: soundOn, ensure: ensureAudio, setEnabled: setSoundEnabled, playTick, scheduleTicks, playDing } =
  useWheelSounds();
soundOn.value = initial.sound;

function toggleSound() {
  const on = !soundOn.value;
  setSoundEnabled(on);
  if (on) {
    playTick(); // brief audible confirmation
  }
}

let pendingIndex = -1;

function spin() {
  if (!canSpin.value) {
    if (!name.value.trim()) {
      nameInput.value?.focus();
    }
    return;
  }
  ensureAudio(); // resume the AudioContext within this click gesture
  cardPerson.value = name.value.trim();
  revealed.value = false;
  showCard.value = true;
  spinning.value = true;

  pendingIndex = Math.floor(Math.random() * wheelThemes.value.length);
  themeWheel.value?.spinTo(pendingIndex);

  nextTick(() => resultEl.value?.scrollIntoView({ behavior: "smooth", block: "center" }));
}

function onScroll(position: number) {
  if (spinning.value) {
    reelPos.value = position;
  }
}

// The wheel emits the exact peg-crossing times for this spin; schedule the ticks
// so they follow its deceleration curve precisely.
function onTicks(offsetsMs: number[]) {
  scheduleTicks(offsetsMs);
}

function onSettled(_title: string, index: number) {
  spinning.value = false;
  reelPos.value = index;
  cardIndex.value = index;
  revealed.value = true;
  playDing();
  burstConfetti();
  nextTick(() => resultEl.value?.scrollIntoView({ behavior: "smooth", block: "center" }));
}

function burstConfetti() {
  const host = confettiHost.value;
  if (!host) {
    return;
  }
  // Count scales with viewport width (~1 piece per 5px) so density stays even
  // on any screen; clamped to keep huge displays sane.
  const vw = window.innerWidth;
  const count = Math.min(520, Math.max(160, Math.round(vw * 0.2)));
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    const left = Math.random() * 100; // full viewport width
    const size = 6 + Math.random() * 9;
    piece.style.left = `${left}%`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size * (0.4 + Math.random() * 0.6)}px`;
    piece.style.background = themePalette[i % themePalette.length];
    piece.style.setProperty("--dx", `${(Math.random() * 2 - 1) * 280}px`);
    piece.style.setProperty("--dr", `${Math.random() * 720 - 360}deg`);
    // Each piece fades out at a different height so they don't all vanish along
    // one line at the bottom.
    piece.style.setProperty("--ty", `${82 + Math.random() * 36}vh`);
    // Exponential launch delay: a dense burst up front, then a tail that thins
    // smoothly with no hard cutoff, so the stragglers are scattered in time
    // rather than forming a second horizontal edge where the fall stops.
    piece.style.animationDelay = `${-Math.log(1 - Math.random()) * 0.75}s`;
    piece.style.animationDuration = `${2.8 + Math.random() * 2.8}s`;
    host.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }
}

function resetThemes() {
  themesText.value = serializeCombined({ nl: cloneDefaults("nl"), en: cloneDefaults("en") });
}

// The textarea is the source of truth while editing. Only apply when it parses
// and validates; otherwise surface the error and keep the last good content.
watch(themesText, (text) => {
  const result = parseCombined(text);
  if (result.error) {
    parseError.value = result.error;
    return;
  }
  parseError.value = "";
  themesByLang.value = result.themes!;
});

watch(
  [name, themesByLang, lang, soundOn],
  () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: name.value,
        themes: themesByLang.value,
        lang: lang.value,
        sound: soundOn.value,
      } satisfies SavedState),
    );
  },
  { deep: true },
);

onMounted(() => {
  window.addEventListener("resize", onResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
});
</script>

<style lang="scss">
/* Global: confetti pieces are created via createElement and therefore never
   receive the scoped data-v attribute, so their styles must not be scoped. */
.confetti-piece {
  position: absolute;
  top: -20px;
  border-radius: 2px;
  opacity: 0.95;
  animation-name: confetti-fall;
  animation-timing-function: cubic-bezier(0.3, 0.7, 0.5, 1);
  animation-fill-mode: forwards;
  will-change: transform, opacity;
}

@keyframes confetti-fall {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate(var(--dx, 0), var(--ty, 100vh)) rotate(var(--dr, 360deg));
    opacity: 0;
  }
}
</style>

<style lang="scss" scoped>
.magicbox {
  min-height: 100vh;
  box-sizing: border-box;
  padding: clamp(16px, 4vw, 40px);
  background: radial-gradient(circle at 50% 0%, #1c2a3a 0%, #0d1117 55%, #080a0e 100%);
  color: #f3f6fb;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(12px, 2.4vw, 22px);
  overflow-x: hidden;
}

.columns {
  width: 100%;
  max-width: 1400px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 500px);
  gap: clamp(20px, 4vw, 56px);
  align-items: center;
}

.wheel-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(10px, 2vw, 18px);
  min-width: 0;
}

.panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

@media (max-width: 979px) {
  .columns {
    grid-template-columns: 1fr;
    max-width: 640px;
  }
}

.mb-header {
  text-align: center;

  h1 {
    margin: 0;
    font-size: clamp(1.8rem, 5.5vw, 3rem);
    letter-spacing: 0.02em;
    background: linear-gradient(90deg, #ffca3a, #ff595e, #f15bb5, #6a4c93, #1982c4);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .tagline {
    margin: 6px 0 0;
    opacity: 0.7;
    font-size: clamp(0.85rem, 2.4vw, 1.05rem);
  }
}

.top-controls {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sound-toggle {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 50%;
  color: #ffca3a;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition:
    background 0.15s ease-out,
    color 0.15s ease-out;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
  &.off {
    color: rgba(255, 255, 255, 0.4);
  }
}

.lang-switch {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);

  button {
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 5px 11px;
    border-radius: 999px;
    cursor: pointer;
    transition:
      background 0.15s ease-out,
      color 0.15s ease-out;

    &.active {
      background: #ffca3a;
      color: #11151a;
    }
    &:hover:not(.active) {
      color: #f3f6fb;
    }
  }
}

.name-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;

  label {
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    opacity: 0.7;
  }

  input {
    font-size: clamp(1.4rem, 4vw, 2rem);
    font-weight: 700;
    text-align: center;
    padding: 8px 18px;
    width: min(320px, 70vw);
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
    border: none;
    border-bottom: 3px solid #ffca3a;
    border-radius: 8px 8px 0 0;
    outline: none;

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
      font-weight: 400;
    }
    &:focus {
      background: rgba(255, 255, 255, 0.1);
      border-bottom-color: #ff595e;
    }
  }
}

.spin-caption {
  margin: 0;
  font-size: clamp(0.9rem, 2.6vw, 1.15rem);
  opacity: 0.8;
  text-align: center;
  transition: opacity 0.2s ease-out;

  strong {
    color: #ffca3a;
  }

  &.live {
    animation: caption-pulse 0.9s ease-in-out infinite;
  }
}

@keyframes caption-pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.stage {
  position: relative;
  display: grid;
  place-items: center;
}

.spin-btn {
  position: absolute;
  inset: 0;
  margin: auto;
  font-size: clamp(1rem, 2.6vw, 1.3rem);
  font-weight: 800;
  letter-spacing: 0.12em;
  width: clamp(86px, 22vw, 110px);
  height: clamp(86px, 22vw, 110px);
  border: none;
  border-radius: 50%;
  color: #11151a;
  background: radial-gradient(circle at 35% 30%, #ffe27a, #ffca3a 45%, #ff924c 100%);
  box-shadow:
    0 0 0 6px rgba(17, 21, 26, 0.85),
    0 0 0 9px rgba(255, 255, 255, 0.12),
    0 10px 30px rgba(255, 146, 76, 0.45);
  cursor: pointer;
  transition:
    transform 0.12s ease-out,
    box-shadow 0.2s ease-out;

  &:hover:not(:disabled) {
    transform: scale(1.06);
  }
  &:active:not(:disabled) {
    transform: scale(0.94);
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.controls {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  justify-content: center;
}

.ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #f3f6fb;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    border-color: rgba(255, 255, 255, 0.6);
  }
}

.result {
  text-align: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 20px 28px;
  max-width: 640px;
  width: min(640px, 100%);
  box-sizing: border-box;
  transition: border-color 0.3s ease-out;

  &.live {
    border-color: rgba(255, 202, 58, 0.35);
  }

  .result-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.3em;
    opacity: 0.55;
  }

  .result-line {
    margin: 10px 0 0;
    font-size: clamp(1.2rem, 4vw, 2rem);
    line-height: 1.3;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
  }

  .who {
    color: #66e0d0;
    font-size: 1.15em;
  }
  .arrow {
    font-size: 0.55em;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    opacity: 0.6;
  }

  // The description expands the card height smoothly (grid-rows 0fr -> 1fr)
  // instead of the card jumping when the text appears.
  .result-desc-wrap {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.55s cubic-bezier(0.16, 0.84, 0.3, 1);

    &.open {
      grid-template-rows: 1fr;
    }
  }

  .result-desc-inner {
    overflow: hidden;
    min-height: 0;
  }

  .result-desc {
    margin: 16px auto 0;
    max-width: 560px;
    font-size: clamp(0.85rem, 2.2vw, 1rem);
    line-height: 1.55;
    opacity: 0;
    text-align: left;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 14px;
    transition: opacity 0.45s ease-out 0.12s;
  }

  .result-desc-wrap.open .result-desc {
    opacity: 0.82;
  }
}

.reel {
  position: relative;
  overflow: hidden;
  width: 100%;
  margin-top: 6px;
  // Fade the top/bottom edges so partial titles slide in/out softly.
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 24%,
    #000 76%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 24%,
    #000 76%,
    transparent 100%
  );
}

.reel-strip {
  will-change: transform;
  /* Driven per-frame by rAF; a transition (incl. the global `* { transition }`)
     would animate the seamless wrap jump and smear every scroll step. */
  transition: none;
}

.reel-line {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  box-sizing: border-box;
  font-size: clamp(1rem, 2.2vw, 1.3rem);
  font-weight: 800;
  line-height: 1.28;
  color: #ffca3a;
  text-align: center;
  overflow: hidden;
}

.editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(640px, 100%);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 18px;
}

.edit-area {
  width: 100%;
  box-sizing: border-box;
  min-height: 360px;
  resize: vertical;
  font-family: monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.3);
  color: #f3f6fb;

  &.invalid {
    border-color: #ff595e;
  }
}

.edit-error {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #ff7a7e;
}

.edit-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;

  label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.7;
  }
}

.link {
  background: none;
  border: none;
  color: #ffca3a;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.edit-hint {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.45;
}

.confetti-host {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  overflow: hidden;
}

.reveal-enter-active {
  transition:
    transform 0.5s cubic-bezier(0.16, 0.84, 0.3, 1),
    opacity 0.5s ease-out;
}
.reveal-enter-from {
  transform: scale(0.85) translateY(12px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
