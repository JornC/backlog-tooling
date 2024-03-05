import "./assets/main.css";

import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import { useContextStore } from "./stores/contextStore";
import { useSocketStore } from "./ws/socketManager";

const app = createApp(App);

app.use(createPinia());
app.use(router);

const contextStore = useContextStore();
router.beforeEach(() => contextStore.setSoundEmbargoed());

const socketStore = useSocketStore();
socketStore.initializeSocket();

app.mount("#app");
