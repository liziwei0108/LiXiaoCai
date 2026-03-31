<template>
  <div class="note-card" @click="$emit('click')">
    <div class="card-header">
      <h3 class="note-type">{{ note.noteType || '未命名笔记' }}</h3>
      <button
        class="delete-btn"
        @click.stop="$emit('delete')"
        title="删除"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    <p class="note-summary">{{ note.summary || '暂无内容摘要' }}</p>
    <div class="card-footer">
      <span class="note-date" v-if="note.updatedAt">
        {{ formatDate(note.updatedAt) }}
      </span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  note: {
    type: Object,
    required: true
  }
})

defineEmits(['click', 'delete'])

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
</script>

<style scoped>
.note-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.note-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.note-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #ff8c42 0%, #ff6b35 100%);
  opacity: 0;
  transition: opacity 0.2s;
}

.note-card:hover::before {
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.note-type {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.4;
  flex: 1;
  padding-right: 8px;
}

.delete-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}

.note-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #ff4444;
  color: white;
}

.delete-btn svg {
  width: 16px;
  height: 16px;
}

.note-summary {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  display: flex;
  justify-content: flex-start;
}

.note-date {
  font-size: 12px;
  color: #999;
}

@media (max-width: 640px) {
  .delete-btn {
    opacity: 1;
  }
}
</style>
