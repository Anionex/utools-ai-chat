<template>
  <div class="w-[250px] bg-dark-900 text-dark-50 flex flex-col border-r border-dark-700">
    <!-- Header -->
    <div class="p-4 border-b border-dark-700 flex justify-between items-center">
      <h2 class="text-base font-medium">聊天记录</h2>
      <button 
        @click="$emit('newChat')"
        class="px-3 py-2 bg-primary text-white text-sm rounded hover:bg-primary-hover transition-colors"
      >
        新对话
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <ul class="list-none">
        <ChatItem
          v-for="session in sessions"
          :key="session.id"
          :session="session"
          :is-active="session.id === currentSessionId"
          @select="$emit('selectSession', session.id)"
          @delete="$emit('deleteSession', session.id)"
        />
      </ul>
      <div v-if="sessions.length === 0" class="p-4 text-center text-dark-400 text-sm">
        暂无聊天记录
      </div>
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-dark-700 flex justify-between gap-3">
      <button 
        @click="$emit('openSettings')"
        class="flex-1 px-3 py-2 bg-dark-600 text-white text-sm rounded hover:bg-dark-700 transition-colors text-center"
      >
        设置
      </button>
      <div class="relative flex-1">
        <button 
          @click="showDropdown = !showDropdown"
          class="w-full px-3 py-2 bg-dark-600 text-white text-sm rounded hover:bg-dark-700 transition-colors"
        >
          帮助
        </button>
        <div 
          v-if="showDropdown"
          class="absolute bottom-full right-0 mb-2 bg-dark-800 min-w-[120px] rounded shadow-lg overflow-hidden z-10"
        >
          <div 
            class="px-4 py-3 cursor-pointer text-dark-50 hover:bg-dark-700 transition-colors"
            @click="handleOpenShortcuts"
          >
            快捷键
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ChatItem from './ChatItem.vue'

defineProps({
  sessions: {
    type: Array,
    default: () => []
  },
  currentSessionId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['newChat', 'selectSession', 'deleteSession', 'openSettings', 'openShortcuts'])

const showDropdown = ref(false)

function handleOpenShortcuts() {
  showDropdown.value = false
  emit('openShortcuts')
}

// 点击外部关闭下拉菜单
function handleClickOutside(e) {
  if (!e.target.closest('.relative')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>


