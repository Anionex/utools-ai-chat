<template>
  <div class="flex-1 flex flex-col max-w-[70%] bg-dark-50">
    <!-- Header -->
    <div class="p-4 border-b border-dark-200 flex flex-col gap-3 bg-dark-50">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-medium text-dark-700 truncate">{{ title }}</h2>
        <div class="flex items-center gap-3">
          <Bot :size="18" class="text-dark-500 shrink-0" />
          <select 
            :value="currentModelIndex"
            @change="$emit('modelChange', Number($event.target.value))"
            class="model-select min-w-[180px] px-4 py-2.5 rounded-xl border border-dark-200 bg-white text-dark-700 font-medium shadow-sm hover:border-dark-300 hover:shadow focus:outline-none focus:ring-2 focus:ring-dark-400/30 focus:border-dark-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          <Brain :size="16" class="text-dark-500" />
          <span class="text-sm text-dark-500 whitespace-nowrap">思考深度</span>
        </div>
        <input 
          type="range" 
          :value="thinkingBudget"
          @input="$emit('thinkingBudgetChange', Number($event.target.value))"
          min="1024"
          max="65536"
          step="1024"
          class="flex-1 h-1.5 bg-dark-200 rounded-lg appearance-none cursor-pointer accent-dark-600"
        />
        <span class="text-sm text-dark-600 font-medium min-w-[60px] text-right">
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
    <div class="w-full p-4 border-t border-dark-200 bg-dark-50">
      <div class="flex gap-3">
        <textarea
          ref="inputRef"
          v-model="inputValue"
          class="flex-1 px-4 py-3 border border-dark-200 rounded-2xl outline-none resize-none max-h-[120px] overflow-y-auto bg-white text-dark-700 placeholder-dark-400 focus:border-dark-400 transition-colors"
          placeholder="输入消息..."
          rows="1"
          @keydown.enter.exact.prevent="handleSend"
          @input="autoResize"
        ></textarea>
        <button
          @click="handleSend"
          :disabled="!canSend && !isGenerating"
          class="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          :class="buttonClasses"
          :title="isGenerating ? '停止生成' : '发送消息'"
        >
          <!-- 发送图标 -->
          <Send v-if="!isGenerating" :size="18" />
          <!-- 停止图标 -->
          <StopCircle v-else :size="20" class="animate-pulse-slow" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Bot, Brain, Send, StopCircle } from 'lucide-vue-next'
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
    return 'bg-dark-700 text-dark-200 hover:bg-dark-600 cursor-pointer'
  }
  if (canSend.value) {
    return 'bg-dark-700 text-dark-100 hover:bg-dark-600 cursor-pointer'
  }
  return 'bg-dark-200 text-dark-400 cursor-not-allowed'
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


