<template>
  <div class="flex-1 flex flex-col max-w-[70%] bg-white">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 flex flex-col gap-3 bg-dark-50">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-medium text-gray-800 truncate">{{ title }}</h2>
        <div class="flex items-center gap-2">
          <span class="text-gray-600">模型:</span>
          <select 
            :value="currentModelIndex"
            @change="$emit('modelChange', Number($event.target.value))"
            class="px-2 py-1 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:border-primary"
            :disabled="!hasModels"
          >
            <option v-if="!hasModels" value="">请先添加模型</option>
            <option 
              v-for="(model, index) in models" 
              :key="index" 
              :value="index"
            >
              {{ model.name }}
            </option>
          </select>
        </div>
      </div>
      
      <!-- 思考长度控制 -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span class="text-sm text-gray-600 whitespace-nowrap">思考深度:</span>
        </div>
        <input 
          type="range" 
          :value="thinkingBudget"
          @input="$emit('thinkingBudgetChange', Number($event.target.value))"
          min="1024"
          max="65536"
          step="1024"
          class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <span class="text-sm text-purple-600 font-medium min-w-[60px] text-right">
          {{ formatTokens(thinkingBudget) }}
        </span>
      </div>
    </div>

    <!-- Messages -->
    <div 
      ref="messagesContainer"
      class="flex-1 p-4 overflow-y-auto flex flex-col bg-dark-50"
    >
      <ChatMessage
        v-for="(message, index) in messages"
        :key="index"
        :message="message"
        :is-retrying="retryingIndex === index"
        @copy="handleCopy"
        @edit="$emit('editMessage', index)"
        @delete="$emit('deleteMessage', index)"
        @retry="$emit('retryMessage', index)"
      />
    </div>

    <!-- Input -->
    <div class="w-full p-4 border-t border-gray-200 bg-dark-50">
      <div class="flex gap-3">
        <textarea
          ref="inputRef"
          v-model="inputValue"
          class="flex-1 px-4 py-3 border border-gray-300 rounded-3xl outline-none resize-none max-h-[120px] overflow-y-auto bg-white focus:border-primary"
          placeholder="输入消息..."
          rows="1"
          @keydown.enter.exact.prevent="handleSend"
          @input="autoResize"
        ></textarea>
        <button
          @click="handleSend"
          :disabled="!canSend && !isGenerating"
          class="w-11 h-11 rounded-full flex items-center justify-center transition-all"
          :class="buttonClasses"
        >
          <!-- 发送图标 -->
          <svg v-if="!isGenerating" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          <!-- 停止图标 -->
          <svg v-else class="w-5 h-5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" fill="currentColor" class="animate-pulse-slow text-red-400"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import ChatMessage from './ChatMessage.vue'
import { useNotificationStore } from '@/stores/notificationStore'

const props = defineProps({
  title: {
    type: String,
    default: '新对话'
  },
  messages: {
    type: Array,
    default: () => []
  },
  models: {
    type: Array,
    default: () => []
  },
  currentModelIndex: {
    type: Number,
    default: 0
  },
  hasModels: {
    type: Boolean,
    default: false
  },
  isGenerating: {
    type: Boolean,
    default: false
  },
  retryingIndex: {
    type: Number,
    default: -1
  },
  thinkingBudget: {
    type: Number,
    default: 32768  // 默认 32K tokens
  }
})

const emit = defineEmits([
  'modelChange', 
  'send', 
  'stop', 
  'editMessage', 
  'deleteMessage', 
  'retryMessage',
  'thinkingBudgetChange'
])

// 格式化 token 数量显示
function formatTokens(tokens) {
  if (tokens >= 1024) {
    return Math.round(tokens / 1024) + 'K'
  }
  return tokens.toString()
}

const notification = useNotificationStore()

const inputRef = ref(null)
const messagesContainer = ref(null)
const inputValue = ref('')

const canSend = computed(() => inputValue.value.trim() !== '')

const buttonClasses = computed(() => {
  if (props.isGenerating) {
    return 'bg-dark-800 text-white hover:bg-dark-700 cursor-pointer'
  }
  if (canSend.value) {
    return 'bg-primary text-white hover:bg-primary-hover cursor-pointer'
  }
  return 'bg-gray-300 text-white cursor-not-allowed'
})

// 自动滚动到底部
watch(() => props.messages.length, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
})

// 监听最后一条消息的内容变化（流式输出）
watch(() => props.messages[props.messages.length - 1]?.content, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      const { scrollHeight, scrollTop, clientHeight } = messagesContainer.value
      // 只有当用户接近底部时才自动滚动
      if (scrollHeight - scrollTop - clientHeight < 100) {
        messagesContainer.value.scrollTop = scrollHeight
      }
    }
  })
})

function handleSend() {
  if (props.isGenerating) {
    emit('stop')
    return
  }
  
  if (!canSend.value) return
  
  emit('send', inputValue.value)
  inputValue.value = ''
  
  // 重置 textarea 高度
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }
}

function autoResize() {
  const textarea = inputRef.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }
}

function handleCopy(content) {
  navigator.clipboard.writeText(content)
    .then(() => {
      notification.success('已复制到剪贴板')
    })
    .catch(() => {
      // 回退方法
      const textarea = document.createElement('textarea')
      textarea.value = content
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        notification.success('已复制到剪贴板')
      } catch {
        notification.error('复制失败')
      }
      document.body.removeChild(textarea)
    })
}

// 暴露方法给父组件
function focus() {
  inputRef.value?.focus()
}

defineExpose({ focus })
</script>


