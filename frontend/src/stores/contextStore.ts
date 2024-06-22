import { defineStore } from "pinia";

export const useContextStore = defineStore("contextStore", {
  state: () => ({
    playSounds: true as boolean,
    userPanelActive: false as boolean,

    soundEmbargo: false as boolean,
    soundEmbargoTimeout: null as number | null, // Add a timeout reference
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
      }) as unknown as number;
    },

    setPlaySounds(val: boolean) {
      this.playSounds = val;
    },
  },
});
