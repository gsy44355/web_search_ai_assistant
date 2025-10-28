/**
 * 主界面逻辑
 */

class ChatApp {
  constructor() {
    this.storage = new StorageManager();
    this.api = new QianwenAPI();
    this.conversations = [];
    this.currentConversationId = null;
    this.currentController = null;
    this.isGenerating = false;
    this.isComposing = false; // 标记是否正在使用输入法输入
    
    this.init();
  }

  init() {
    this.initElements();
    this.loadConfig();
    this.loadConversations();
    this.bindEvents();
    this.setupModalEvents();  // 设置模态框事件
    this.setupMarkdown();
    
    // 检查是否需要直接打开设置（从 AI设置 入口进入）
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('openSettings') === 'true') {
      sessionStorage.removeItem('openSettings');
      setTimeout(() => this.openSettings(), 100);
    }
    // 检查是否已配置
    else if (!this.config.apiKey) {
      this.showConfigPrompt();
    }
    // 正常进入，聚焦输入框
    else {
      this.focusInput();
    }
  }

  initElements() {
    // 侧边栏
    this.sidebar = document.getElementById('sidebar');
    this.conversationsList = document.getElementById('conversationsList');
    this.newChatBtn = document.getElementById('newChatBtn');
    this.toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    this.showSidebarBtn = document.getElementById('showSidebarBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');

    // 主聊天区
    this.chatTitle = document.getElementById('chatTitle');
    this.clearChatBtn = document.getElementById('clearChatBtn');
    this.messagesContainer = document.getElementById('messagesContainer');
    this.welcomeScreen = document.getElementById('welcomeScreen');
    this.messages = document.getElementById('messages');

    // 输入区
    this.messageInput = document.getElementById('messageInput');
    this.sendBtn = document.getElementById('sendBtn');
    this.stopBtn = document.getElementById('stopBtn');
    this.modelIndicator = document.getElementById('modelIndicator');
    this.searchIndicator = document.getElementById('searchIndicator');

    // Loading
    this.loadingOverlay = document.getElementById('loadingOverlay');
  }

  loadConfig() {
    this.config = this.storage.getConfig();
    
    // 确保有 customModels
    if (!this.config.customModels || this.config.customModels.length === 0) {
      this.config.customModels = QianwenAPI.getDefaultModels();
      this.storage.saveConfig(this.config);
    }
    
    // 配置 API
    this.api.setApiKey(this.config.apiKey);
    this.api.setModel(this.config.model);
    this.api.setEnableSearch(this.config.enableSearch);
    this.api.setTemperature(this.config.temperature);
    this.api.setMaxTokens(this.config.maxTokens);

    // 更新 UI 指示器
    const customModels = this.config.customModels || QianwenAPI.getDefaultModels();
    const modelLabel = customModels.find(m => m.value === this.config.model)?.label || this.config.model;
    this.modelIndicator.textContent = `模型: ${modelLabel}`;
    
    if (this.config.enableSearch && this.api.isSearchSupportedModel(this.config.model, customModels)) {
      this.searchIndicator.style.display = 'inline';
    } else {
      this.searchIndicator.style.display = 'none';
    }

    // 应用主题
    this.applyTheme(this.config.theme);
  }

  loadConversations() {
    this.conversations = this.storage.getConversations();
    
    // 获取当前对话 ID
    this.currentConversationId = this.storage.getCurrentConversationId();
    
    // 如果没有当前对话或当前对话不存在，使用第一个
    if (!this.currentConversationId || !this.conversations.find(c => c.id === this.currentConversationId)) {
      this.currentConversationId = this.conversations[0].id;
      this.storage.saveCurrentConversationId(this.currentConversationId);
    }

    this.renderConversationsList();
    this.loadCurrentConversation();
  }

  bindEvents() {
    // 新建对话
    this.newChatBtn.addEventListener('click', () => this.createNewConversation());

    // 侧边栏切换
    this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
    this.showSidebarBtn.addEventListener('click', () => this.toggleSidebar());

    // 设置
    this.settingsBtn.addEventListener('click', () => this.openSettings());

    // 主题切换
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

    // 清空对话
    this.clearChatBtn.addEventListener('click', () => this.clearCurrentConversation());

    // 发送消息
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.stopBtn.addEventListener('click', () => this.stopGeneration());

    // 输入框自动调整高度
    this.messageInput.addEventListener('input', () => this.adjustTextareaHeight());

    // 监听输入法组合事件
    this.messageInput.addEventListener('compositionstart', () => {
      this.isComposing = true;
    });

    this.messageInput.addEventListener('compositionend', () => {
      this.isComposing = false;
    });

    // 快捷键
    this.messageInput.addEventListener('keydown', (e) => {
      // Enter 发送（不按 Shift，且不在输入法组合中）
      if (e.key === 'Enter' && !e.shiftKey && !this.isComposing) {
        e.preventDefault();
        this.sendMessage();
      }
      // Shift+Enter 换行（默认行为，不需要处理）
      // 输入法组合中的 Enter 也使用默认行为（确认输入）
    });

    // 快捷提示按钮
    document.querySelectorAll('.prompt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prompt = e.target.dataset.prompt;
        this.messageInput.value = prompt;
        this.adjustTextareaHeight();
        this.messageInput.focus();
      });
    });

    // 全局快捷键
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        this.createNewConversation();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.clearCurrentConversation();
      } else if (e.key === 'Escape') {
        if (typeof utools !== 'undefined') {
          utools.hideMainWindow();
        }
      }
    });
  }

  setupMarkdown() {
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        highlight: function(code, lang) {
          if (lang && hljs.getLanguage(lang)) {
            try {
              return hljs.highlight(code, { language: lang }).value;
            } catch (err) {}
          }
          return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
      });
    }
  }

  renderConversationsList() {
    // 过滤掉空对话（没有消息的对话），但保留当前对话
    const filteredConversations = this.conversations.filter(conv => 
      conv.id === this.currentConversationId || conv.messages.length > 0
    );

    // 按更新时间排序
    const sortedConversations = [...filteredConversations].sort((a, b) => b.updatedAt - a.updatedAt);

    this.conversationsList.innerHTML = sortedConversations.map(conv => {
      const isActive = conv.id === this.currentConversationId;
      const time = this.formatTime(conv.updatedAt);
      
      return `
        <div class="conversation-item ${isActive ? 'active' : ''}" data-id="${conv.id}">
          <div class="conversation-title">${this.escapeHtml(conv.title)}</div>
          <span class="conversation-time">${time}</span>
          <button class="delete-btn" data-id="${conv.id}" title="删除">🗑️</button>
        </div>
      `;
    }).join('');

    // 绑定点击事件
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-btn')) {
          const id = item.dataset.id;
          this.switchConversation(id);
        }
      });
    });

    // 绑定删除按钮
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.deleteConversation(id);
      });
    });
  }

  loadCurrentConversation() {
    const conversation = this.conversations.find(c => c.id === this.currentConversationId);
    
    if (!conversation) return;

    this.chatTitle.textContent = conversation.title;
    this.renderMessages(conversation.messages);
  }

  renderMessages(messages) {
    if (messages.length === 0) {
      this.welcomeScreen.style.display = 'flex';
      this.messages.innerHTML = '';
    } else {
      this.welcomeScreen.style.display = 'none';
      this.messages.innerHTML = messages.map(msg => this.createMessageHTML(msg)).join('');
      this.scrollToBottom();
    }
  }

  createMessageHTML(message) {
    const role = message.role;
    const icon = role === 'user' ? '👤' : '🤖';
    const name = role === 'user' ? '我' : 'AI';
    const content = role === 'user' ? this.escapeHtml(message.content) : this.renderMarkdown(message.content);
    
    return `
      <div class="message ${role}">
        <div class="message-header">
          <span class="message-icon">${icon}</span>
          <span class="message-name">${name}</span>
        </div>
        <div class="message-content">${content}</div>
      </div>
    `;
  }

  renderMarkdown(content) {
    if (typeof marked !== 'undefined') {
      return marked.parse(content);
    }
    return this.escapeHtml(content).replace(/\n/g, '<br>');
  }

  async sendMessage() {
    const content = this.messageInput.value.trim();
    
    if (!content) return;
    
    if (!this.config.apiKey) {
      await this.showAlert('请先在设置中配置 API Key');
      this.openSettings();
      return;
    }

    if (this.isGenerating) return;

    // 清空输入框
    this.messageInput.value = '';
    this.adjustTextareaHeight();

    // 隐藏欢迎屏幕
    this.welcomeScreen.style.display = 'none';

    // 添加用户消息
    const userMessage = { role: 'user', content: content };
    this.addMessageToUI(userMessage);
    this.storage.addMessageToConversation(this.currentConversationId, userMessage);

    // 重新加载 conversations 以获取最新的消息历史
    this.conversations = this.storage.getConversations();

    // 添加 AI 加载消息
    const loadingMessageId = 'loading-' + Date.now();
    this.messages.innerHTML += `
      <div class="message assistant loading" id="${loadingMessageId}">
        <div class="message-header">
          <span class="message-icon">🤖</span>
          <span class="message-name">AI</span>
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    `;
    this.scrollToBottom();

    // 准备消息历史
    const conversation = this.conversations.find(c => c.id === this.currentConversationId);
    const messages = [
      { role: 'system', content: this.config.systemPrompt },
      ...conversation.messages
    ];

    // 调试：打印发送的消息
    console.log('发送给 API 的消息:', messages);
    console.log('对话历史长度:', conversation.messages.length);

    // 调用 API
    this.isGenerating = true;
    this.sendBtn.style.display = 'none';
    this.stopBtn.style.display = 'flex';

    let assistantMessage = '';
    const loadingElement = document.getElementById(loadingMessageId);

    this.currentController = await this.api.streamChat(
      messages,
      (chunk) => {
        // 接收数据块
        assistantMessage += chunk;
        
        if (loadingElement) {
          loadingElement.classList.remove('loading');
          loadingElement.querySelector('.message-content').innerHTML = this.renderMarkdown(assistantMessage);
          this.scrollToBottom();
        }
      },
      (error) => {
        // 错误处理
        console.error('API 调用失败:', error);
        if (loadingElement) {
          loadingElement.querySelector('.message-content').innerHTML = 
            `<span style="color: #ef4444;">❌ 错误: ${this.escapeHtml(error.message)}</span>`;
        }
        this.finishGeneration();
      },
      () => {
        // 完成
        if (assistantMessage) {
          const aiMessage = { role: 'assistant', content: assistantMessage };
          this.storage.addMessageToConversation(this.currentConversationId, aiMessage);
          
          // 重新加载对话以获取更新后的标题
          this.conversations = this.storage.getConversations();
          
          // 更新对话列表
          const conversation = this.conversations.find(c => c.id === this.currentConversationId);
          if (conversation) {
            this.chatTitle.textContent = conversation.title;
          }
          this.renderConversationsList();
        }
        this.finishGeneration();
      }
    );
  }

  stopGeneration() {
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }
    this.finishGeneration();
  }

  finishGeneration() {
    this.isGenerating = false;
    this.sendBtn.style.display = 'flex';
    this.stopBtn.style.display = 'none';
    this.currentController = null;
  }

  addMessageToUI(message) {
    this.messages.innerHTML += this.createMessageHTML(message);
    this.scrollToBottom();
  }

  createNewConversation() {
    const newConv = this.storage.createNewConversation();
    this.conversations.unshift(newConv);
    this.storage.saveConversations(this.conversations);
    this.switchConversation(newConv.id);
    // 聚焦到输入框
    this.focusInput();
  }

  switchConversation(id) {
    // 清理旧的空对话（除了即将切换到的对话）
    this.cleanupEmptyConversations(id);
    
    this.currentConversationId = id;
    this.storage.saveCurrentConversationId(id);
    this.loadCurrentConversation();
    this.renderConversationsList();
    // 聚焦到输入框
    this.focusInput();
  }

  cleanupEmptyConversations(keepId) {
    // 删除所有空对话，但保留指定的对话和至少一个对话
    const nonEmptyConversations = this.conversations.filter(conv => 
      conv.id === keepId || conv.messages.length > 0
    );
    
    // 确保至少有一个对话
    if (nonEmptyConversations.length === 0) {
      return;
    }
    
    // 如果有空对话被清理，更新存储
    if (nonEmptyConversations.length < this.conversations.length) {
      this.conversations = nonEmptyConversations;
      this.storage.saveConversations(this.conversations);
    }
  }

  focusInput() {
    // 延迟一下确保 DOM 更新完成
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.focus();
      }
    }, 100);
  }

  async deleteConversation(id) {
    if (this.conversations.length === 1) {
      await this.showAlert('不能删除最后一个对话');
      return;
    }

    const confirmed = await this.showConfirm('确定要删除这个对话吗？');
    if (!confirmed) {
      return;
    }

    this.conversations = this.storage.deleteConversation(id);
    
    // 如果删除的是当前对话，切换到第一个
    if (id === this.currentConversationId) {
      this.currentConversationId = this.conversations[0].id;
      this.storage.saveCurrentConversationId(this.currentConversationId);
      this.loadCurrentConversation();
    }
    
    this.renderConversationsList();
  }

  async clearCurrentConversation() {
    const confirmed = await this.showConfirm('确定要清空当前对话吗？');
    if (!confirmed) {
      return;
    }

    this.storage.clearConversationMessages(this.currentConversationId);
    this.conversations = this.storage.getConversations();
    this.loadCurrentConversation();
    this.renderConversationsList();
  }

  toggleSidebar() {
    this.sidebar.classList.toggle('hidden');
    
    if (this.sidebar.classList.contains('hidden')) {
      this.showSidebarBtn.style.display = 'flex';
    } else {
      this.showSidebarBtn.style.display = 'none';
    }
  }

  openSettings() {
    // 显示设置模态框
    const modal = document.getElementById('settingsModal');
    if (modal) {
      this.loadSettingsToModal();
      modal.style.display = 'flex';
    }
  }

  closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  loadSettingsToModal() {
    // 加载当前配置到模态框
    const config = this.storage.getConfig();
    
    document.getElementById('modalApiKey').value = config.apiKey || '';
    document.getElementById('modalModel').value = config.model || 'qwen3-max';
    document.getElementById('modalEnableSearch').checked = config.enableSearch !== false;
    document.getElementById('modalTemperature').value = config.temperature || 0.7;
    document.getElementById('modalTemperatureValue').textContent = config.temperature || 0.7;
    document.getElementById('modalMaxTokens').value = config.maxTokens || 2000;
    document.getElementById('modalMaxTokensValue').textContent = config.maxTokens || 2000;
    document.getElementById('modalSystemPrompt').value = config.systemPrompt || '你是一个helpful、harmless、honest的AI助手。';
    
    // 确保有 customModels
    if (!config.customModels || config.customModels.length === 0) {
      config.customModels = QianwenAPI.getDefaultModels();
      this.storage.saveConfig(config);
    }
    
    // 填充模型选项
    this.renderModelSelect(config.customModels, config.model);
    
    // 渲染自定义模型列表
    this.renderModelList(config.customModels);
    
    this.updateModalModelInfo();
  }

  renderModelSelect(models, selectedModel) {
    const modelSelect = document.getElementById('modalModel');
    modelSelect.innerHTML = models.map(m => 
      `<option value="${m.value}">${m.label}</option>`
    ).join('');
    modelSelect.value = selectedModel || 'qwen3-max';
  }

  renderModelList(models) {
    const modelList = document.getElementById('modalModelList');
    modelList.innerHTML = models.map(m => `
      <div class="model-item" data-model="${m.value}">
        <div class="model-item-info">
          <div class="model-item-name">${this.escapeHtml(m.label)}</div>
          <div class="model-item-id">${this.escapeHtml(m.value)}</div>
        </div>
        ${m.supportsSearch ? '<span class="model-item-badge">支持搜索</span>' : ''}
        <div class="model-item-actions">
          <button class="model-item-btn edit" data-model="${m.value}" data-action="edit">编辑</button>
          <button class="model-item-btn delete" data-model="${m.value}" data-action="delete">删除</button>
        </div>
      </div>
    `).join('');

    // 使用事件委托绑定编辑和删除事件
    // 移除旧的事件监听器（如果有）
    const newModelList = modelList.cloneNode(true);
    modelList.parentNode.replaceChild(newModelList, modelList);
    
    // 绑定新的事件监听器
    newModelList.addEventListener('click', (e) => {
      const target = e.target;
      if (target.classList.contains('model-item-btn')) {
        const action = target.dataset.action;
        const modelValue = target.dataset.model;
        
        if (action === 'edit') {
          this.editModel(modelValue);
        } else if (action === 'delete') {
          this.deleteModel(modelValue);
        }
      }
    });
  }

  updateModalModelInfo() {
    const modelSelect = document.getElementById('modalModel');
    const modelInfo = document.getElementById('modalModelInfo');
    const selectedModel = modelSelect.value;
    
    const config = this.storage.getConfig();
    const api = new QianwenAPI();
    const customModels = config.customModels || QianwenAPI.getDefaultModels();
    
    if (api.isSearchSupportedModel(selectedModel, customModels)) {
      modelInfo.textContent = '✅ 此模型支持联网搜索功能';
      modelInfo.style.color = '#10b981';
      document.getElementById('modalEnableSearch').disabled = false;
    } else {
      modelInfo.textContent = '⚠️ 此模型不支持联网搜索功能';
      modelInfo.style.color = '#f59e0b';
      document.getElementById('modalEnableSearch').disabled = true;
      document.getElementById('modalEnableSearch').checked = false;
    }
  }

  setupModalEvents() {
    // 使用事件委托来处理所有模态框内的点击事件
    const modal = document.getElementById('settingsModal');
    
    modal.addEventListener('click', (e) => {
      const target = e.target;
      
      // 调试：输出点击的元素
      console.log('模态框点击事件:', target.id, target.className);
      
      // 点击背景关闭
      if (target.id === 'settingsModal') {
        this.closeSettings();
        return;
      }
      
      // 关闭按钮
      if (target.id === 'closeSettingsBtn' || target.closest('#closeSettingsBtn')) {
        this.closeSettings();
        return;
      }
      
      // 取消按钮
      if (target.id === 'modalCancelBtn' || target.closest('#modalCancelBtn')) {
        this.closeSettings();
        return;
      }
      
      // API Key 显示/隐藏
      if (target.id === 'modalToggleApiKey' || target.closest('#modalToggleApiKey')) {
        const input = document.getElementById('modalApiKey');
        const btn = document.getElementById('modalToggleApiKey');
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.textContent = input.type === 'password' ? '👁️' : '🙈';
        return;
      }
      
      // 验证 API Key
      if (target.id === 'modalValidateBtn' || target.closest('#modalValidateBtn')) {
        this.validateModalApiKey();
        return;
      }
      
      // 添加模型
      if (target.id === 'modalAddModelBtn' || target.closest('#modalAddModelBtn')) {
        console.log('检测到添加模型按钮点击');
        e.preventDefault();
        e.stopPropagation();
        this.addModel();
        return;
      }
      
      // 保存设置
      if (target.id === 'modalSaveBtn' || target.closest('#modalSaveBtn')) {
        this.saveModalSettings();
        return;
      }
    });

    // 模型选择变化
    document.getElementById('modalModel').addEventListener('change', () => {
      this.updateModalModelInfo();
    });

    // 温度滑块
    document.getElementById('modalTemperature').addEventListener('input', (e) => {
      document.getElementById('modalTemperatureValue').textContent = e.target.value;
    });

    // Token 滑块
    document.getElementById('modalMaxTokens').addEventListener('input', (e) => {
      document.getElementById('modalMaxTokensValue').textContent = e.target.value;
    });
  }

  async addModel() {
    console.log('addModel 被调用');
    
    const modelValue = await this.showPrompt('请输入模型 ID', '例如：qwen-plus');
    if (!modelValue || !modelValue.trim()) {
      console.log('用户取消或未输入模型 ID');
      return;
    }

    const modelLabel = await this.showPrompt('请输入模型显示名称', modelValue);
    if (!modelLabel || !modelLabel.trim()) {
      console.log('用户取消或未输入模型名称');
      return;
    }

    const supportsSearch = await this.showConfirm('该模型是否支持网络搜索？');

    const config = this.storage.getConfig();
    if (!config.customModels) {
      config.customModels = [];
    }

    // 检查是否已存在
    if (config.customModels.find(m => m.value === modelValue.trim())) {
      await this.showAlert('该模型已存在！');
      return;
    }

    config.customModels.push({
      value: modelValue.trim(),
      label: modelLabel.trim(),
      supportsSearch: supportsSearch
    });

    console.log('添加模型成功:', config.customModels);
    
    this.storage.saveConfig(config);
    this.renderModelSelect(config.customModels, config.model);
    this.renderModelList(config.customModels);
  }

  async editModel(modelValue) {
    console.log('editModel 被调用，模型:', modelValue);
    
    const config = this.storage.getConfig();
    const model = config.customModels.find(m => m.value === modelValue);
    if (!model) {
      console.error('未找到模型:', modelValue);
      return;
    }

    const newLabel = await this.showPrompt('请输入新的显示名称', model.label);
    if (!newLabel || !newLabel.trim()) {
      console.log('用户取消或未输入新名称');
      return;
    }

    const supportsSearch = await this.showConfirm(
      '该模型是否支持网络搜索？\n\n当前设置：' + (model.supportsSearch ? '支持' : '不支持')
    );

    model.label = newLabel.trim();
    model.supportsSearch = supportsSearch;

    console.log('编辑模型成功:', model);
    
    this.storage.saveConfig(config);
    this.renderModelSelect(config.customModels, config.model);
    this.renderModelList(config.customModels);
  }

  async deleteModel(modelValue) {
    const config = this.storage.getConfig();
    
    if (config.customModels.length <= 1) {
      await this.showAlert('至少需要保留一个模型！');
      return;
    }

    const confirmed = await this.showConfirm(`确定要删除模型"${modelValue}"吗？`);
    if (!confirmed) {
      return;
    }

    config.customModels = config.customModels.filter(m => m.value !== modelValue);

    // 如果删除的是当前选中的模型，切换到第一个模型
    if (config.model === modelValue) {
      config.model = config.customModels[0].value;
    }

    this.storage.saveConfig(config);
    this.renderModelSelect(config.customModels, config.model);
    this.renderModelList(config.customModels);
  }

  async validateModalApiKey() {
    const apiKey = document.getElementById('modalApiKey').value.trim();
    const validateBtn = document.getElementById('modalValidateBtn');
    const validateResult = document.getElementById('modalValidateResult');
    
    if (!apiKey) {
      this.showModalValidateResult('请输入 API Key', 'error');
      return;
    }

    validateBtn.disabled = true;
    validateBtn.textContent = '验证中...';
    validateResult.textContent = '';

    const api = new QianwenAPI();
    api.setApiKey(apiKey);
    api.setModel(document.getElementById('modalModel').value);

    const result = await api.validateApiKey();

    validateBtn.disabled = false;
    validateBtn.textContent = '验证 API Key';

    if (result.valid) {
      this.showModalValidateResult('✅ ' + result.message, 'success');
    } else {
      this.showModalValidateResult('❌ ' + result.message, 'error');
    }
  }

  showModalValidateResult(message, type) {
    const validateResult = document.getElementById('modalValidateResult');
    validateResult.textContent = message;
    validateResult.className = `validate-result ${type}`;
    
    setTimeout(() => {
      validateResult.textContent = '';
      validateResult.className = 'validate-result';
    }, 5000);
  }

  async saveModalSettings() {
    const apiKey = document.getElementById('modalApiKey').value.trim();
    
    if (!apiKey) {
      await this.showAlert('请输入 API Key');
      return;
    }

    const currentConfig = this.storage.getConfig();
    const newConfig = {
      apiKey: apiKey,
      model: document.getElementById('modalModel').value,
      enableSearch: document.getElementById('modalEnableSearch').checked,
      temperature: parseFloat(document.getElementById('modalTemperature').value),
      maxTokens: parseInt(document.getElementById('modalMaxTokens').value),
      systemPrompt: document.getElementById('modalSystemPrompt').value.trim(),
      theme: this.config.theme,
      customModels: currentConfig.customModels || QianwenAPI.getDefaultModels()
    };

    const success = this.storage.saveConfig(newConfig);
    
    if (success) {
      this.config = newConfig;
      this.loadConfig();
      await this.showAlert('设置保存成功！');
      this.closeSettings();
    } else {
      await this.showAlert('保存失败，请重试');
    }
  }

  toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    this.config.theme = newTheme;
    this.storage.saveConfig(this.config);
    this.applyTheme(newTheme);
  }

  applyTheme(theme) {
    let actualTheme = theme;
    
    if (theme === 'auto') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.body.className = actualTheme === 'dark' ? 'dark-theme' : 'light-theme';
    
    // 切换代码高亮主题
    const lightTheme = document.getElementById('highlight-light');
    const darkTheme = document.getElementById('highlight-dark');
    
    if (actualTheme === 'dark') {
      if (lightTheme) lightTheme.disabled = true;
      if (darkTheme) darkTheme.disabled = false;
      this.themeToggleBtn.textContent = '☀️';
    } else {
      if (lightTheme) lightTheme.disabled = false;
      if (darkTheme) darkTheme.disabled = true;
      this.themeToggleBtn.textContent = '🌙';
    }
  }

  adjustTextareaHeight() {
    this.messageInput.style.height = 'auto';
    this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + 'px';
  }

  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 100);
  }

  async showConfigPrompt() {
    setTimeout(async () => {
      const confirmed = await this.showConfirm('检测到您还未配置 API Key，是否现在去配置？');
      if (confirmed) {
        this.openSettings();
      }
    }, 500);
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 自定义 prompt 对话框
   */
  showPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
      const dialog = document.getElementById('customDialog');
      const title = document.getElementById('dialogTitle');
      const messageEl = document.getElementById('dialogMessage');
      const input = document.getElementById('dialogInput');
      const confirmBtn = document.getElementById('dialogConfirmBtn');
      const cancelBtn = document.getElementById('dialogCancelBtn');

      title.textContent = '输入';
      messageEl.textContent = message;
      input.style.display = 'block';
      input.value = defaultValue;
      dialog.style.display = 'flex';

      // 聚焦到输入框
      setTimeout(() => input.focus(), 100);

      const cleanup = (result) => {
        dialog.style.display = 'none';
        input.value = '';
        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        resolve(result);
      };

      const handleConfirm = () => {
        cleanup(input.value);
      };

      const handleCancel = () => {
        cleanup(null);
      };

      const handleKeydown = (e) => {
        if (e.key === 'Enter' && !this.isComposing) {
          handleConfirm();
        } else if (e.key === 'Escape') {
          handleCancel();
        }
      };

      document.getElementById('dialogConfirmBtn').addEventListener('click', handleConfirm);
      document.getElementById('dialogCancelBtn').addEventListener('click', handleCancel);
      input.addEventListener('keydown', handleKeydown);
    });
  }

  /**
   * 自定义 confirm 对话框
   */
  showConfirm(message) {
    return new Promise((resolve) => {
      const dialog = document.getElementById('customDialog');
      const title = document.getElementById('dialogTitle');
      const messageEl = document.getElementById('dialogMessage');
      const input = document.getElementById('dialogInput');
      const confirmBtn = document.getElementById('dialogConfirmBtn');
      const cancelBtn = document.getElementById('dialogCancelBtn');

      title.textContent = '确认';
      messageEl.textContent = message;
      input.style.display = 'none';
      dialog.style.display = 'flex';

      const cleanup = (result) => {
        dialog.style.display = 'none';
        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        resolve(result);
      };

      const handleConfirm = () => {
        cleanup(true);
      };

      const handleCancel = () => {
        cleanup(false);
      };

      document.getElementById('dialogConfirmBtn').addEventListener('click', handleConfirm);
      document.getElementById('dialogCancelBtn').addEventListener('click', handleCancel);
    });
  }

  /**
   * 自定义 alert 对话框
   */
  showAlert(message) {
    return new Promise((resolve) => {
      const dialog = document.getElementById('customDialog');
      const title = document.getElementById('dialogTitle');
      const messageEl = document.getElementById('dialogMessage');
      const input = document.getElementById('dialogInput');
      const confirmBtn = document.getElementById('dialogConfirmBtn');
      const cancelBtn = document.getElementById('dialogCancelBtn');

      title.textContent = '提示';
      messageEl.textContent = message;
      input.style.display = 'none';
      cancelBtn.style.display = 'none';
      dialog.style.display = 'flex';

      const cleanup = () => {
        dialog.style.display = 'none';
        cancelBtn.style.display = 'block';
        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        resolve();
      };

      document.getElementById('dialogConfirmBtn').addEventListener('click', cleanup);
    });
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  window.chatApp = new ChatApp();
  
  // 页面卸载前清理空对话
  window.addEventListener('beforeunload', () => {
    if (window.chatApp) {
      window.chatApp.cleanupEmptyConversations(window.chatApp.currentConversationId);
    }
  });
});

