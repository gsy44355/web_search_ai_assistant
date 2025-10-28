/**
 * 数据存储管理模块
 * 使用 utools.dbStorage 进行数据持久化
 */

class StorageManager {
  constructor() {
    this.CONFIG_KEY = 'ai_chat_config';
    this.CONVERSATIONS_KEY = 'ai_chat_conversations';
    this.CURRENT_CONVERSATION_KEY = 'ai_chat_current';
  }

  /**
   * 保存配置
   */
  saveConfig(config) {
    try {
      if (typeof utools !== 'undefined' && utools.dbStorage) {
        utools.dbStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
      } else {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
      }
      return true;
    } catch (error) {
      console.error('保存配置失败:', error);
      return false;
    }
  }

  /**
   * 获取配置
   */
  getConfig() {
    try {
      let configStr;
      if (typeof utools !== 'undefined' && utools.dbStorage) {
        configStr = utools.dbStorage.getItem(this.CONFIG_KEY);
      } else {
        configStr = localStorage.getItem(this.CONFIG_KEY);
      }
      
      if (configStr) {
        return JSON.parse(configStr);
      }
      
      // 返回默认配置
      return this.getDefaultConfig();
    } catch (error) {
      console.error('获取配置失败:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig() {
    return {
      apiKey: '',
      model: 'qwen3-max',
      enableSearch: true,
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: '你是一个helpful、harmless、honest的AI助手。',
      theme: 'light',
      customModels: [
        { value: 'qwen3-max', label: 'Qwen3-Max', supportsSearch: true }
      ]
    };
  }

  /**
   * 保存所有对话
   */
  saveConversations(conversations) {
    try {
      if (typeof utools !== 'undefined' && utools.dbStorage) {
        utools.dbStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(conversations));
      } else {
        localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(conversations));
      }
      return true;
    } catch (error) {
      console.error('保存对话失败:', error);
      return false;
    }
  }

  /**
   * 获取所有对话
   */
  getConversations() {
    try {
      let conversationsStr;
      if (typeof utools !== 'undefined' && utools.dbStorage) {
        conversationsStr = utools.dbStorage.getItem(this.CONVERSATIONS_KEY);
      } else {
        conversationsStr = localStorage.getItem(this.CONVERSATIONS_KEY);
      }
      
      if (conversationsStr) {
        return JSON.parse(conversationsStr);
      }
      
      // 返回默认对话
      return [this.createNewConversation()];
    } catch (error) {
      console.error('获取对话失败:', error);
      return [this.createNewConversation()];
    }
  }

  /**
   * 创建新对话
   */
  createNewConversation() {
    return {
      id: this.generateId(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /**
   * 保存当前对话 ID
   */
  saveCurrentConversationId(id) {
    try {
      if (typeof utools !== 'undefined' && utools.dbStorage) {
        utools.dbStorage.setItem(this.CURRENT_CONVERSATION_KEY, id);
      } else {
        localStorage.setItem(this.CURRENT_CONVERSATION_KEY, id);
      }
      return true;
    } catch (error) {
      console.error('保存当前对话 ID 失败:', error);
      return false;
    }
  }

  /**
   * 获取当前对话 ID
   */
  getCurrentConversationId() {
    try {
      if (typeof utools !== 'undefined' && utools.dbStorage) {
        return utools.dbStorage.getItem(this.CURRENT_CONVERSATION_KEY);
      } else {
        return localStorage.getItem(this.CURRENT_CONVERSATION_KEY);
      }
    } catch (error) {
      console.error('获取当前对话 ID 失败:', error);
      return null;
    }
  }

  /**
   * 添加消息到对话
   */
  addMessageToConversation(conversationId, message) {
    const conversations = this.getConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      conversation.messages.push({
        ...message,
        timestamp: Date.now()
      });
      conversation.updatedAt = Date.now();
      
      // 自动更新对话标题（取第一条用户消息的前 20 个字）
      if (conversation.title === '新对话' && message.role === 'user') {
        conversation.title = message.content.slice(0, 20) + (message.content.length > 20 ? '...' : '');
      }
      
      this.saveConversations(conversations);
      return true;
    }
    return false;
  }

  /**
   * 更新对话中的最后一条消息
   */
  updateLastMessage(conversationId, content) {
    const conversations = this.getConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      lastMessage.content = content;
      conversation.updatedAt = Date.now();
      this.saveConversations(conversations);
      return true;
    }
    return false;
  }

  /**
   * 删除对话
   */
  deleteConversation(conversationId) {
    let conversations = this.getConversations();
    conversations = conversations.filter(c => c.id !== conversationId);
    
    // 确保至少有一个对话
    if (conversations.length === 0) {
      conversations.push(this.createNewConversation());
    }
    
    this.saveConversations(conversations);
    return conversations;
  }

  /**
   * 清空对话消息
   */
  clearConversationMessages(conversationId) {
    const conversations = this.getConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      conversation.messages = [];
      conversation.title = '新对话';
      conversation.updatedAt = Date.now();
      this.saveConversations(conversations);
      return true;
    }
    return false;
  }

  /**
   * 导出对话历史
   */
  exportConversations() {
    const conversations = this.getConversations();
    const dataStr = JSON.stringify(conversations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-chat-history-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * 导入对话历史
   */
  importConversations(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const conversations = JSON.parse(e.target.result);
          if (Array.isArray(conversations)) {
            this.saveConversations(conversations);
            resolve(conversations);
          } else {
            reject(new Error('无效的对话历史文件格式'));
          }
        } catch (error) {
          reject(new Error('解析对话历史文件失败'));
        }
      };
      
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  }

  /**
   * 生成唯一 ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 清空所有数据
   */
  clearAll() {
    try {
      if (typeof utools !== 'undefined' && utools.dbStorage) {
        utools.dbStorage.removeItem(this.CONFIG_KEY);
        utools.dbStorage.removeItem(this.CONVERSATIONS_KEY);
        utools.dbStorage.removeItem(this.CURRENT_CONVERSATION_KEY);
      } else {
        localStorage.removeItem(this.CONFIG_KEY);
        localStorage.removeItem(this.CONVERSATIONS_KEY);
        localStorage.removeItem(this.CURRENT_CONVERSATION_KEY);
      }
      return true;
    } catch (error) {
      console.error('清空数据失败:', error);
      return false;
    }
  }
}

// 导出为全局变量
if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
}

