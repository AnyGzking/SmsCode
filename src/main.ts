import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import './assets/index.css';
import { i18n } from './plugins/i18n';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);

app.mount('#app');

// Hide the fallback loader after Vue is mounted and ready
router.isReady().then(() => {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.classList.add('fade-out');
    // Remove loader from DOM after transition
    setTimeout(() => {
      loader.remove();
    }, 300);
  }
});

