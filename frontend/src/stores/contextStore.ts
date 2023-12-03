import { defineStore } from "pinia";

export const useContextStore = defineStore("contextStore", {
  state: () => ({
    moderating: false as boolean,
  }),

  getters: {
    isModerating: (state) => {
      const urlParams = new URLSearchParams(window.location.search);
      const isModerateFlagPresent = urlParams.has("moderate");

      console.log(urlParams);
      console.log(isModerateFlagPresent);

      return state.moderating || isModerateFlagPresent;
    },
  },

  actions: {
    setModerating(val: boolean) {
      this.moderating = val;
    },
  },
});
