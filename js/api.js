/**
 * 通义千问 API 封装
 * 支持流式调用和网络搜索
 */

class QianwenAPI {
  constructor() {
    this.baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.apiKey = '';
    this.model = 'qwen-plus';
    this.enableSearch = false;
    this.temperature = 0.7;
    this.maxTokens = 2000;
  }

  /**
   * 设置 API Key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * 设置模型
   */
  setModel(model) {
    this.model = model;
  }

  /**
   * 设置是否启用搜索
   */
  setEnableSearch(enable) {
    this.enableSearch = enable;
  }

  /**
   * 设置温度参数
   */
  setTemperature(temperature) {
    this.temperature = temperature;
  }

  /**
   * 设置最大 token 数
   */
  setMaxTokens(maxTokens) {
    this.maxTokens = maxTokens;
  }

  /**
   * 流式调用 API
   * @param {Array} messages - 消息历史
   * @param {Function} onChunk - 接收数据块的回调函数
   * @param {Function} onError - 错误回调
   * @param {Function} onComplete - 完成回调
   * @returns {Object} 包含 abort 方法的控制器
   */
  async streamChat(messages, onChunk, onError, onComplete) {
    if (!this.apiKey) {
      onError(new Error('API Key 未配置，请先在设置中配置'));
      return { abort: () => {} };
    }

    const controller = new AbortController();
    const signal = controller.signal;

    try {
      const requestBody = {
        model: this.model,
        messages: messages,
        stream: true,
        temperature: this.temperature,
        max_tokens: this.maxTokens
      };

      // 如果启用搜索且模型支持，添加搜索参数
      if (this.enableSearch && this.isSearchSupportedModel(this.model)) {
        requestBody.enable_search = true;
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (onComplete) onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.trim() === 'data: [DONE]') {
            if (onComplete) onComplete();
            return { abort: () => controller.abort() };
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.choices && data.choices[0]?.delta?.content) {
                const content = data.choices[0].delta.content;
                if (onChunk) onChunk(content);
              }
            } catch (e) {
              console.error('解析 SSE 数据失败:', e, line);
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('请求已取消');
      } else {
        if (onError) onError(error);
      }
    }

    return { abort: () => controller.abort() };
  }

  /**
   * 非流式调用 API（用于特殊场景）
   * @param {Array} messages - 消息历史
   * @returns {Promise<string>} 返回完整回复
   */
  async chat(messages) {
    if (!this.apiKey) {
      throw new Error('API Key 未配置，请先在设置中配置');
    }

    const requestBody = {
      model: this.model,
      messages: messages,
      stream: false,
      temperature: this.temperature,
      max_tokens: this.maxTokens
    };

    if (this.enableSearch && this.isSearchSupportedModel(this.model)) {
      requestBody.enable_search = true;
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * 验证 API Key 是否有效
   */
  async validateApiKey() {
    try {
      const messages = [{ role: 'user', content: '你好' }];
      await this.chat(messages);
      return { valid: true, message: 'API Key 验证成功' };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }

  /**
   * 判断模型是否支持搜索功能
   * @param {string} model - 模型名称
   * @param {Array} customModels - 自定义模型列表
   */
  isSearchSupportedModel(model, customModels = null) {
    // 从自定义模型列表中查找
    if (customModels && customModels.length > 0) {
      const modelInfo = customModels.find(m => m.value === model);
      if (modelInfo) {
        return modelInfo.supportsSearch === true;
      }
    }
    
    // 默认判断：包含 latest 或 qwen3 的模型通常支持搜索
    return model.includes('latest') || model.includes('qwen3');
  }

  /**
   * 获取默认的模型列表
   */
  static getDefaultModels() {
    return [
      { value: 'qwen3-max', label: 'Qwen3-Max', supportsSearch: true }
    ];
  }

  /**
   * 获取可用的模型列表（从配置中读取）
   */
  static getAvailableModels(customModels = null) {
    if (customModels && customModels.length > 0) {
      return customModels;
    }
    return this.getDefaultModels();
  }
}

// 导出为全局变量（兼容 utools 环境）
if (typeof window !== 'undefined') {
  window.QianwenAPI = QianwenAPI;
}

