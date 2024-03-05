import { defineStore } from "pinia";

export const useContextStore = defineStore("contextStore", {
  state: () => ({
    playSounds: true as boolean,
    moderating: false as boolean,

    soundEmbargo: false as boolean,
    soundEmbargoTimeout: null as number | null, // Add a timeout reference
  }),

  getters: {
    isModerating: (state) => {
      const urlParams = new URLSearchParams(window.location.search);
      const isModerateFlagPresent = urlParams.has("moderate");

      return state.moderating || isModerateFlagPresent;
    },

    isSoundEmbargoed: (state) => state.soundEmbargo,
  },

  actions: {
    setModerating(val: boolean) {
      this.moderating = val;
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
      }) as unknown as number;
    },

    setPlaySounds(val: boolean) {
      this.playSounds = val;
    },
  },
});
