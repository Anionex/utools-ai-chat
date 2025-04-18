// 模型管理器类
class ModelManager {
    constructor() {
        this.modelConfigs = [];
        this.currentModelIndex = 0;
        this.loadModelConfigs();
    }

    // 加载模型配置
    loadModelConfigs() {
        this.modelConfigs = window.preload.dbUtil.getModelConfig() || [];
        this.currentModelIndex = window.preload.dbUtil.getModelIndex() || 0;
        
        // 确保每个模型配置都有必要的字段
        this.modelConfigs = this.modelConfigs.map(config => ({
            name: config.name || '未命名模型',
            model: config.model || 'gpt-3.5-turbo',
            url: config.url || 'https://api.openai.com/v1/chat/completions',
            key: config.key || '',
            systemPrompt: config.systemPrompt || ''
        }));
    }

    // 验证模型配置
    validateModelConfig(config) {
        const errors = [];
        
        if (!config.name || config.name.trim() === '') {
            errors.push('模型名称不能为空');
        }
        
        if (!config.model || config.model.trim() === '') {
            errors.push('模型ID不能为空');
        }
        
        if (!config.url || config.url.trim() === '') {
            errors.push('API地址不能为空');
        } else if (!this.isValidUrl(config.url)) {
            errors.push('API地址格式不正确');
        }
        
        if (!config.key || config.key.trim() === '') {
            errors.push('API密钥不能为空');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // 验证URL格式
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // 添加模型
    addModel(config) {
        const validation = this.validateModelConfig(config);
        if (!validation.isValid) {
            throw new Error(validation.errors.join('\n'));
        }

        this.modelConfigs.push(config);
        this.saveModelConfigs();
    }

    // 更新模型
    updateModel(index, config) {
        if (index < 0 || index >= this.modelConfigs.length) {
            throw new Error('模型索引无效');
        }

        const validation = this.validateModelConfig(config);
        if (!validation.isValid) {
            throw new Error(validation.errors.join('\n'));
        }

        this.modelConfigs[index] = config;
        this.saveModelConfigs();
    }

    // 删除模型
    deleteModel(index) {
        if (index < 0 || index >= this.modelConfigs.length) {
            throw new Error('模型索引无效');
        }

        this.modelConfigs.splice(index, 1);
        this.saveModelConfigs();
    }

    // 保存模型配置
    saveModelConfigs() {
        window.preload.dbUtil.saveModelConfig(this.modelConfigs);
    }

    // 获取当前选中的模型
    getCurrentModel() {
        return this.modelConfigs[this.currentModelIndex];
    }

    // 设置当前选中的模型
    setCurrentModel(index) {
        if (index < 0 || index >= this.modelConfigs.length) {
            throw new Error('模型索引无效');
        }
        this.currentModelIndex = index;
        window.preload.dbUtil.saveModelIndex(index);
    }

    // 获取所有模型
    getAllModels() {
        return [...this.modelConfigs];
    }
}

// 获取DOM元素
const chatList = document.getElementById('chat-list');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const newChatBtn = document.getElementById('new-chat-btn');
const startChatBtn = document.getElementById('start-chat-btn');
const settingsBtn = document.getElementById('settings-btn');
const modelSelect = document.getElementById('model-select');
const chatTitle = document.getElementById('chat-title');
const emptyState = document.getElementById('empty-state');
const chatContainer = document.getElementById('chat-container');

// 通知相关元素
const notification = document.getElementById('notification');
const notificationContent = notification.querySelector('.notification-content');
const notificationClose = notification.querySelector('.notification-close');

// 设置相关元素
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const modelName = document.getElementById('model-name');
const modelId = document.getElementById('model-id');
const apiUrl = document.getElementById('api-url');
const apiKey = document.getElementById('api-key');
const systemPrompt = document.getElementById('system-prompt');
const addModelBtn = document.getElementById('add-model-btn');
const modelListContainer = document.getElementById('model-list-container');

// 模型选择相关元素
const modelSelectModal = document.getElementById('model-select-modal');
const modelSelectList = document.getElementById('model-select-list');
const modelSelectInput = document.getElementById('model-select-input');

// 确认对话框相关元素
const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const confirmOk = document.getElementById('confirm-ok');
const confirmCancel = document.getElementById('confirm-cancel');
const closeConfirm = document.getElementById('close-confirm');

// 当前会话ID
let currentSessionId = null;
// 当前会话消息
let currentMessages = [];
// 模型管理器实例
const modelManager = new ModelManager();

// 更新模型选择按钮文本
function updateModelButtonText() {
    const selectedModel = modelManager.getCurrentModel();
    if (selectedModel) {
        modelSelect.value = modelManager.currentModelIndex;
        modelSelect.selectedIndex = modelManager.currentModelIndex;
    }
}

// 初始化
function init() {
    // 加载聊天记录
    loadChatSessions();
    // 设置事件监听
    setupEventListeners();
    // 配置Markdown渲染器
    configureMarkdown();
    // 更新模型选择
    updateModelSelect();
    updateModelList();
    
    // 每次启动时创建新对话
    createNewChat();
    
    // 聚焦到输入框
    messageInput.focus();
}

// 配置Markdown渲染器
function configureMarkdown() {
  marked.setOptions({
    highlight: function(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-',
    gfm: true,
    breaks: true
  });
}

// 更新模型选择下拉框
function updateModelSelect() {
    modelSelect.innerHTML = '';
    
    const models = modelManager.getAllModels();
    if (models.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '请先添加模型';
        modelSelect.appendChild(option);
        modelSelect.disabled = true;
    } else {
        modelSelect.disabled = false;
        models.forEach((config, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = config.name;
            modelSelect.appendChild(option);
        });
    }
}

// 更新模型列表
function updateModelList() {
    modelListContainer.innerHTML = '';
    
    const models = modelManager.getAllModels();
    if (models.length === 0) {
        modelListContainer.innerHTML = '<p>暂无模型，请添加</p>';
        return;
    }
    
    models.forEach((config, index) => {
        const modelItem = document.createElement('div');
        modelItem.className = 'model-item';
        
        const modelInfo = document.createElement('div');
        modelInfo.className = 'model-item-info';
        
        const modelItemName = document.createElement('div');
        modelItemName.className = 'model-item-name';
        modelItemName.textContent = config.name;
        
        const modelItemUrl = document.createElement('div');
        modelItemUrl.className = 'model-item-url';
        modelItemUrl.textContent = `${config.url} (${config.model})`;
        
        const modelItemPrompt = document.createElement('div');
        modelItemPrompt.className = 'model-item-url';
        modelItemPrompt.textContent = `系统提示词: ${config.systemPrompt || '无'}`;
        
        modelInfo.appendChild(modelItemName);
        modelInfo.appendChild(modelItemUrl);
        modelInfo.appendChild(modelItemPrompt);
        
        const modelActions = document.createElement('div');
        modelActions.className = 'model-item-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'button';
        editBtn.textContent = '编辑';
        editBtn.onclick = () => editModel(index);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'button button-secondary';
        deleteBtn.textContent = '删除';
        deleteBtn.onclick = () => deleteModel(index);
        
        modelActions.appendChild(editBtn);
        modelActions.appendChild(deleteBtn);
        
        modelItem.appendChild(modelInfo);
        modelItem.appendChild(modelActions);
        
        modelListContainer.appendChild(modelItem);
    });
}

// 编辑模型
function editModel(index) {
    const config = modelManager.getAllModels()[index];
    if (!config) {
        showNotification('模型配置不存在', 'error');
        return;
    }
    
    // 保存当前编辑的模型索引
    addModelBtn.dataset.editIndex = index;
    
    // 填充表单
    modelName.value = config.name || '';
    modelId.value = config.model || '';
    apiUrl.value = config.url || '';
    apiKey.value = config.key || '';
    systemPrompt.value = config.systemPrompt || '';
    
    // 修改添加按钮的文本
    addModelBtn.textContent = '更新模型';
}

// 更新模型
function updateModel(index) {
    const config = {
        name: modelName.value.trim(),
        model: modelId.value.trim(),
        url: apiUrl.value.trim(),
        key: apiKey.value.trim(),
        systemPrompt: systemPrompt.value.trim()
    };
    
    try {
        modelManager.updateModel(index, config);
        
        // 更新UI
        updateModelSelect();
        updateModelList();
        
        // 重置表单和按钮
        resetModelForm();
        
        // 显示成功通知
        showNotification('模型已更新', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// 重置模型表单
function resetModelForm() {
    // 清除编辑索引
    delete addModelBtn.dataset.editIndex;
    
    modelName.value = '';
    modelId.value = '';
    apiUrl.value = '';
    apiKey.value = '';
    systemPrompt.value = '';
    addModelBtn.textContent = '添加模型';
}

// 加载聊天记录
function loadChatSessions() {
  const sessions = window.preload.dbUtil.getAllSessions();
  
  chatList.innerHTML = '';
  
  if (sessions.length === 0) {
    return;
  }
  
  sessions.forEach(session => {
    addChatItemToList(session);
  });
}

// 添加聊天项到列表
function addChatItemToList(session) {
  const chatItem = document.createElement('li');
  chatItem.className = 'chat-item';
  chatItem.dataset.id = session.id;
  
  if (currentSessionId === session.id) {
    chatItem.classList.add('active');
  }
  
  const lastMessage = session.messages[session.messages.length - 1];
  const title = session.messages[0]?.content.substring(0, 20) || '新对话';
  const preview = lastMessage ? `${lastMessage.role === 'user' ? '你: ' : 'AI: '}${lastMessage.content.substring(0, 30)}` : '';
  
  chatItem.innerHTML = `
    <div class="chat-item-content">
      <div class="chat-item-title">${title}</div>
      <div class="chat-item-preview">${preview}</div>
    </div>
    <div class="chat-item-delete" title="删除对话">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    </div>
  `;
  
  chatItem.addEventListener('click', (e) => {
    // 如果点击的是删除按钮，不触发加载对话
    if (e.target.closest('.chat-item-delete')) {
      e.stopPropagation();
      deleteChatSession(session.id);
      return;
    }
    loadChatSession(session.id);
  });
  
  chatList.appendChild(chatItem);
}

// 加载聊天会话
function loadChatSession(sessionId) {
  currentSessionId = sessionId;
  currentMessages = window.preload.dbUtil.getChatHistory(sessionId) || [];
  
  // 更新UI
  updateChatUI();
  
  // 更新活动状态
  document.querySelectorAll('.chat-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.id === sessionId) {
      item.classList.add('active');
    }
  });
  
  // 聚焦到输入框
  messageInput.focus();
}

// 创建新会话
function createNewChat() {
  currentSessionId = Date.now().toString();
  currentMessages = [];
  
  // 更新UI
  updateChatUI();
  
  // 添加到列表
  const session = {
    id: currentSessionId,
    messages: currentMessages,
    lastTime: Date.now()
  };
  
  addChatItemToList(session);
  
  // 保存到数据库
  window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages);
  
  // 聚焦到输入框
  messageInput.focus();
}

// 更新聊天UI
function updateChatUI() {
  if (currentSessionId === null) {
    emptyState.style.display = 'flex';
    chatContainer.style.display = 'none';
    return;
  }
  
  emptyState.style.display = 'none';
  chatContainer.style.display = 'flex';
  
  // 更新标题
  if (currentMessages.length > 0) {
    chatTitle.textContent = currentMessages[0].content.substring(0, 20);
  } else {
    chatTitle.textContent = '新对话';
  }
  
  // 更新消息列表
  renderMessages();
}

// 渲染消息
function renderMessages() {
  chatMessages.innerHTML = '';
  
  currentMessages.forEach(msg => {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${msg.role === 'user' ? 'user' : 'ai'}`;
    
    const messageContent = document.createElement('div');
    
    // 使用Markdown渲染AI消息
    if (msg.role === 'assistant') {
      messageContent.className = 'markdown-content';
      messageContent.innerHTML = marked.parse(msg.content);
      // 高亮代码块
      messageEl.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    } else {
      messageContent.textContent = msg.content;
    }
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = formatTime(msg.timestamp);
    
    messageEl.appendChild(messageContent);
    messageEl.appendChild(messageTime);
    
    chatMessages.appendChild(messageEl);
  });
  
  // 滚动到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 格式化时间
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 发送消息
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    // 如果没有当前会话，创建一个新会话
    if (currentSessionId === null) {
        createNewChat();
    }
    
    // 添加用户消息
    const userMessage = {
        role: 'user',
        content: message,
        timestamp: Date.now()
    };
    
    currentMessages.push(userMessage);
    
    // 更新UI
    messageInput.value = '';
    renderMessages();
    
    // 保存到数据库
    window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages);
    
    // 更新聊天列表
    loadChatSessions();
    
    // 获取选中的模型
    const selectedModel = modelManager.getCurrentModel();
    if (!selectedModel) {
        showNotification('请先添加模型配置', 'warning');
        return;
    }
    
    // 准备发送给AI的消息
    const aiMessages = [];
    
    // 添加系统提示词
    if (selectedModel.systemPrompt) {
        aiMessages.push({
            role: 'system',
            content: selectedModel.systemPrompt
        });
    }
    
    // 添加对话历史
    currentMessages.forEach(msg => {
        if (msg.role !== 'system') {
            aiMessages.push({
                role: msg.role,
                content: msg.content
            });
        }
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
        
        // 调用AI API并处理流式输出
        await window.preload.aiUtil.callAI(selectedModel, aiMessages, (content) => {
            aiMessage.content = content;
            renderMessages();
        });
        
        // 保存到数据库
        window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages);
        
        // 更新聊天列表
        loadChatSessions();
    } catch (error) {
        console.error('发送消息失败:', error);
        
        // 移除加载中消息
        currentMessages.pop();
        
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
        window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages);
    }
}

// 添加模型
function addModel() {
    const config = {
        name: modelName.value.trim(),
        model: modelId.value.trim(),
        url: apiUrl.value.trim(),
        key: apiKey.value.trim(),
        systemPrompt: systemPrompt.value.trim()
    };
    
    try {
        modelManager.addModel(config);
        
        // 更新UI
        updateModelSelect();
        updateModelList();
        
        // 清空表单
        resetModelForm();
        
        // 显示成功通知
        showNotification('模型已添加', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// 删除模型
function deleteModel(index) {
    showConfirm('确定要删除这个模型吗？', (confirmed) => {
        if (confirmed) {
            try {
                modelManager.deleteModel(index);
                
                // 更新UI
                updateModelSelect();
                updateModelList();
                
                // 显示成功通知
                showNotification('模型已删除', 'success');
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    });
}

// 删除聊天会话
function deleteChatSession(sessionId) {
  // 从数据库中删除
  window.preload.dbUtil.deleteChatHistory(sessionId);
  
  // 如果删除的是当前会话，清空当前会话
  if (currentSessionId === sessionId) {
    currentSessionId = null;
    currentMessages = [];
    updateChatUI();
  }
  
  // 重新加载聊天列表
  loadChatSessions();
  
  // 显示删除成功通知
  showNotification('对话已删除', 'success');
}

// 显示通知
function showNotification(message, type = 'info', duration = 3000) {
  // 设置通知内容和类型
  notificationContent.textContent = message;
  notification.className = `notification ${type}`;
  
  // 显示通知
  notification.classList.add('show');
  
  // 设置自动关闭
  setTimeout(() => {
    hideNotification();
  }, duration);
}

// 隐藏通知
function hideNotification() {
  notification.classList.remove('show');
}

// 设置通知关闭按钮事件
notificationClose.addEventListener('click', hideNotification);

// 显示模型选择弹窗
function showModelSelectModal() {
  if (modelManager.getAllModels().length === 0) {
    showNotification('请先添加模型配置', 'warning');
    return;
  }
  
  // 生成模型列表
  modelSelectList.innerHTML = '';
  let activeIndex = parseInt(modelSelect.value) || 0;
  
  // 显示所有模型
  updateModelListItems(modelManager.getAllModels(), activeIndex);
  
  // 显示弹窗
  modelSelectModal.classList.add('show');
  
  // 聚焦到搜索框
  modelSelectInput.focus();
  
  // 监听键盘事件
  document.addEventListener('keydown', handleModelSelectKeydown);
}

// 更新模型列表项
function updateModelListItems(models, activeIndex = 0) {
  modelSelectList.innerHTML = '';
  
  models.forEach((model, index) => {
    const item = document.createElement('li');
    item.className = 'model-select-item';
    if (index === activeIndex) {
      item.classList.add('active');
    }
    
    item.innerHTML = `
      <div class="model-select-name">${model.name}</div>
      <div class="model-select-shortcut">${index + 1}</div>
    `;
    
    item.addEventListener('click', () => {
      selectModel(index);
    });
    
    modelSelectList.appendChild(item);
  });
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

// 搜索模型
function searchModels(query) {
  const filteredModels = modelManager.getAllModels().filter(model => 
    model.name.toLowerCase().includes(query.toLowerCase())
  );
  
  updateModelListItems(filteredModels);
  
  // 如果有匹配项，选中第一个
  if (filteredModels.length > 0) {
    const firstItem = modelSelectList.querySelector('.model-select-item');
    if (firstItem) {
      firstItem.classList.add('active');
    }
  }
}

// 选择模型
function selectModel(index) {
  try {
    // 获取当前显示的模型列表
    const displayedItems = modelSelectList.querySelectorAll('.model-select-item');
    const activeItem = modelSelectList.querySelector('.model-select-item.active');
    const activeIndex = Array.from(displayedItems).indexOf(activeItem);
    
    // 获取原始模型列表
    const allModels = modelManager.getAllModels();
    
    // 如果正在搜索，需要找到对应的原始索引
    let originalIndex = index;
    if (modelSelectInput.value.trim() !== '') {
      const searchQuery = modelSelectInput.value.toLowerCase();
      const matchingModels = allModels.filter(model => 
        model.name.toLowerCase().includes(searchQuery)
      );
      if (matchingModels.length > 0) {
        // 使用当前选中的模型名称来找到原始索引
        const selectedModelName = matchingModels[activeIndex].name;
        originalIndex = allModels.findIndex(model => model.name === selectedModelName);
      }
    }
    
    modelManager.setCurrentModel(originalIndex);
    
    // 更新下拉框的值和显示文本
    modelSelect.value = originalIndex;
    modelSelect.selectedIndex = originalIndex;
    
    // 隐藏弹窗
    hideModelSelectModal();
    
    // 显示通知
    showNotification(`已切换到模型: ${modelManager.getCurrentModel().name}`, 'success');
    
    // 清空搜索框
    modelSelectInput.value = '';
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

// 隐藏模型选择弹窗
function hideModelSelectModal() {
  modelSelectModal.classList.remove('show');
  document.removeEventListener('keydown', handleModelSelectKeydown);
  // 聚焦回输入框
  messageInput.focus();
}

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
  
  // 监听快捷键
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      showModelSelectModal();
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
}

// 显示确认对话框
function showConfirm(message, callback) {
  confirmMessage.textContent = message;
  confirmModal.classList.add('active');
  
  // 设置确认按钮的回调
  const handleConfirm = () => {
    confirmModal.classList.remove('active');
    callback(true);
    // 移除事件监听
    confirmOk.removeEventListener('click', handleConfirm);
    confirmCancel.removeEventListener('click', handleCancel);
    closeConfirm.removeEventListener('click', handleCancel);
  };
  
  // 设置取消按钮的回调
  const handleCancel = () => {
    confirmModal.classList.remove('active');
    callback(false);
    // 移除事件监听
    confirmOk.removeEventListener('click', handleConfirm);
    confirmCancel.removeEventListener('click', handleCancel);
    closeConfirm.removeEventListener('click', handleCancel);
  };
  
  // 添加事件监听
  confirmOk.addEventListener('click', handleConfirm);
  confirmCancel.addEventListener('click', handleCancel);
  closeConfirm.addEventListener('click', handleCancel);
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  // 获取保存的模型配置
  const savedModelConfigs = window.preload.dbUtil.getModelConfig()
  if (savedModelConfigs && savedModelConfigs.length > 0) {
    modelManager.modelConfigs = savedModelConfigs
  }
  
  // 获取保存的模型索引
  const savedModelIndex = window.preload.dbUtil.getModelIndex()
  if (savedModelIndex !== undefined) {
    currentSessionId = savedModelIndex
    updateModelButtonText()
  }
  
  // 初始化其他UI元素
  init()
});