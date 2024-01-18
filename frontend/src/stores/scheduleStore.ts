import { defineStore } from "pinia";

export interface ScheduleItem {
  title: string;
  code: string;
  description?: string;
  groupTitle?: string;
  locked?: boolean;
}

export const useScheduleStore = defineStore("scheduleStore", {
  state: () => ({
    schedule: [] as ScheduleItem[],
  }),

  getters: {
    totalScheduleItems: (state) => state.schedule.length,
    groupedSchedule: (state) => {
      const orderedGroups: Array<{ groupTitle: string; items: ScheduleItem[] }> = [];
      let currentGroup: { groupTitle: string; items: ScheduleItem[] } | null = null;

      state.schedule.forEach((item) => {
        if (!currentGroup || currentGroup.groupTitle !== item.groupTitle) {
          if (currentGroup) {
            orderedGroups.push(currentGroup);
          }
          currentGroup = { groupTitle: item.groupTitle || "", items: [item] };
        } else {
          currentGroup.items.push(item);
        }
      });

      if (currentGroup) {
        orderedGroups.push(currentGroup);
      }

      return orderedGroups;
    },
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
