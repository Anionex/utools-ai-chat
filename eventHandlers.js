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