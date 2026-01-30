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
        class="thinking-header flex items-center gap-2 cursor-pointer select-none py-2 px-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-colors"
        @click="toggleThinking"
      >
        <!-- 思考图标 -->
        <div class="thinking-icon" :class="{ 'animate-pulse': message.isThinking }">
          <svg class="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        
        <!-- 思考状态标签 -->
        <span class="text-sm font-medium text-purple-600">
          {{ message.isThinking ? '正在思考中...' : '思考过程' }}
        </span>
        
        <!-- 思考中动画指示器 -->
        <div v-if="message.isThinking" class="flex gap-1 ml-1">
          <span class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
          <span class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
          <span class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
        </div>
        
        <!-- 展开/收起图标 -->
        <svg 
          class="w-4 h-4 text-purple-400 ml-auto transition-transform duration-200"
          :class="{ 'rotate-180': isThinkingExpanded }"
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      
      <!-- 思考内容 -->
      <transition name="thinking-expand">
        <div 
          v-show="isThinkingExpanded"
          class="thinking-content mt-2 pl-4 border-l-2 border-purple-200"
        >
          <div 
            class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap markdown-content thinking-text"
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
    <div class="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
         :class="{ 'right-9': message.role === 'assistant' }">
      <!-- 复制按钮 -->
      <div 
        class="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center cursor-pointer shadow-sm hover:bg-blue-50 hover:text-blue-500 transition-colors"
        title="复制消息"
        @click="$emit('copy', message.content)"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </div>

      <!-- 复制思考过程按钮（如果有思考内容） -->
      <div 
        v-if="message.reasoningContent"
        class="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center cursor-pointer shadow-sm hover:bg-purple-50 hover:text-purple-500 transition-colors"
        title="复制思考过程"
        @click="$emit('copy', message.reasoningContent)"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>

      <!-- 编辑按钮 -->
      <div 
        class="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center cursor-pointer shadow-sm hover:bg-gray-200 hover:text-gray-700 transition-colors"
        title="编辑消息"
        @click="$emit('edit')"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </div>

      <!-- 删除按钮 -->
      <div 
        class="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center cursor-pointer shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors"
        title="删除消息"
        @click="$emit('delete')"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </div>
    </div>

    <!-- AI 消息重试按钮 -->
    <div 
      v-if="message.role === 'assistant'"
      class="absolute bottom-2 right-2 w-5 h-5 bg-gray-100/10 rounded-full hidden group-hover:flex items-center justify-center cursor-pointer hover:bg-gray-200/20 hover:scale-110 transition-all"
      :class="{ 'animate-spin-slow': isRetrying }"
      title="重新发送"
      @click="$emit('retry')"
    >
      <svg class="w-3 h-3 text-dark-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 2v6h-6"></path>
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
        <path d="M3 22v-6h6"></path>
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
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
  background-color: rgba(139, 92, 246, 0.1);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.8em;
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
