import { defineStore } from "pinia";

export const useContextStore = defineStore("contextStore", {
  state: () => ({
    playSounds: true as boolean,
    moderating: false as boolean,
  }),

  getters: {
    isModerating: (state) => {
      const urlParams = new URLSearchParams(window.location.search);
      const isModerateFlagPresent = urlParams.has("moderate");

      return state.moderating || isModerateFlagPresent;
    },
  },

  actions: {
    setModerating(val: boolean) {
      this.moderating = val;
    },

    setPlaySounds(val: boolean) {
      this.moderating = val;
    },
  },
});
