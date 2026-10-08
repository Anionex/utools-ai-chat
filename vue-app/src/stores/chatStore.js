import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useChatStore = defineStore('chat', () => {
  const STREAM_SAVE_INTERVAL = 250

  // 将消息数组转换为可保存的纯对象（完全序列化，移除响应式代理和临时字段）
  function toSaveableMessages(messages) {
    // 使用 JSON.parse(JSON.stringify()) 进行完全深度克隆，确保没有 Vue 响应式代理
    const plainMessages = JSON.parse(JSON.stringify(messages))
    // 移除临时的 isThinking 字段
    return plainMessages.map(msg => {
      const { isThinking, ...rest } = msg
      return rest
    })
  }
  // 状态
  const sessions = ref([])
  const currentSessionId = ref(null)
  const currentMessages = ref([])
  const isGenerating = ref(false)
  const deletedSessionIds = new Set()
  let lastStreamSaveTime = 0
  let pendingStreamSave = null
  let pendingStreamSaveTimer = null

  function clearPendingStreamSave(sessionId) {
    if (pendingStreamSave?.sessionId !== sessionId) return

    if (pendingStreamSaveTimer) {
      clearTimeout(pendingStreamSaveTimer)
    }
    pendingStreamSave = null
    pendingStreamSaveTimer = null
  }

  function saveMessages(sessionId, messages, lastTime = Date.now()) {
    if (!window.preload || !sessionId || deletedSessionIds.has(sessionId)) return
    clearPendingStreamSave(sessionId)
    window.preload.dbUtil.saveChatHistory(sessionId, toSaveableMessages(messages), lastTime)
  }

  function commitPendingStreamSave() {
    if (!pendingStreamSave) return

    const { sessionId, messages, lastTime } = pendingStreamSave
    pendingStreamSave = null
    pendingStreamSaveTimer = null
    if (deletedSessionIds.has(sessionId)) return

    lastStreamSaveTime = Date.now()
    window.preload?.dbUtil.saveChatHistory(sessionId, messages, lastTime)
  }

  function scheduleStreamSave(sessionId, messages) {
    if (!window.preload || !sessionId || deletedSessionIds.has(sessionId)) return

    pendingStreamSave = {
      sessionId,
      messages: toSaveableMessages(messages),
      lastTime: Date.now()
    }

    const elapsed = Date.now() - lastStreamSaveTime
    if (elapsed >= STREAM_SAVE_INTERVAL) {
      if (pendingStreamSaveTimer) {
        clearTimeout(pendingStreamSaveTimer)
        pendingStreamSaveTimer = null
      }
      commitPendingStreamSave()
      return
    }

    if (!pendingStreamSaveTimer) {
      pendingStreamSaveTimer = setTimeout(commitPendingStreamSave, STREAM_SAVE_INTERVAL - elapsed)
    }
  }

  function flushPendingChatSave() {
    if (pendingStreamSaveTimer) {
      clearTimeout(pendingStreamSaveTimer)
      pendingStreamSaveTimer = null
    }
    commitPendingStreamSave()
  }

  function persistStreamingMessages(sessionId, messages) {
    scheduleStreamSave(sessionId, messages)
  }

  function saveChatMessages(sessionId, messages) {
    saveMessages(sessionId, messages)
  }

  function preservePartialResponseOrShowError(messages, messageIndex, error) {
    const assistantMessage = messages[messageIndex]
    if (assistantMessage?.content || assistantMessage?.reasoningContent) {
      assistantMessage.isThinking = false
      return
    }

    messages.splice(messageIndex, 1, {
      role: 'assistant',
      content: `发生错误: ${error.message}`,
      reasoningContent: '',
      isThinking: false,
      timestamp: Date.now()
    })
  }

  // 计算属性
  const currentSession = computed(() => {
    return sessions.value.find(s => s.id === currentSessionId.value) || null
  })

  const hasSessions = computed(() => {
    return sessions.value.length > 0
  })

  const chatTitle = computed(() => {
    if (currentMessages.value.length > 1) {
      return currentMessages.value[1]?.content?.substring(0, 35) || '新对话'
    } else if (currentMessages.value.length === 1) {
      return currentMessages.value[0]?.content?.substring(0, 35) || '新对话'
    }
    return '新对话'
  })

  // 加载所有聊天会话
  function loadChatSessions() {
    if (!window.preload) return
    
    const allSessions = window.preload.dbUtil.getAllSessions()
    
    // 按时间戳倒序排序，最新的对话排在最上面
    sessions.value = allSessions.sort((a, b) => b.lastTime - a.lastTime)
  }

  // 加载聊天会话
  function loadChatSession(sessionId) {
    if (!window.preload) return

    currentSessionId.value = sessionId
    currentMessages.value = window.preload.dbUtil.getChatHistory(sessionId) || []
  }

  // 创建新会话
  function createNewChat(systemPrompt = '') {
    const sessionId = Date.now().toString()
    deletedSessionIds.delete(sessionId)
    currentSessionId.value = sessionId
    currentMessages.value = []

    // 添加系统提示词
    if (systemPrompt && systemPrompt.trim()) {
      currentMessages.value.push({
        role: 'system',
        content: systemPrompt.trim(),
        timestamp: Date.now()
      })
    }

    // 创建会话对象并添加到列表顶部
    const session = {
      id: sessionId,
      messages: currentMessages.value,
      lastTime: Date.now()
    }

    sessions.value.unshift(session)
    
    return sessionId
  }

  // 删除聊天会话
  function deleteChatSession(sessionId) {
    if (!window.preload) return

    deletedSessionIds.add(sessionId)
    clearPendingStreamSave(sessionId)

    // 从数据库中删除
    window.preload.dbUtil.deleteChatHistory(sessionId)

    // 从列表中移除
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index !== -1) {
      sessions.value.splice(index, 1)
    }

    // 如果删除的是当前会话，清空当前会话
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = null
      currentMessages.value = []
    }
  }

  // 发送消息
  // options: { thinkingBudget } - 可选参数，用于控制思考模型的输出长度
  async function sendMessage(content, modelConfig, onProgress, options = {}) {
    if (!content.trim() || !modelConfig) {
      return
    }

    // 将 modelConfig 转换为纯对象（移除 Vue 响应式代理）
    const plainModelConfig = JSON.parse(JSON.stringify(modelConfig))
    
    // 提取思考深度参数
    const thinkingBudget = options.thinkingBudget

    const sessionId = currentSessionId.value
    const sessionMessages = currentMessages.value

    // 添加用户消息
    const userMessage = {
      role: 'user',
      content: content,
      timestamp: Date.now()
    }
    sessionMessages.push(userMessage)

    // 保存到数据库
    saveMessages(sessionId, sessionMessages)

    // 更新会话列表
    updateSessionInList(sessionId, sessionMessages)

    // 准备发送给AI的消息
    const aiMessages = sessionMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // 添加AI回复占位
    sessionMessages.push({
      role: 'assistant',
      content: '',
      reasoningContent: '', // 思考过程内容
      isThinking: false, // 当前是否在思考阶段
      timestamp: Date.now()
    })
    
    // 获取响应式版本的消息引用（使用数组索引）
    const aiMessageIndex = sessionMessages.length - 1

    try {
      isGenerating.value = true

      // 调用AI API并处理流式输出
      if (window.preload) {
        await window.preload.aiUtil.callAI(plainModelConfig, aiMessages, (progress) => {
          // 支持新格式（带思考内容）和旧格式（纯字符串）
          if (typeof progress === 'object') {
            sessionMessages[aiMessageIndex].content = progress.content
            sessionMessages[aiMessageIndex].reasoningContent = progress.reasoningContent
            sessionMessages[aiMessageIndex].isThinking = progress.isThinking
            if (onProgress) onProgress(progress)
          } else {
            // 兼容旧格式
            sessionMessages[aiMessageIndex].content = progress
            if (onProgress) onProgress({ content: progress, reasoningContent: '', isThinking: false })
          }
          scheduleStreamSave(sessionId, sessionMessages)
        }, { maxTokens: thinkingBudget })
      }

      // 保存到数据库
      flushPendingChatSave()
      saveMessages(sessionId, sessionMessages)

      // 更新会话列表
      updateSessionInList(sessionId, sessionMessages)
      
      return sessionMessages[aiMessageIndex].content
    } catch (error) {
      preservePartialResponseOrShowError(sessionMessages, aiMessageIndex, error)

      // 保存到数据库
      flushPendingChatSave()
      saveMessages(sessionId, sessionMessages)

      throw error
    } finally {
      isGenerating.value = false
    }
  }

  // 重试发送消息
  // options: { thinkingBudget } - 可选参数，用于控制思考模型的输出长度
  async function retryMessage(messageIndex, modelConfig, onProgress, options = {}) {
    // 将 modelConfig 转换为纯对象（移除 Vue 响应式代理）
    const plainModelConfig = JSON.parse(JSON.stringify(modelConfig))
    
    // 提取思考深度参数
    const thinkingBudget = options.thinkingBudget

    const sessionId = currentSessionId.value
    const sessionMessages = currentMessages.value

    // 获取要重试的消息的前一条用户消息
    let userMessageIndex = messageIndex - 1
    while (userMessageIndex >= 0 && sessionMessages[userMessageIndex].role !== 'user') {
      userMessageIndex--
    }

    const userMessage = sessionMessages[userMessageIndex]
    if (!userMessage || userMessage.role !== 'user') {
      throw new Error('找不到对应的用户消息')
    }

    // 移除当前的AI回复
    sessionMessages.splice(messageIndex, 1)

    // 准备发送给AI的消息（到用户消息为止）
    const aiMessages = []
    for (let i = 0; i <= userMessageIndex; i++) {
      aiMessages.push({
        role: sessionMessages[i].role,
        content: sessionMessages[i].content
      })
    }

    // 添加新的AI回复占位
    sessionMessages.push({
      role: 'assistant',
      content: '',
      reasoningContent: '', // 思考过程内容
      isThinking: false, // 当前是否在思考阶段
      timestamp: Date.now()
    })
    
    // 获取响应式版本的消息引用（使用数组索引）
    const aiMessageIndex = sessionMessages.length - 1

    try {
      isGenerating.value = true

      // 调用AI API并处理流式输出
      if (window.preload) {
        await window.preload.aiUtil.callAI(plainModelConfig, aiMessages, (progress) => {
          // 支持新格式（带思考内容）和旧格式（纯字符串）
          if (typeof progress === 'object') {
            sessionMessages[aiMessageIndex].content = progress.content
            sessionMessages[aiMessageIndex].reasoningContent = progress.reasoningContent
            sessionMessages[aiMessageIndex].isThinking = progress.isThinking
            if (onProgress) onProgress(progress)
          } else {
            // 兼容旧格式
            sessionMessages[aiMessageIndex].content = progress
            if (onProgress) onProgress({ content: progress, reasoningContent: '', isThinking: false })
          }
          scheduleStreamSave(sessionId, sessionMessages)
        }, { maxTokens: thinkingBudget })
      }

      // 保存到数据库
      flushPendingChatSave()
      saveMessages(sessionId, sessionMessages)

      // 更新会话列表
      updateSessionInList(sessionId, sessionMessages)
      
      return sessionMessages[aiMessageIndex].content
    } catch (error) {
      preservePartialResponseOrShowError(sessionMessages, aiMessageIndex, error)

      flushPendingChatSave()
      saveMessages(sessionId, sessionMessages)

      throw error
    } finally {
      isGenerating.value = false
    }
  }

  // 删除消息
  function deleteMessage(messageIndex) {
    if (messageIndex < 0 || messageIndex >= currentMessages.value.length) {
      throw new Error('无效的消息索引')
    }

    currentMessages.value.splice(messageIndex, 1)

    // 保存到数据库
    saveMessages(currentSessionId.value, currentMessages.value)

    // 更新会话列表
    updateSessionInList()
  }

  // 编辑消息
  function editMessage(messageIndex, newContent) {
    if (messageIndex < 0 || messageIndex >= currentMessages.value.length) {
      throw new Error('无效的消息索引')
    }

    currentMessages.value[messageIndex].content = newContent

    // 保存到数据库
    saveMessages(currentSessionId.value, currentMessages.value)

    // 更新会话列表
    updateSessionInList()
  }

  // 更新系统提示词
  function updateSystemPrompt(systemPrompt) {
    if (!currentSessionId.value) return

    // 查找是否已有系统消息
    const systemIndex = currentMessages.value.findIndex(msg => msg.role === 'system')

    if (systemPrompt && systemPrompt.trim()) {
      const systemMessage = {
        role: 'system',
        content: systemPrompt.trim(),
        timestamp: Date.now()
      }

      if (systemIndex >= 0) {
        // 更新现有系统消息
        currentMessages.value[systemIndex] = systemMessage
      } else {
        // 在消息列表开头添加系统消息
        currentMessages.value.unshift(systemMessage)
      }
    } else if (systemIndex >= 0) {
      // 如果没有系统提示词但存在系统消息，则移除它
      currentMessages.value.splice(systemIndex, 1)
    }
  }

  // 中断当前响应
  function abortCurrentResponse() {
    if (window.preload) {
      window.preload.aiUtil.abortCurrentResponse()
    }
    flushPendingChatSave()
    isGenerating.value = false
  }

  // 更新会话列表中的当前会话
  function updateSessionInList(sessionId = currentSessionId.value, messages = currentMessages.value) {
    if (!sessionId || deletedSessionIds.has(sessionId)) return

    const updatedSession = {
      id: sessionId,
      messages: [...messages],
      lastTime: Date.now()
    }
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index !== -1) {
      sessions.value[index] = updatedSession
      // 重新排序，将当前会话移到顶部
      const session = sessions.value.splice(index, 1)[0]
      sessions.value.unshift(session)
    } else if (messages.length > 0) {
      sessions.value.unshift(updatedSession)
    }
  }

  return {
    // 状态
    sessions,
    currentSessionId,
    currentMessages,
    isGenerating,
    // 计算属性
    currentSession,
    hasSessions,
    chatTitle,
    // 方法
    loadChatSessions,
    loadChatSession,
    createNewChat,
    deleteChatSession,
    sendMessage,
    retryMessage,
    deleteMessage,
    editMessage,
    updateSystemPrompt,
    abortCurrentResponse,
    flushPendingChatSave,
    persistStreamingMessages,
    saveChatMessages,
    updateSessionInList
  }
})
