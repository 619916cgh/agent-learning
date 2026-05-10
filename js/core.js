/**
 * Core Utilities — Agent 学习平台
 * 通用工具函数、LocalStorage 封装、DOM 辅助
 */
const AgentLearn = window.AgentLearn || {};

(function(AL) {
  'use strict';

  // ============ 集中式数据 ============
  // 章节元数据 — 侧边栏和组件渲染的唯一数据源
  AL.CHAPTERS = [
    { num: 1, title: '什么是 AI Agent', file: '01-what-is-agent.html', desc: 'AI Agent 的核心定义、与传统LLM的区别、能力边界和实际应用场景概览', difficulty: '入门', category: 'basic' },
    { num: 2, title: '核心架构', file: '02-core-architecture.html', desc: '感知-规划-行动-反馈循环、LLM推理引擎、上下文窗口和五大核心组件详解', difficulty: '入门', category: 'basic' },
    { num: 3, title: '工具调用机制', file: '03-tool-calling.html', desc: 'Function Calling原理、JSON Schema设计、工具生命周期和错误处理策略', difficulty: '基础', category: 'core' },
    { num: 4, title: '记忆与状态管理', file: '04-memory-management.html', desc: '三层记忆架构、RAG检索增强生成、向量数据库和记忆管理最佳实践', difficulty: '基础', category: 'core' },
    { num: 5, title: '推理与规划', file: '05-reasoning-planning.html', desc: 'ReAct模式、Chain-of-Thought、Plan-and-Execute、思维树等高级推理策略', difficulty: '核心', category: 'core' },
    { num: 6, title: '多Agent系统', file: '06-multi-agent.html', desc: '多Agent协作模式、通信协议、任务编排和Swarm/Hierarchical架构对比', difficulty: '核心', category: 'core' },
    { num: 7, title: '安全与可靠性', file: '07-safety-reliability.html', desc: '提示注入防护、沙箱执行、权限控制、输出验证和审计监控体系', difficulty: '进阶', category: 'intermediate' },
    { num: 8, title: '提示词工程', file: '08-prompt-engineering.html', desc: '系统提示词设计、Few-shot引导、动态提示词组装和优化迭代方法', difficulty: '进阶', category: 'intermediate' },
    { num: 9, title: 'Agent框架生态', file: '09-agent-frameworks.html', desc: 'LangChain、CrewAI、AutoGen、Anthropic SDK等主流框架深度对比', difficulty: '进阶', category: 'intermediate' },
    { num: 10, title: '评估与测试', file: '10-evaluation-testing.html', desc: 'Agent评估指标、测试方法论、A/B实验和回归测试体系建设', difficulty: '高阶', category: 'advanced' },
    { num: 11, title: '部署与运维', file: '11-deployment-ops.html', desc: '生产架构设计、成本管控、监控告警、CI/CD和扩缩容策略', difficulty: '高阶', category: 'advanced' },
    { num: 12, title: '未来趋势', file: '12-future-trends.html', desc: '多模态Agent、具身智能、自我进化、监管格局和技术预测', difficulty: '前沿', category: 'advanced' },
    { num: 13, title: '构建第一个生产Agent', file: '13-build-first-agent.html', desc: '从环境搭建到部署上线完整实操：SDK安装→工具定义→核心循环→测试→命令行部署', difficulty: '实战', category: 'project' },
    { num: 14, title: '企业集成模式', file: '14-enterprise-integration.html', desc: '数据库/API/消息队列对接、认证授权、容错机制、数据合规与安全审查清单', difficulty: '企业', category: 'enterprise' },
    { num: 15, title: '性能优化', file: '15-performance-optimization.html', desc: 'Token经济学、Prompt缓存、模型分层路由、并行工具调用、成本降低80%实战案例', difficulty: '优化', category: 'optimization' },
    { num: 16, title: '团队协作与面试', file: '16-team-collaboration.html', desc: 'MLOps for Agent、CI/CD、30+设计审查清单、10道高频面试题详解、职业发展路径', difficulty: '职业', category: 'career' }
  ];

  AL.TOOLS = [
    { title: '提示词演练场', file: 'prompt-playground.html', desc: '编写和测试系统提示词，获得实时分析和优化建议', icon: '💬' },
    { title: '工具Schema设计器', file: 'tool-designer.html', desc: '可视化设计工具接口，实时生成JSON Schema配置', icon: '🔧' },
    { title: 'Agent可视化构建器', file: 'agent-builder.html', desc: '分步向导式配置Agent，自动生成部署配置', icon: '🤖' },
    { title: 'API成本计算器', file: 'cost-calculator.html', desc: '估算Agent运行成本，对比不同模型的性价比', icon: '💰' },
    { title: '记忆系统可视化', file: 'memory-viz.html', desc: '交互式演示Agent的三层记忆架构和数据流动', icon: '🧠' }
  ];

  AL.REFERENCES = [
    { title: '完整术语表', file: 'glossary.html', desc: '20+个Agent相关核心术语的详细定义，支持分类筛选和搜索', icon: '📕' },
    { title: '框架全面对比', file: 'framework-comparison.html', desc: '8大主流Agent框架的多维度深度对比和选型决策指南', icon: '📊' },
    { title: '实战案例研究', file: 'case-studies.html', desc: '4个真实场景的Agent实施方案、架构设计和经验教训', icon: '💼' },
    { title: 'API与集成深度指南', file: 'api-integration-deep-dive.html', desc: 'REST/GraphQL/gRPC/SDK/MCP协议/Webhook/OAuth2/流式处理等10大技术深度讲解', icon: '🔌' }
  ];

  // 当前页面上下文（各页面自定义）
  AL.CURRENT_CHAPTER = AL.CURRENT_CHAPTER || null;
  AL.PAGE_BASE = AL.PAGE_BASE || '.';

  // ============ DOM 快捷方法 ============
  AL.$ = (sel, ctx) => (ctx || document).querySelector(sel);
  AL.$$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  // ============ LocalStorage 封装 ============
  AL.Store = {
    _prefix: 'al_',
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(this._prefix + key);
        return raw !== null ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(this._prefix + key, JSON.stringify(value));
      } catch (e) {
        console.warn('LocalStorage write failed:', e);
      }
    },
    remove(key) {
      localStorage.removeItem(this._prefix + key);
    },
    clear() {
      Object.keys(localStorage)
        .filter(k => k.startsWith(this._prefix))
        .forEach(k => localStorage.removeItem(k));
    }
  };

  // ============ Toast 通知 ============
  AL.toast = (function() {
    let container = AL.$('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    return function toast(msg, type = 'info', duration = 3000) {
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.textContent = msg;
      container.appendChild(el);
      setTimeout(() => el.remove(), duration);
    };
  })();

  // ============ 防抖 & 节流 ============
  AL.debounce = (fn, delay = 200) => {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  AL.throttle = (fn, limit = 200) => {
    let inThrottle = false;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
      }
    };
  };

  // ============ HTML 转义 ============
  AL.escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  // ============ 格式化日期 ============
  AL.formatDate = (date) => {
    const d = new Date(date);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // ============ 滚动到元素 ============
  AL.scrollTo = (el, offset = 80) => {
    const top = typeof el === 'string'
      ? AL.$(el)?.getBoundingClientRect().top + window.pageYOffset - offset
      : el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  // ============ 复制到剪贴板 ============
  AL.copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      AL.toast('已复制到剪贴板', 'success');
      return true;
    } catch (e) {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      AL.toast('已复制到剪贴板', 'success');
      return true;
    }
  };

  // ============ 语法高亮（简单版） ============
  AL.highlightCode = function(code, lang = 'python') {
    const patterns = {
      python: [
        [/\b(def|class|import|from|return|if|elif|else|for|while|try|except|raise|with|as|in|not|and|or|is|None|True|False|yield|async|await|pass|break|continue|lambda|global|nonlocal)\b/g, 'token-kw'],
        [/(\".*?\"|\'.*?\')/g, 'token-str'],
        [/\b(\d+\.?\d*)\b/g, 'token-num'],
        [/(#.*$)/gm, 'token-cm'],
        [/\b([a-zA-Z_]\w*)\s*\(/g, 'token-fn'],
        [/\b([A-Z]\w*)\b/g, 'token-cls'],
      ],
      javascript: [
        [/\b(const|let|var|function|return|if|else|for|while|try|catch|class|new|this|async|await|import|export|default|from|of|in|typeof|instanceof|void|delete|throw)\b/g, 'token-kw'],
        [/(\".*?\"|\'.*?\'|`.*?`)/g, 'token-str'],
        [/\b(\d+\.?\d*)\b/g, 'token-num'],
        [/(\/\/.*$)/gm, 'token-cm'],
        [/\b([a-zA-Z_]\w*)\s*\(/g, 'token-fn'],
        [/\b([A-Z]\w*)\b/g, 'token-cls'],
      ]
    };

    const rules = patterns[lang] || patterns.python;
    let html = AL.escapeHtml(code);
    rules.forEach(([regex, cls]) => {
      html = html.replace(regex, (match) => {
        // Don't wrap if already inside a span
        return `<span class="${cls}">${match}</span>`;
      });
    });
    return html;
  };

  // ============ 加载 HTML 片段到元素 ============
  AL.loadComponent = async (url, targetSelector) => {
    try {
      const resp = await fetch(url);
      const html = await resp.text();
      const target = AL.$(targetSelector);
      if (target) target.innerHTML = html;
    } catch (e) {
      console.error(`Failed to load component ${url}:`, e);
    }
  };

  console.log('🧩 AgentLearn core module loaded');

})(AgentLearn);
