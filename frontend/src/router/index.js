import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
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

// 路由守卫
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()
  
  // 初始化认证状态
  if (!authStore.user && authStore.token) {
    await authStore.fetchUserInfo()
  }

  return true
})

export default router
