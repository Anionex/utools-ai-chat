<template>
  <div class="flex-1 flex flex-col items-center justify-center bg-dark-50 text-gray-500 text-center p-5">
    <div class="text-6xl mb-5">💭</div>
    <div class="text-lg text-gray-600 mb-5">开始一个新的对话，或从左侧选择历史记录</div>
    <button 
      @click="$emit('startChat')"
      class="px-6 py-3 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
    >
      开始新对话
    </button>

    <div class="mt-8 flex flex-col gap-3 bg-gray-100 px-5 py-4 rounded-lg border border-gray-200">
      <div class="flex items-center text-sm text-gray-600">
        新建对话: 
        <kbd class="inline-block px-2 py-1 mx-1 font-mono text-xs text-gray-700 bg-gray-50 border border-gray-300 rounded shadow-sm">Ctrl</kbd>
        +
        <kbd class="inline-block px-2 py-1 mx-1 font-mono text-xs text-gray-700 bg-gray-50 border border-gray-300 rounded shadow-sm">N</kbd>
      </div>
      <div class="flex items-center text-sm text-gray-600">
        切换模型: 
        <kbd class="inline-block px-2 py-1 mx-1 font-mono text-xs text-gray-700 bg-gray-50 border border-gray-300 rounded shadow-sm">Ctrl</kbd>
        +
        <kbd class="inline-block px-2 py-1 mx-1 font-mono text-xs text-gray-700 bg-gray-50 border border-gray-300 rounded shadow-sm">Shift</kbd>
        +
        <kbd class="inline-block px-2 py-1 mx-1 font-mono text-xs text-gray-700 bg-gray-50 border border-gray-300 rounded shadow-sm">M</kbd>
      </div>
      <div class="flex items-center text-sm text-gray-600">
        模型选择: 
        <kbd class="inline-block px-2 py-1 mx-1 font-mono text-xs text-gray-700 bg-gray-50 border border-gray-300 rounded shadow-sm">Ctrl</kbd>
        +
        <kbd class="inline-block px-2 py-1 mx-1 font-mono text-xs text-gray-700 bg-gray-50 border border-gray-300 rounded shadow-sm">Alt</kbd>
        +
        <kbd class="inline-block px-2 py-1 mx-1 font-mono text-xs text-gray-700 bg-gray-50 border border-gray-300 rounded shadow-sm">T</kbd>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['startChat'])
</script>


