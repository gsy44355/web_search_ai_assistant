/**
 * uTools 插件预加载脚本
 * 定义插件的生命周期和功能
 */

window.exports = {
  /**
   * AI 对话功能
   */
  "ai_chat": {
    mode: "none",
    args: {
      // 进入插件时的回调
      enter: (action) => {
        // 可以在这里处理传入的参数
        console.log('进入 AI 对话', action);
      },
      
      // 离开插件时的回调
      leave: () => {
        console.log('离开 AI 对话');
      }
    }
  },

  /**
   * AI 提问功能（支持直接输入）
   */
  "ai_ask": {
    mode: "none",
    args: {
      enter: (action, callbackSetList) => {
        console.log('========== 进入 AI 提问 ==========');
        console.log('action 类型:', typeof action);
        console.log('action 内容:', action);
        
        try {
          console.log('action JSON:', JSON.stringify(action, null, 2));
        } catch (e) {
          console.log('action 无法序列化为 JSON:', e.message);
        }
        
        // 尝试多种方式获取用户输入的问题
        let question = null;
        
        if (action) {
          // 方式1: 尝试从 payload 获取（常用于 type: "over" 和一些其他类型）
          if (action.payload) {
            question = action.payload;
            console.log('✓ 从 payload 获取:', question);
          }
          // 方式2: 尝试从 text 获取
          else if (action.text) {
            question = action.text;
            console.log('✓ 从 text 获取:', question);
          }
          // 方式3: 尝试从 code 获取
          else if (action.code) {
            question = action.code;
            console.log('✓ 从 code 获取:', question);
          }
          // 方式4: 如果 action 本身是字符串
          else if (typeof action === 'string') {
            question = action;
            console.log('✓ action 本身是字符串:', question);
          }
          // 方式5: 尝试从 query 获取（用于 type: "input"）
          else if (action.query) {
            question = action.query;
            console.log('✓ 从 query 获取:', question);
          }
        }
        
        // 如果成功获取到问题，存储到 sessionStorage
        if (question && typeof question === 'string') {
          const trimmedQuestion = question.trim();
          if (trimmedQuestion) {
            console.log('✅ 成功获取用户问题:', trimmedQuestion);
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('autoAskQuestion', trimmedQuestion);
              console.log('✅ 已存储到 sessionStorage');
            } else {
              console.error('❌ sessionStorage 不可用');
            }
          } else {
            console.warn('⚠️ 问题为空字符串');
          }
        } else {
          console.error('❌ 未能获取到用户输入的问题');
          console.log('action 的所有属性:');
          if (action && typeof action === 'object') {
            for (let key in action) {
              console.log(`  - ${key}:`, action[key]);
            }
          }
        }
        
        console.log('========================================');
      },
      
      leave: () => {
        console.log('离开 AI 提问');
      }
    }
  },

  /**
   * AI 设置功能
   */
  "ai_settings": {
    mode: "none",
    args: {
      enter: (action) => {
        // 标记需要打开设置
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('openSettings', 'true');
        }
      }
    }
  }
};

/**
 * 自定义路由处理
 */
if (typeof utools !== 'undefined') {
  // 处理设置页面路由
  utools.onPluginReady(() => {
    console.log('插件已就绪');
    
    // 检查是否是设置页面
    if (window.location.pathname.includes('settings.html')) {
      console.log('设置页面已加载');
    }
  });

  // 监听插件退出事件
  utools.onPluginOut(() => {
    console.log('插件已退出');
  });
}

/**
 * 工具函数：在 utools 环境中使用
 */
window.utoolsHelper = {
  /**
   * 获取剪贴板内容
   */
  getClipboard: () => {
    if (typeof utools !== 'undefined' && utools.copyText) {
      return utools.readClipboard();
    }
    return null;
  },

  /**
   * 设置剪贴板内容
   */
  setClipboard: (text) => {
    if (typeof utools !== 'undefined' && utools.copyText) {
      utools.copyText(text);
      return true;
    }
    return false;
  },

  /**
   * 隐藏主窗口
   */
  hideWindow: () => {
    if (typeof utools !== 'undefined') {
      utools.hideMainWindow();
    }
  },

  /**
   * 显示主窗口
   */
  showWindow: () => {
    if (typeof utools !== 'undefined') {
      utools.showMainWindow();
    }
  },

  /**
   * 退出插件
   */
  outPlugin: () => {
    if (typeof utools !== 'undefined') {
      utools.outPlugin();
    }
  },

  /**
   * 判断是否在 utools 环境中
   */
  isUtools: () => {
    return typeof utools !== 'undefined';
  },

  /**
   * 打开外部链接
   */
  openExternal: (url) => {
    if (typeof utools !== 'undefined' && utools.shellOpenExternal) {
      utools.shellOpenExternal(url);
    } else {
      window.open(url, '_blank');
    }
  },

  /**
   * 获取插件信息
   */
  getPluginInfo: () => {
    if (typeof utools !== 'undefined') {
      return {
        version: utools.getAppVersion?.() || 'unknown',
        platform: utools.getPlatform?.() || 'unknown'
      };
    }
    return null;
  }
};

