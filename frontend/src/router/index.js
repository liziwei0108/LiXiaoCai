import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import Chat from '../Chat.vue'
import Notes from '../Notes.vue'

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
    },
    {
      path: '/notes',
      name: 'notes',
      component: Notes,
      meta: { requiresAuth: true }
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()
  
  // 如果有token但没有用户信息，先获取用户信息
  if (!authStore.user && authStore.token) {
    await authStore.fetchUserInfo()
  }

  // 需要登录的页面
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // 未登录，跳转到聊天页面
    return '/chat'
  }

  return true
})

export default router
