import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Chat } from '@ai-sdk/vue'

export const useChatStore = defineStore('chat', () => {
  const chat = new Chat({})
  const input = ref('')

  const isLoading = computed(() => {
    return chat.status === 'submitted'
  })

  const messages = computed(() => chat.messages)

  return {
    chat,
    input,
    isLoading,
    messages,
  }
})
