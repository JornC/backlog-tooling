import { defineStore } from "pinia";

export type Theme = "modern" | "fun" | "funner";

const THEME_KEY = "backlog-theme";
const SHOW_SIGNALS_KEY = "backlog-show-signals";
const SHOW_SCRATCHBOARD_KEY = "backlog-show-scratchboard";
const PLAY_SOUNDS_KEY = "backlog-play-sounds";
const SILENT_SIGNALS_KEY = "backlog-silent-signals";

function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "modern" || stored === "fun" || stored === "funner") {
    return stored;
  }
  return "fun";
}

function loadBool(key: string, defaultValue: boolean): boolean {
  const stored = localStorage.getItem(key);
  if (stored === "true") return true;
  if (stored === "false") return false;
  return defaultValue;
}

export const useContextStore = defineStore("contextStore", {
  state: () => ({
    playSounds: loadBool(PLAY_SOUNDS_KEY, true),
    silentSignals: loadBool(SILENT_SIGNALS_KEY, false),
    userPanelActive: false as boolean,
    theme: loadTheme() as Theme,
    showSignals: loadBool(SHOW_SIGNALS_KEY, true),
    showScratchboard: loadBool(SHOW_SCRATCHBOARD_KEY, true),

    soundEmbargo: false as boolean,
    soundEmbargoTimeout: null as ReturnType<typeof setTimeout> | null,
  }),

  getters: {
    isUserPanelActive: (state) => {
      return state.userPanelActive;
    },

    isSoundEmbargoed: (state) => state.soundEmbargo,
  },

  actions: {
    setUserPanelActive(val: boolean) {
      this.userPanelActive = val;
    },

    setSoundEmbargoed() {
      if (this.soundEmbargoTimeout !== null) {
        clearTimeout(this.soundEmbargoTimeout);
        this.soundEmbargoTimeout = null;
      }

      this.soundEmbargo = true;

      this.soundEmbargoTimeout = setTimeout(() => {
        this.soundEmbargo = false;
        this.soundEmbargoTimeout = null;
      });
    },

    setPlaySounds(val: boolean) {
      this.playSounds = val;
      localStorage.setItem(PLAY_SOUNDS_KEY, String(val));
    },

    setSilentSignals(val: boolean) {
      this.silentSignals = val;
      localStorage.setItem(SILENT_SIGNALS_KEY, String(val));
    },

    setTheme(theme: Theme) {
      this.theme = theme;
      localStorage.setItem(THEME_KEY, theme);
      document.documentElement.style.setProperty("--transition-speed", "0.5s");
      document.documentElement.setAttribute("data-theme", theme);
      setTimeout(() => {
        document.documentElement.style.removeProperty("--transition-speed");
      }, 600);
    },

    setShowSignals(val: boolean) {
      this.showSignals = val;
      localStorage.setItem(SHOW_SIGNALS_KEY, String(val));
    },

    setShowScratchboard(val: boolean) {
      this.showScratchboard = val;
      localStorage.setItem(SHOW_SCRATCHBOARD_KEY, String(val));
    },
  },
});
