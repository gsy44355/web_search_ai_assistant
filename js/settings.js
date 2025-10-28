/**
 * 设置界面逻辑
 */

class SettingsPage {
  constructor() {
    this.storage = new StorageManager();
    this.api = new QianwenAPI();
    this.config = this.storage.getConfig();
    
    this.init();
  }

  init() {
    this.initElements();
    this.loadConfig();
    this.bindEvents();
    this.populateModelSelect();
    this.updateModelInfo();
  }

  initElements() {
    // API 配置
    this.apiKeyInput = document.getElementById('apiKey');
    this.toggleApiKeyBtn = document.getElementById('toggleApiKey');
    this.validateBtn = document.getElementById('validateBtn');
    this.validateResult = document.getElementById('validateResult');

    // 模型配置
    this.modelSelect = document.getElementById('model');
    this.enableSearchCheckbox = document.getElementById('enableSearch');
    this.modelInfo = document.getElementById('modelInfo');

    // 高级参数
    this.temperatureInput = document.getElementById('temperature');
    this.temperatureValue = document.getElementById('temperatureValue');
    this.maxTokensInput = document.getElementById('maxTokens');
    this.maxTokensValue = document.getElementById('maxTokensValue');
    this.systemPromptTextarea = document.getElementById('systemPrompt');

    // 界面设置
    this.themeSelect = document.getElementById('theme');

    // 数据管理
    this.exportBtn = document.getElementById('exportBtn');
    this.importBtn = document.getElementById('importBtn');
    this.importFile = document.getElementById('importFile');
    this.clearDataBtn = document.getElementById('clearDataBtn');

    // 底部按钮
    this.backBtn = document.getElementById('backBtn');
    this.saveBtn = document.getElementById('saveBtn');
    this.cancelBtn = document.getElementById('cancelBtn');

    // 提示
    this.toast = document.getElementById('toast');
  }

  loadConfig() {
    this.apiKeyInput.value = this.config.apiKey || '';
    this.modelSelect.value = this.config.model || 'qwen-plus';
    this.enableSearchCheckbox.checked = this.config.enableSearch !== false;
    this.temperatureInput.value = this.config.temperature || 0.7;
    this.temperatureValue.textContent = this.config.temperature || 0.7;
    this.maxTokensInput.value = this.config.maxTokens || 2000;
    this.maxTokensValue.textContent = this.config.maxTokens || 2000;
    this.systemPromptTextarea.value = this.config.systemPrompt || '你是一个helpful、harmless、honest的AI助手。';
    this.themeSelect.value = this.config.theme || 'light';

    // 应用主题
    this.applyTheme(this.config.theme || 'light');
  }

  bindEvents() {
    // API Key 显示/隐藏
    this.toggleApiKeyBtn.addEventListener('click', () => {
      const type = this.apiKeyInput.type === 'password' ? 'text' : 'password';
      this.apiKeyInput.type = type;
      this.toggleApiKeyBtn.textContent = type === 'password' ? '👁️' : '🙈';
    });

    // 验证 API Key
    this.validateBtn.addEventListener('click', () => this.validateApiKey());

    // 模型选择变化
    this.modelSelect.addEventListener('change', () => this.updateModelInfo());

    // 温度滑块
    this.temperatureInput.addEventListener('input', (e) => {
      this.temperatureValue.textContent = e.target.value;
    });

    // Token 滑块
    this.maxTokensInput.addEventListener('input', (e) => {
      this.maxTokensValue.textContent = e.target.value;
    });

    // 主题选择
    this.themeSelect.addEventListener('change', (e) => {
      this.applyTheme(e.target.value);
    });

    // 导出对话历史
    this.exportBtn.addEventListener('click', () => {
      this.storage.exportConversations();
      this.showToast('对话历史已导出', 'success');
    });

    // 导入对话历史
    this.importBtn.addEventListener('click', () => {
      this.importFile.click();
    });

    this.importFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          await this.storage.importConversations(file);
          this.showToast('对话历史导入成功', 'success');
        } catch (error) {
          this.showToast('导入失败: ' + error.message, 'error');
        }
      }
      this.importFile.value = '';
    });

    // 清空数据
    this.clearDataBtn.addEventListener('click', () => {
      if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        this.storage.clearAll();
        this.showToast('所有数据已清空', 'success');
        setTimeout(() => location.reload(), 1000);
      }
    });

    // 返回主界面
    this.backBtn.addEventListener('click', () => {
      if (typeof utools !== 'undefined') {
        window.location.href = 'index.html';
      } else {
        window.close();
      }
    });

    // 保存设置
    this.saveBtn.addEventListener('click', () => this.saveConfig());

    // 关闭
    this.cancelBtn.addEventListener('click', () => {
      if (typeof utools !== 'undefined') {
        utools.hideMainWindow();
      } else {
        window.close();
      }
    });

    // 快捷键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.cancelBtn.click();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveBtn.click();
      }
    });
  }

  populateModelSelect() {
    const models = QianwenAPI.getAvailableModels();
    this.modelSelect.innerHTML = models.map(model => 
      `<option value="${model.value}" data-search="${model.supportsSearch}">${model.label}</option>`
    ).join('');
  }

  updateModelInfo() {
    const selectedOption = this.modelSelect.options[this.modelSelect.selectedIndex];
    const supportsSearch = selectedOption.dataset.search === 'true';
    
    if (supportsSearch) {
      this.modelInfo.textContent = '✅ 此模型支持联网搜索功能';
      this.modelInfo.style.color = '#10b981';
      this.enableSearchCheckbox.disabled = false;
    } else {
      this.modelInfo.textContent = '⚠️ 此模型不支持联网搜索功能';
      this.modelInfo.style.color = '#f59e0b';
      this.enableSearchCheckbox.disabled = true;
      this.enableSearchCheckbox.checked = false;
    }
  }

  async validateApiKey() {
    const apiKey = this.apiKeyInput.value.trim();
    
    if (!apiKey) {
      this.showValidateResult('请输入 API Key', 'error');
      return;
    }

    this.validateBtn.disabled = true;
    this.validateBtn.textContent = '验证中...';
    this.validateResult.textContent = '';

    this.api.setApiKey(apiKey);
    this.api.setModel(this.modelSelect.value);

    const result = await this.api.validateApiKey();

    this.validateBtn.disabled = false;
    this.validateBtn.textContent = '验证 API Key';

    if (result.valid) {
      this.showValidateResult('✅ ' + result.message, 'success');
    } else {
      this.showValidateResult('❌ ' + result.message, 'error');
    }
  }

  showValidateResult(message, type) {
    this.validateResult.textContent = message;
    this.validateResult.className = `validate-result ${type}`;
    
    setTimeout(() => {
      this.validateResult.textContent = '';
      this.validateResult.className = 'validate-result';
    }, 5000);
  }

  saveConfig() {
    const apiKey = this.apiKeyInput.value.trim();
    
    if (!apiKey) {
      this.showToast('请输入 API Key', 'error');
      return;
    }

    const newConfig = {
      apiKey: apiKey,
      model: this.modelSelect.value,
      enableSearch: this.enableSearchCheckbox.checked,
      temperature: parseFloat(this.temperatureInput.value),
      maxTokens: parseInt(this.maxTokensInput.value),
      systemPrompt: this.systemPromptTextarea.value.trim(),
      theme: this.themeSelect.value
    };

    const success = this.storage.saveConfig(newConfig);
    
    if (success) {
      this.showToast('设置保存成功！正在返回...', 'success');
      setTimeout(() => {
        if (typeof utools !== 'undefined') {
          window.location.href = 'index.html';
        }
      }, 1000);
    } else {
      this.showToast('保存失败，请重试', 'error');
    }
  }

  applyTheme(theme) {
    let actualTheme = theme;
    
    if (theme === 'auto') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.body.className = actualTheme === 'dark' ? 'dark-theme' : 'light-theme';
  }

  showToast(message, type = 'info') {
    this.toast.textContent = message;
    this.toast.className = `toast toast-${type} show`;
    
    setTimeout(() => {
      this.toast.classList.remove('show');
    }, 3000);
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new SettingsPage();
});

