<template>
  <div class="w-[250px] bg-dark-900 text-dark-300 flex flex-col border-r border-dark-800">
    <!-- Header -->
    <div class="p-4 border-b border-dark-800 flex justify-between items-center">
      <h2 class="text-base font-medium text-dark-200">聊天记录</h2>
      <button 
        @click="$emit('newChat')"
        class="w-8 h-8 flex items-center justify-center text-dark-400 rounded-xl hover:bg-dark-800 hover:text-dark-200 transition-all"
        title="新对话"
      >
        <Plus :size="18" />
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto dark-scrollbar bg-dark-900 px-1 py-2">
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
      <div v-if="sessions.length === 0" class="p-4 text-center text-dark-500 text-sm">
        暂无聊天记录
      </div>
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-dark-800 flex justify-between gap-2">
      <button 
        @click="$emit('openSettings')"
        class="flex-1 h-8 flex items-center justify-center text-dark-400 rounded-xl hover:bg-dark-800 hover:text-dark-200 transition-all"
        title="设置"
      >
        <Settings :size="18" />
      </button>
      <div class="relative flex-1">
        <button 
          @click="showDropdown = !showDropdown"
          class="w-full h-8 flex items-center justify-center text-dark-400 rounded-xl hover:bg-dark-800 hover:text-dark-200 transition-all"
          title="帮助"
        >
          <HelpCircle :size="18" />
        </button>
        <div 
          v-if="showDropdown"
          class="absolute bottom-full right-0 mb-2 bg-dark-800 min-w-[140px] rounded-xl shadow-lg overflow-hidden z-10 border border-dark-700"
        >
          <div 
            class="px-4 py-3 cursor-pointer text-dark-300 hover:bg-dark-700 hover:text-dark-100 transition-colors flex items-center gap-2 rounded-xl"
            @click="handleOpenShortcuts"
          >
            <Keyboard :size="16" />
            <span class="text-sm">快捷键</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Plus, Settings, HelpCircle, Keyboard } from 'lucide-vue-next'
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


