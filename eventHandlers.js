// 设置事件监听
function setupEventListeners() {
  // 发送消息
  sendButton.addEventListener('click', sendMessage);

  // 按Enter发送消息
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // 输入框内容变化
  messageInput.addEventListener('input', () => {
    sendButton.disabled = messageInput.value.trim() === '';
  });

  // 新建聊天
  newChatBtn.addEventListener('click', createNewChat);
  startChatBtn.addEventListener('click', createNewChat);

  // 设置按钮
  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
  });

  // 关闭设置
  closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    // 重新聚焦到输入框
    messageInput.focus();
  });

  // 点击模态框外部关闭
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove('active');
      // 重新聚焦到输入框
      messageInput.focus();
    }
  });

  // 添加模型按钮事件监听
  addModelBtn.addEventListener('click', () => {
    if (addModelBtn.textContent === '更新模型') {
      // 获取编辑索引
      const editIndex = parseInt(addModelBtn.dataset.editIndex);
      if (!isNaN(editIndex)) {
        updateModel(editIndex);
      }
    } else {
      addModel();
    }
  });

  // 监听模型选择下拉框变化
  modelSelect.addEventListener('change', () => {
    const selectedIndex = parseInt(modelSelect.value);
    if (!isNaN(selectedIndex)) {
      modelManager.setCurrentModel(selectedIndex);
      syncModelState();
    }
  });

  // 监听全局快捷键
  document.addEventListener('keydown', (e) => {
    // Ctrl+Alt+T 打开模型选择器
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      showModelSelectModal();
    }
    
    // Ctrl+N 新建对话
    if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      createNewChat();
    }
    
    // Ctrl+Shift+M 切换到下一个模型
    if (e.ctrlKey && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      switchToNextModel();
    }
  });

  // 点击弹窗外部关闭
  modelSelectModal.addEventListener('click', (e) => {
    if (e.target === modelSelectModal) {
      hideModelSelectModal();
      // 重新聚焦到输入框
      messageInput.focus();
    }
  });

  // 搜索框输入事件
  modelSelectInput.addEventListener('input', (e) => {
    searchModels(e.target.value);
  });

  // 搜索框键盘事件
  modelSelectInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const firstItem = modelSelectList.querySelector('.model-select-item');
      if (firstItem) {
        firstItem.classList.add('active');
        firstItem.scrollIntoView({ block: 'nearest' });
      }
    }
  });
  
  // 监听AI特性触发事件（用于翻译和解释功能）
  document.addEventListener('ai-feature-triggered', async (e) => {
    const { sessionId, modelConfig, systemPrompt, userMessage } = e.detail;
    
    // 加载这个新会话
    await loadChatSession(sessionId);
    
    // 获取消息数组
    const aiMessages = [];
    
    // 添加系统提示词
    aiMessages.push({
      role: 'system',
      content: systemPrompt
    });
    
    // 添加用户消息
    aiMessages.push({
      role: 'user',
      content: userMessage
    });
    
    try {
      // 添加AI回复占位
      const aiMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };
      
      currentMessages.push(aiMessage);
      renderMessages();
      
      // 更新发送按钮状态为停止状态
      updateSendButtonState(true);
      
      // 调用AI API并处理流式输出
      await window.preload.aiUtil.callAI(modelConfig, aiMessages, (content) => {
        aiMessage.content = content;
        renderMessages();
      });
      
      // 恢复发送按钮状态
      updateSendButtonState(false);
      
      // 保存到数据库
      window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages, Date.now());
      
      // 更新聊天列表
      loadChatSessions();
    } catch (error) {
      console.error('AI特性调用失败:', error);
      
      // 恢复按钮状态
      updateSendButtonState(false);
      
      // 添加错误消息
      const errorMessage = {
        role: 'assistant',
        content: `发生错误: ${error.message}`,
        timestamp: Date.now()
      };
      
      currentMessages.push(errorMessage);
      
      // 更新UI
      renderMessages();
      
      // 保存到数据库
      window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages, Date.now());
      
      // 显示错误通知
      showNotification(error.message, 'error');
    }
  });
}

// 切换到下一个模型
function switchToNextModel() {
  const models = modelManager.getAllModels();
  if (models.length === 0) {
    showNotification('请先添加模型配置', 'warning');
    return;
  }
  
  const currentIndex = modelManager.currentModelIndex;
  const nextIndex = (currentIndex + 1) % models.length;
  
  try {
    modelManager.setCurrentModel(nextIndex);
    
    // 更新下拉框的值和显示文本
    modelSelect.value = nextIndex;
    modelSelect.selectedIndex = nextIndex;
    
    // 同步模型状态
    syncModelState();
    
    // 显示通知
    showNotification(`已切换到模型: ${modelManager.getCurrentModel().name}`, 'success');
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

// 处理模型选择键盘事件
function handleModelSelectKeydown(e) {
  const items = modelSelectList.querySelectorAll('.model-select-item');
  const activeItem = modelSelectList.querySelector('.model-select-item.active');
  let activeIndex = Array.from(items).indexOf(activeItem);

  // 如果正在输入搜索内容，不处理其他按键
  if (e.target === modelSelectInput) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeItem) {
        const index = Array.from(items).indexOf(activeItem);
        selectModel(index);
      }
    }
    return;
  }

  switch (e.key) {
    case 'Escape':
      hideModelSelectModal();
      break;

    case 'ArrowUp':
      e.preventDefault();
      if (activeIndex > 0) {
        activeItem.classList.remove('active');
        items[activeIndex - 1].classList.add('active');
        items[activeIndex - 1].scrollIntoView({ block: 'nearest' });
      }
      break;

    case 'ArrowDown':
      e.preventDefault();
      if (activeIndex < items.length - 1) {
        activeItem.classList.remove('active');
        items[activeIndex + 1].classList.add('active');
        items[activeIndex + 1].scrollIntoView({ block: 'nearest' });
      }
      break;

    case 'Enter':
      e.preventDefault();
      if (activeItem) {
        const index = Array.from(items).indexOf(activeItem);
        selectModel(index);
      }
      break;

    default:
      // 数字键选择（可选）
      const number = parseInt(e.key);
      if (!isNaN(number) && number >= 1 && number <= modelManager.getAllModels().length) {
        selectModel(number - 1);
      }
  }
}

// 设置帮助和快捷键相关事件
function setupHelpListeners() {
  const helpBtn = document.getElementById('help-btn');
  const shortcutsMenuItem = document.getElementById('shortcuts-menu-item');
  const shortcutsModal = document.getElementById('shortcuts-modal');
  const closeShortcuts = document.getElementById('close-shortcuts');
  
  if (helpBtn) {
    // 帮助按钮点击
    helpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = helpBtn.closest('.dropdown');
      dropdown.classList.toggle('active');
    });
  
    // 点击快捷键菜单项
    if (shortcutsMenuItem) {
      shortcutsMenuItem.addEventListener('click', () => {
        // 隐藏下拉菜单
        const dropdown = helpBtn.closest('.dropdown');
        dropdown.classList.remove('active');
        
        // 显示快捷键模态框
        if (shortcutsModal) {
          shortcutsModal.classList.add('active');
        }
      });
    }
  
    // 关闭快捷键模态框
    if (closeShortcuts && shortcutsModal) {
      closeShortcuts.addEventListener('click', () => {
        shortcutsModal.classList.remove('active');
        // 重新聚焦到输入框
        messageInput.focus();
      });
    }
  
    // 点击快捷键模态框外部关闭
    if (shortcutsModal) {
      shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) {
          shortcutsModal.classList.remove('active');
          // 重新聚焦到输入框
          messageInput.focus();
        }
      });
    }
  
    // 点击页面其他区域关闭下拉菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown').forEach(dropdown => {
          dropdown.classList.remove('active');
        });
      }
    });
  }
}