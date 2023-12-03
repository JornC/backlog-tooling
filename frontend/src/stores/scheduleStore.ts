import { defineStore } from "pinia";

interface ScheduleItem {
  title: string;
  code: string;
}

export const useScheduleStore = defineStore("scheduleStore", {
  state: () => ({
    schedule: [
      { title: "AER-1234", code: "aer-1234" },
      { title: "AER-4321", code: "aer-4321" },
      { title: "Break", code: "break-1" },
    ] as ScheduleItem[],
  }),

  getters: {
    totalScheduleItems: (state) => state.schedule.length,
  },

  actions: {
    getSchedule(): ScheduleItem[] {
      return this.schedule;
    },

    findScheduleItem(code: string): ScheduleItem | undefined {
      return this.schedule.find((item) => item.code === code);
    },
  },
});
