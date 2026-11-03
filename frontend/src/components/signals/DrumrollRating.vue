<template>
  <div class="drumroll-rating">
    <a class="sound" :href="`/drumrolls/${drumroll.id}.mp3`" target="_blank" rel="noopener">
      {{ drumroll.label }}
      <span class="material-symbols-rounded open-icon">open_in_new</span>
    </a>
    <div class="buttons">
      <poker-button
        v-for="rating in DRUMROLL_RATINGS"
        :key="rating"
        :user-highlight="isUserSelection(rating)"
        @send-action="sendRating(rating)"
        :scale="true"
        :value="rating"
        :type="ActionType.DRUMROLL_RATING"
        :count="getCount(rating)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ActionType,
  DRUMROLL_RATINGS,
  type Drumroll,
  type RoomStateFragment,
} from "@/domain/types";

const props = defineProps<{
  userId: string;
  roomState: RoomStateFragment[];
  drumroll: Drumroll;
}>();

const emit = defineEmits<{
  (event: "sendAction", value: RoomStateFragment): void;
}>();

const ratings = computed(() =>
  props.roomState.filter((v) => v.type === ActionType.DRUMROLL_RATING),
);

function isUserSelection(rating: string) {
  return ratings.value.some((v) => v.user === props.userId && v.value === rating);
}

function getCount(rating: string) {
  return ratings.value.filter((v) => v.value === rating).length;
}

function sendRating(rating: string) {
  emit("sendAction", { type: ActionType.DRUMROLL_RATING, value: rating });
}
</script>

<style lang="scss" scoped>
.drumroll-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacer);
}

.sound {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  font-weight: bold;
  color: var(--brand-color-1);

  .open-icon {
    font-size: 1em;
  }
}

.buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: calc(var(--spacer) * 0.4);
}
</style>
