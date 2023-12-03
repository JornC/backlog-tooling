import "./assets/main.css";

import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import { useSocketStore } from "./ws/socketManager";

const app = createApp(App);

app.use(createPinia());
app.use(router);

const socketStore = useSocketStore();
socketStore.initializeSocket();

app.mount("#app");
