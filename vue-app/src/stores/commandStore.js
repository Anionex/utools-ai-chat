import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCommandStore = defineStore('command', () => {
  // 状态
  const commands = ref([])

  // 计算属性
  const builtinCommands = computed(() => {
    return commands.value.filter(cmd => 
      cmd.id === 'ai-translate' || cmd.id === 'ai-explain' || cmd.id === 'ask-ai'
    )
  })

  const customCommands = computed(() => {
    return commands.value.filter(cmd => 
      cmd.id !== 'ai-translate' && cmd.id !== 'ai-explain' && cmd.id !== 'ask-ai'
    )
  })

  // 加载指令
  function loadCommands() {
    if (!window.preload) return
    commands.value = window.preload.commandManager.getAllCommands() || []
  }

  // 添加指令
  function addCommand(command) {
    if (!command.code) {
      throw new Error('指令代码不能为空')
    }

    // 生成唯一ID（如果没有）
    if (!command.id) {
      command.id = 'cmd_' + Date.now()
    }

    // 添加指令到系统
    if (window.preload) {
      window.preload.commandManager.addCustomCommand(command)
    }

    // 重新加载命令列表
    loadCommands()

    return command
  }

  // 更新指令
  function updateCommand(id, command) {
    command.id = id

    if (window.preload) {
      window.preload.commandManager.addCustomCommand(command)
    }

    // 重新加载命令列表
    loadCommands()

    return command
  }

  // 删除指令
  function deleteCommand(code) {
    if (window.preload) {
      window.preload.commandManager.removeCustomCommand(code)
    }
    loadCommands()
  }

  // 获取特定指令
  function getCommand(id) {
    return commands.value.find(cmd => cmd.id === id)
  }

  return {
    // 状态
    commands,
    // 计算属性
    builtinCommands,
    customCommands,
    // 方法
    loadCommands,
    addCommand,
    updateCommand,
    deleteCommand,
    getCommand
  }
})


