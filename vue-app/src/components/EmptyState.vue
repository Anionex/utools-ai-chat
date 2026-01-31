<template>
  <div class="flex-1 flex flex-col items-center justify-center bg-dark-50 text-dark-500 text-center p-8">
    <!-- 图标 -->
    <div class="w-16 h-16 rounded-full bg-dark-100 flex items-center justify-center mb-6">
      <MessageSquare :size="28" class="text-dark-500" />
    </div>
    
    <!-- 标题与描述 -->
    <h2 class="text-lg font-display font-medium text-dark-700 mb-2">开始新对话</h2>
    <p class="text-dark-500 mb-6 max-w-xs text-sm">开始一个新的对话，或从左侧选择历史记录</p>
    
    <!-- 主按钮 -->
    <button 
      @click="$emit('startChat')"
      class="px-4 py-2 bg-dark-700 text-dark-100 rounded hover:bg-dark-600 transition-all flex items-center gap-2 text-sm"
    >
      <Plus :size="16" />
      <span>新对话</span>
    </button>

    <!-- 快捷键提示 -->
    <div class="mt-10 flex flex-col gap-2 bg-dark-100 px-5 py-4 rounded border border-dark-200">
      <div class="flex items-center text-sm gap-1">
        <MessageSquarePlus :size="14" class="text-dark-400 mr-1" />
        <span class="text-dark-500 w-20 text-left">新建对话</span>
        <kbd class="inline-block px-2 py-0.5 mx-0.5 font-mono text-xs text-dark-600 bg-dark-50 border border-dark-200 rounded">Ctrl</kbd>
        <span class="text-dark-400">+</span>
        <kbd class="inline-block px-2 py-0.5 mx-0.5 font-mono text-xs text-dark-600 bg-dark-50 border border-dark-200 rounded">N</kbd>
      </div>
      <div class="flex items-center text-sm gap-1">
        <RefreshCw :size="14" class="text-dark-400 mr-1" />
        <span class="text-dark-500 w-20 text-left">切换模型</span>
        <kbd class="inline-block px-2 py-0.5 mx-0.5 font-mono text-xs text-dark-600 bg-dark-50 border border-dark-200 rounded">Ctrl</kbd>
        <span class="text-dark-400">+</span>
        <kbd class="inline-block px-2 py-0.5 mx-0.5 font-mono text-xs text-dark-600 bg-dark-50 border border-dark-200 rounded">Shift</kbd>
        <span class="text-dark-400">+</span>
        <kbd class="inline-block px-2 py-0.5 mx-0.5 font-mono text-xs text-dark-600 bg-dark-50 border border-dark-200 rounded">M</kbd>
      </div>
      <div class="flex items-center text-sm gap-1">
        <Bot :size="14" class="text-dark-400 mr-1" />
        <span class="text-dark-500 w-20 text-left">模型选择</span>
        <kbd class="inline-block px-2 py-0.5 mx-0.5 font-mono text-xs text-dark-600 bg-dark-50 border border-dark-200 rounded">Ctrl</kbd>
        <span class="text-dark-400">+</span>
        <kbd class="inline-block px-2 py-0.5 mx-0.5 font-mono text-xs text-dark-600 bg-dark-50 border border-dark-200 rounded">Alt</kbd>
        <span class="text-dark-400">+</span>
        <kbd class="inline-block px-2 py-0.5 mx-0.5 font-mono text-xs text-dark-600 bg-dark-50 border border-dark-200 rounded">T</kbd>
      </div>
    </div>
  </div>
</template>

<script setup>
import { MessageSquare, Plus, MessageSquarePlus, RefreshCw, Bot } from 'lucide-vue-next'

defineEmits(['startChat'])
</script>


