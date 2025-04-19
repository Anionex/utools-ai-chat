// 命令管理器类
class CommandManager {
    constructor() {
        this.commands = [];
        this.loadCommands();
    }

    // 加载指令
    loadCommands() {
        // 从preload中获取所有指令
        this.commands = window.preload.commandManager.getAllCommands() || [];
        this.renderCommandList();
    }

    // 添加指令
    addCommand(command) {
        // 检查指令代码是否唯一
        if (!command.code) {
            throw new Error('指令代码不能为空');
        }

        // 生成唯一ID（如果没有）
        if (!command.id) {
            command.id = 'cmd_' + Date.now();
        }

        // 添加指令到系统
        window.preload.commandManager.addCustomCommand(command);
        
        // 重新加载命令列表
        this.loadCommands();
        
        return command;
    }

    // 更新指令
    updateCommand(id, command) {
        // 确保有ID
        command.id = id;
        
        // 更新指令
        window.preload.commandManager.addCustomCommand(command);
        
        // 重新加载命令列表
        this.loadCommands();
        
        return command;
    }

    // 删除指令
    deleteCommand(code) {
        window.preload.commandManager.removeCustomCommand(code);
        this.loadCommands();
    }

    // 获取内置指令
    getBuiltinCommands() {
        return this.commands.filter(cmd => cmd.id === 'ai-translate' || cmd.id === 'ai-explain');
    }

    // 获取自定义指令
    getCustomCommands() {
        return this.commands.filter(cmd => cmd.id !== 'ai-translate' && cmd.id !== 'ai-explain');
    }

    // 获取特定指令
    getCommand(id) {
        return this.commands.find(cmd => cmd.id === id);
    }

    // 渲染指令列表
    renderCommandList() {
        const container = document.getElementById('command-list-container');
        if (!container) return;

        // 清空容器
        container.innerHTML = '';

        // 获取自定义指令
        const customCommands = this.getCustomCommands();

        if (customCommands.length === 0) {
            container.innerHTML = '<div class="empty-message">还没有自定义指令，添加一个吧！</div>';
            return;
        }

        // 添加每个指令到列表
        customCommands.forEach(command => {
            const commandItem = document.createElement('div');
            commandItem.className = 'command-item';
            commandItem.dataset.id = command.id;
            commandItem.dataset.code = command.code;

            commandItem.innerHTML = `
                <div class="command-item-info">
                    <div class="command-item-name">${command.name}</div>
                    <div class="command-item-description">${command.description || ''}</div>
                    <div class="command-item-code">代码: ${command.code}</div>
                </div>
                <div class="command-item-actions">
                    <button class="command-item-edit" title="编辑指令">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="command-item-delete" title="删除指令">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            `;

            // 添加编辑按钮事件
            const editButton = commandItem.querySelector('.command-item-edit');
            editButton.addEventListener('click', () => {
                editCommand(command.id);
            });

            // 添加删除按钮事件
            const deleteButton = commandItem.querySelector('.command-item-delete');
            deleteButton.addEventListener('click', () => {
                deleteCommand(command.code, command.name);
            });

            container.appendChild(commandItem);
        });
    }
}

// 添加指令
function addCommand() {
    const name = document.getElementById('command-name').value.trim();
    const code = document.getElementById('command-code').value.trim();
    const description = document.getElementById('command-description').value.trim();
    const systemPrompt = document.getElementById('command-prompt').value.trim();

    // 验证输入
    if (!name) {
        showNotification('指令名称不能为空', 'error');
        return;
    }

    if (!code) {
        showNotification('指令代码不能为空', 'error');
        return;
    }

    if (!systemPrompt) {
        showNotification('系统提示词不能为空', 'error');
        return;
    }

    // 创建指令对象
    const command = {
        id: 'cmd_' + Date.now(),
        code: code,
        name: name,
        description: description || name,
        systemPrompt: systemPrompt
    };

    try {
        // 添加命令
        commandManager.addCommand(command);

        // 清空表单
        resetCommandForm();

        // 显示成功通知
        showNotification('指令已添加', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// 编辑指令
function editCommand(id) {
    const command = commandManager.getCommand(id);
    if (!command) {
        showNotification('找不到指令', 'error');
        return;
    }

    // 填充表单
    document.getElementById('command-name').value = command.name || '';
    document.getElementById('command-code').value = command.code || '';
    document.getElementById('command-description').value = command.description || '';
    document.getElementById('command-prompt').value = command.systemPrompt || '';

    // 切换按钮文本
    const addButton = document.getElementById('add-command-btn');
    addButton.textContent = '更新指令';
    addButton.dataset.editId = id;
    
    // 切换到指令标签页
    document.querySelector('.tab[data-tab="commands"]').click();
}

// 删除指令
function deleteCommand(code, name) {
    showConfirm(`确定要删除指令 "${name}" 吗？`, (confirmed) => {
        if (confirmed) {
            try {
                commandManager.deleteCommand(code);
                showNotification('指令已删除', 'success');
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    });
}

// 重置指令表单
function resetCommandForm() {
    document.getElementById('command-name').value = '';
    document.getElementById('command-code').value = '';
    document.getElementById('command-description').value = '';
    document.getElementById('command-prompt').value = '';

    // 恢复按钮文本
    const addButton = document.getElementById('add-command-btn');
    addButton.textContent = '添加指令';
    delete addButton.dataset.editId;
}

// 初始化命令管理器
const commandManager = new CommandManager(); 