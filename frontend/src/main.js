import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import Chat from './Chat.vue'

const app = createApp(Chat)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
