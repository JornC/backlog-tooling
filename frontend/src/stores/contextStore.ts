import { defineStore } from "pinia";

export type Theme = "modern" | "fun" | "funner";

const THEME_KEY = "backlog-theme";

function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "modern" || stored === "fun" || stored === "funner") {
    return stored;
  }
  return "fun";
}

export const useContextStore = defineStore("contextStore", {
  state: () => ({
    playSounds: true as boolean,
    silentSignals: false as boolean,
    userPanelActive: false as boolean,
    theme: loadTheme() as Theme,

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
    },

    setSilentSignals(val: boolean) {
      this.silentSignals = val;
    },

    setTheme(theme: Theme) {
      this.theme = theme;
      localStorage.setItem(THEME_KEY, theme);
      document.documentElement.setAttribute("data-theme", theme);
    },
  },
});
