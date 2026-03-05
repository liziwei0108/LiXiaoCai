import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Chat } from '@ai-sdk/vue'

export const useChatStore = defineStore('chat', () => {
  let chat = new Chat({
    id: 'testId',
  })

  const isLoading = computed(() => {
    return chat.status === 'submitted'
  })

  const messages = computed(() => chat.messages || [])


  watch(() => messages.value, (newMessages) => {
    console.log('Store messages changed:', JSON.stringify(newMessages, null, 2))
  }, { deep: true })

  return {
    chat,
    isLoading,
    messages,
  }
})
