import { defineStore } from "pinia";

export interface ScheduleItem {
  title: string;
  code: string;
  locked?: boolean;
}

export const useScheduleStore = defineStore("scheduleStore", {
  state: () => ({
    schedule: [] as ScheduleItem[],
  }),

  getters: {
    totalScheduleItems: (state) => state.schedule.length,
  },

  actions: {
    getSchedule(): ScheduleItem[] {
      return this.schedule;
    },

    setSchedule(schedule: ScheduleItem[]) {
      this.schedule = schedule;
    },

    findScheduleItem(code: string): ScheduleItem | undefined {
      return this.schedule.find((item) => item.code === code);
    },
  },
});
