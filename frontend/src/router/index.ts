import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"),
    },
    {
      path: "/agenda/:code",
      name: "AgendaRoute",
      component: () => import("../views/AgendaItemView.vue"),
    },
    {
      path: "/summary",
      name: "summary",
      component: () => import("../views/SummaryView.vue"),
    },
  ],
});

export default router;
