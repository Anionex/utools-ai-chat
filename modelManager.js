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

