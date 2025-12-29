import { createApp } from 'vue'
import App from './App.vue'
import router from './src/router'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'vue3-toastify/dist/index.css'
import './assets/theme.css'
import 'bootstrap/dist/js/bootstrap.bundle'

createApp(App).use(router).mount('#app')
