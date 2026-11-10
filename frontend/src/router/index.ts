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
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/epicwheel",
      name: "epicwheel",
      component: () => import("../views/MagicBoxView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/sounds",
      alias: "/audio",
      name: "sounds",
      component: () => import("../views/SoundsView.vue"),
      meta: { standalone: true },
    },
  ],
});

export default router;
