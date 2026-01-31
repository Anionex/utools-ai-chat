<template>
  <div 
    class="max-w-[90%] mb-4 px-4 py-3 rounded-2xl relative leading-relaxed group"
    :class="messageClasses"
  >
    <!-- 思考过程区域（可折叠） -->
    <div 
      v-if="message.role === 'assistant' && message.reasoningContent"
      class="thinking-section mb-3"
    >
      <div 
        class="thinking-header flex items-center gap-2 cursor-pointer select-none py-2 px-3 rounded-xl bg-dark-100 hover:bg-dark-200 transition-colors border border-dark-200"
        @click="toggleThinking"
      >
        <!-- 思考图标 -->
        <div class="thinking-icon" :class="{ 'animate-pulse': message.isThinking }">
          <Brain :size="16" class="text-dark-500" />
        </div>
        
        <!-- 思考状态标签 -->
        <span class="text-sm font-medium text-dark-600">
          {{ message.isThinking ? '正在思考中...' : '思考过程' }}
        </span>
        
        <!-- 思考中动画指示器 -->
        <div v-if="message.isThinking" class="flex gap-1 ml-1">
          <span class="w-1.5 h-1.5 bg-dark-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
          <span class="w-1.5 h-1.5 bg-dark-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
          <span class="w-1.5 h-1.5 bg-dark-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
        </div>
        
        <!-- 展开/收起图标 -->
        <ChevronDown 
          :size="16" 
          class="text-dark-400 ml-auto transition-transform duration-200"
          :class="{ 'rotate-180': isThinkingExpanded }"
        />
      </div>
      
      <!-- 思考内容 -->
      <transition name="thinking-expand">
        <div 
          v-show="isThinkingExpanded"
          class="thinking-content mt-2 pl-4 rounded-r-xl border-l-2 border-dark-200"
        >
          <div 
            class="text-sm text-dark-600 leading-relaxed whitespace-pre-wrap markdown-content thinking-text"
            v-html="renderedThinkingContent"
          ></div>
        </div>
      </transition>
    </div>

    <!-- 消息内容 -->
    <div 
      v-if="message.role === 'assistant'"
      class="markdown-content whitespace-pre-wrap"
      v-html="renderedContent"
    ></div>
    <div v-else class="whitespace-pre-wrap">{{ message.content }}</div>

    <!-- 时间戳 -->
    <div class="text-[10px] text-dark-400 mt-1 text-right mr-6">
      {{ formatTime(message.timestamp) }}
    </div>

    <!-- 消息操作按钮 -->
    <div class="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
         :class="{ 'right-9': message.role === 'assistant' }">
      <!-- 复制按钮 -->
      <div 
        class="w-6 h-6 rounded-lg bg-dark-50/80 flex items-center justify-center cursor-pointer text-dark-400 hover:bg-dark-200 hover:text-dark-600 transition-colors"
        title="复制消息"
        @click="$emit('copy', message.content)"
      >
        <Copy :size="14" />
      </div>

      <!-- 复制思考过程按钮（如果有思考内容） -->
      <div 
        v-if="message.reasoningContent"
        class="w-6 h-6 rounded-lg bg-dark-50/80 flex items-center justify-center cursor-pointer text-dark-400 hover:bg-dark-200 hover:text-dark-600 transition-colors"
        title="复制思考过程"
        @click="$emit('copy', message.reasoningContent)"
      >
        <Brain :size="14" />
      </div>

      <!-- 编辑按钮 -->
      <div 
        class="w-6 h-6 rounded bg-dark-50/80 flex items-center justify-center cursor-pointer text-dark-400 hover:bg-dark-200 hover:text-dark-600 transition-colors"
        title="编辑消息"
        @click="$emit('edit')"
      >
        <Pencil :size="14" />
      </div>

      <!-- 删除按钮 -->
      <div 
        class="w-6 h-6 rounded bg-dark-50/80 flex items-center justify-center cursor-pointer text-dark-400 hover:bg-dark-200 hover:text-error transition-colors"
        title="删除消息"
        @click="$emit('delete')"
      >
        <Trash2 :size="14" />
      </div>
    </div>

    <!-- AI 消息重试按钮 -->
    <div 
      v-if="message.role === 'assistant'"
      class="absolute bottom-2 right-2 w-5 h-5 rounded hidden group-hover:flex items-center justify-center cursor-pointer text-dark-400 hover:bg-dark-200 hover:text-dark-600 transition-all"
      :class="{ 'animate-spin-slow': isRetrying }"
      title="重新发送"
      @click="$emit('retry')"
    >
      <RotateCcw :size="12" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Brain, ChevronDown, Copy, Pencil, Trash2, RotateCcw } from 'lucide-vue-next'
import { marked } from 'marked'
import hljs from 'highlight.js'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  isRetrying: {
    type: Boolean,
    default: false
  }
})

defineEmits(['copy', 'edit', 'delete', 'retry'])

// 思考过程展开/收起状态
const isThinkingExpanded = ref(true)

// 当消息正在思考时，自动展开
watch(() => props.message.isThinking, (isThinking) => {
  if (isThinking) {
    isThinkingExpanded.value = true
  }
})

function toggleThinking() {
  isThinkingExpanded.value = !isThinkingExpanded.value
}

// 配置 marked
marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  },
  langPrefix: 'hljs language-',
  gfm: true,
  breaks: true
})

const messageClasses = computed(() => {
  switch (props.message.role) {
    case 'user':
      return 'self-end bg-dark-200 text-gray-800 rounded-br-sm'
    case 'assistant':
      return 'self-start bg-dark-100 text-gray-800 rounded-bl-sm pb-8 px-8'
    case 'system':
      return 'self-start bg-blue-50 text-blue-800 rounded-bl-sm text-sm'
    default:
      return ''
  }
})

const renderedContent = computed(() => {
  if (props.message.role === 'assistant') {
    return marked.parse(props.message.content || '')
  }
  return props.message.content || ''
})

const renderedThinkingContent = computed(() => {
  if (props.message.reasoningContent) {
    return marked.parse(props.message.reasoningContent)
  }
  return ''
})

function formatTime(timestamp) {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
/* 思考过程展开/收起动画 */
.thinking-expand-enter-active,
.thinking-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.thinking-expand-enter-from,
.thinking-expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.thinking-expand-enter-to,
.thinking-expand-leave-from {
  opacity: 1;
  max-height: 1000px;
  transform: translateY(0);
}

/* 思考内容样式 */
.thinking-text {
  font-size: 0.875rem;
  line-height: 1.6;
  color: #6b7280;
}

.thinking-text :deep(code) {
  background-color: rgba(139, 92, 246, 0.15);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.8em;
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #6b21a8;
}

.thinking-text :deep(pre) {
  background-color: rgba(139, 92, 246, 0.05);
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

/* 思考中动画 */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.animate-bounce {
  animation: bounce 0.6s ease-in-out infinite;
}

/* 脉冲动画 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
