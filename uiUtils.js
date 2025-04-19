// 更新模型选择按钮文本
function updateModelButtonText() {
    const selectedModel = modelManager.getCurrentModel();
    if (selectedModel) {
        modelSelect.value = modelManager.currentModelIndex;
        modelSelect.selectedIndex = modelManager.currentModelIndex;
    }
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
