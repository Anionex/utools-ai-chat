<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="modelValue" 
        class="fixed inset-0 bg-black/30 z-[1001]"
        @click.self="$emit('update:modelValue', false)"
      >
        <div 
          class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-900 text-white rounded-xl shadow-2xl p-5 min-w-[400px] max-w-[600px]"
        >
          <div class="flex items-center gap-2 text-sm text-dark-400 mb-3 px-2">
            <Bot :size="16" />
            <span>选择模型</span>
            <kbd class="ml-auto px-1.5 py-0.5 text-xs bg-dark-700 rounded">Ctrl+Alt+T</kbd>
          </div>

          <!-- 搜索框 -->
          <div class="mb-3 relative">
            <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="w-full pl-10 pr-3 py-2 border border-dark-700 rounded-lg bg-dark-800 text-white placeholder-dark-400 focus:outline-none focus:border-dark-500 transition-colors"
              placeholder="搜索模型..."
              @keydown="handleKeydown"
            />
          </div>

          <!-- 模型列表 -->
          <ul class="list-none m-0 p-0 max-h-[300px] overflow-y-auto">
            <li
              v-for="(model, index) in filteredModels"
              :key="index"
              class="px-3 py-2.5 cursor-pointer flex items-center gap-3 rounded-lg my-1 transition-colors"
              :class="{
                'bg-dark-700': activeIndex === index,
                'hover:bg-dark-800': activeIndex !== index
              }"
              @click="handleSelect(index)"
              @mouseenter="activeIndex = index"
            >
              <Check 
                v-if="getOriginalIndex(index) === currentIndex" 
                :size="16" 
                class="text-green-400" 
              />
              <div v-else class="w-4"></div>
              <div class="flex-1 text-sm">{{ model.name }}</div>
              <div class="text-dark-500 text-xs">
                {{ getOriginalIndex(index) + 1 }}
              </div>
            </li>
            <li v-if="filteredModels.length === 0" class="px-3 py-4 text-dark-400 text-center">
              <SearchX :size="20" class="mx-auto mb-2 opacity-50" />
              <span>无匹配模型</span>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Bot, Search, Check, SearchX } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  models: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const searchInputRef = ref(null)
const searchQuery = ref('')
const activeIndex = ref(0)

// 过滤后的模型列表
const filteredModels = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.models
  }
  return props.models.filter(model => 
    model.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 获取原始索引
function getOriginalIndex(filteredIndex) {
  const model = filteredModels.value[filteredIndex]
  return props.models.findIndex(m => m.name === model.name)
}

// 当弹窗打开时聚焦搜索框
watch(() => props.modelValue, (val) => {
  if (val) {
    searchQuery.value = ''
    activeIndex.value = props.currentIndex
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
})

// 当搜索内容变化时，重置激活索引
watch(searchQuery, () => {
  activeIndex.value = 0
})

function handleSelect(index) {
  const originalIndex = getOriginalIndex(index)
  emit('select', originalIndex)
  emit('update:modelValue', false)
}

function handleKeydown(e) {
  const maxIndex = filteredModels.value.length - 1

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeIndex.value = Math.min(activeIndex.value + 1, maxIndex)
      break
    case 'ArrowUp':
      e.preventDefault()
      activeIndex.value = Math.max(activeIndex.value - 1, 0)
      break
    case 'Enter':
      e.preventDefault()
      if (filteredModels.value.length > 0) {
        handleSelect(activeIndex.value)
      }
      break
    case 'Escape':
      e.preventDefault()
      emit('update:modelValue', false)
      break
    default:
      // 数字键选择
      const num = parseInt(e.key)
      if (!isNaN(num) && num >= 1 && num <= props.models.length) {
        e.preventDefault()
        emit('select', num - 1)
        emit('update:modelValue', false)
      }
  }
}
</script>


