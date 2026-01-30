import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useModelStore = defineStore('model', () => {
  // 状态
  const modelConfigs = ref([])
  const currentModelIndex = ref(0)
  const thinkingBudget = ref(32768) // 默认 32K tokens，用于控制思考模型的输出长度

  // 计算属性
  const currentModel = computed(() => {
    return modelConfigs.value[currentModelIndex.value] || null
  })

  const hasModels = computed(() => {
    return modelConfigs.value.length > 0
  })

  // 加载模型配置
  function loadModelConfigs() {
    if (!window.preload) return
    
    modelConfigs.value = window.preload.dbUtil.getModelConfig() || []
    currentModelIndex.value = window.preload.dbUtil.getModelIndex() || 0
    
    // 加载思考深度设置
    const savedBudget = window.preload.dbUtil.getThinkingBudget?.()
    if (savedBudget) {
      thinkingBudget.value = savedBudget
    }

    // 确保每个模型配置都有必要的字段
    modelConfigs.value = modelConfigs.value.map(config => ({
      name: config.name || '未命名模型',
      model: config.model || 'gpt-3.5-turbo',
      url: config.url || 'https://api.openai.com/v1/chat/completions',
      key: config.key || '',
      systemPrompt: config.systemPrompt || ''
    }))
  }
  
  // 设置思考深度
  function setThinkingBudget(budget) {
    thinkingBudget.value = budget
    if (window.preload?.dbUtil?.saveThinkingBudget) {
      window.preload.dbUtil.saveThinkingBudget(budget)
    }
  }

  // 验证模型配置
  function validateModelConfig(config) {
    const errors = []

    if (!config.name || config.name.trim() === '') {
      errors.push('模型名称不能为空')
    }

    if (!config.model || config.model.trim() === '') {
      errors.push('模型ID不能为空')
    }

    if (!config.url || config.url.trim() === '') {
      errors.push('API地址不能为空')
    } else {
      try {
        new URL(config.url)
      } catch {
        errors.push('API地址格式不正确')
      }
    }

    if (!config.key || config.key.trim() === '') {
      errors.push('API密钥不能为空')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 添加模型
  function addModel(config) {
    const validation = validateModelConfig(config)
    if (!validation.isValid) {
      throw new Error(validation.errors.join('\n'))
    }

    modelConfigs.value.push(config)
    saveModelConfigs()
  }

  // 更新模型
  function updateModel(index, config) {
    if (index < 0 || index >= modelConfigs.value.length) {
      throw new Error('模型索引无效')
    }

    const validation = validateModelConfig(config)
    if (!validation.isValid) {
      throw new Error(validation.errors.join('\n'))
    }

    modelConfigs.value[index] = config
    saveModelConfigs()
  }

  // 删除模型
  function deleteModel(index) {
    if (index < 0 || index >= modelConfigs.value.length) {
      throw new Error('模型索引无效')
    }

    modelConfigs.value.splice(index, 1)
    
    // 如果删除的是当前选中的模型，重置索引
    if (currentModelIndex.value >= modelConfigs.value.length) {
      currentModelIndex.value = Math.max(0, modelConfigs.value.length - 1)
    }
    
    saveModelConfigs()
  }

  // 保存模型配置
  function saveModelConfigs() {
    if (!window.preload) return
    window.preload.dbUtil.saveModelConfig(modelConfigs.value)
  }

  // 设置当前选中的模型
  function setCurrentModel(index) {
    if (index < 0 || index >= modelConfigs.value.length) {
      throw new Error('模型索引无效')
    }
    currentModelIndex.value = index
    if (window.preload) {
      window.preload.dbUtil.saveModelIndex(index)
    }
  }

  // 切换到下一个模型
  function switchToNextModel() {
    if (modelConfigs.value.length === 0) {
      throw new Error('请先添加模型配置')
    }
    
    const nextIndex = (currentModelIndex.value + 1) % modelConfigs.value.length
    setCurrentModel(nextIndex)
    return modelConfigs.value[nextIndex]
  }

  return {
    // 状态
    modelConfigs,
    currentModelIndex,
    thinkingBudget,
    // 计算属性
    currentModel,
    hasModels,
    // 方法
    loadModelConfigs,
    validateModelConfig,
    addModel,
    updateModel,
    deleteModel,
    setCurrentModel,
    switchToNextModel,
    setThinkingBudget
  }
})


