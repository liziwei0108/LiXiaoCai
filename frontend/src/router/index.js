import { createRouter, createWebHistory } from 'vue-router'
import Chat from '../Chat.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/chat'
    },
    {
      path: '/chat',
      name: 'chat',
      component: Chat
    }
  ]
})

export default router
