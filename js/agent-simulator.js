/**
 * Agent Simulator — Agent 学习平台
 * 交互式 Agent 模拟器，演示 Think-Act-Observe 循环
 */
(function(AL) {
  'use strict';

  let isOpen = false;
  let isTyping = false;
  let messagesContainer, inputEl, sendBtn;

  // 模拟响应库
  const patterns = [
    {
      keywords: ['天气', 'weather', '气温'],
      think: '分析用户意图：查询天气信息。需要调用 get_weather 工具获取实时数据。',
      action: '🔧 [工具调用] get_weather(city="用户提及的城市", include_forecast=true)',
      observe: '📊 [观察结果] {"temp": 22, "condition": "晴", "humidity": "65%", "wind": "3级"}',
      response: '根据查询结果，当前天气晴朗，温度22°C，湿度65%，微风3级。非常适合户外活动！注意，这是 Agent 通过调用天气 API 工具获取的实时数据，而非模型训练数据中的信息。'
    },
    {
      keywords: ['代码', '编程', '写', 'code', '函数', 'function', 'class', 'bug', '调试'],
      think: '用户需要编程帮助。需要分析需求类型（编写、调试、解释），可能需要调用代码搜索或执行工具。',
      action: '🔧 [工具调用] search_code_examples(query=用户需求, language="python") → 找到匹配示例',
      observe: '📊 [观察结果] 检索到 3 个相关代码示例，最佳匹配相似度 0.94',
      response: '我为你准备了代码方案。作为 Agent，我通过 Code Search 工具找到了最佳实践的参考实现，然后根据你的具体需求进行了调整。这就是 Agent 的"工具增强生成"能力。'
    },
    {
      keywords: ['搜索', '查', '找', 'search', '什么是', '什么是', '解释', '介绍'],
      think: '这是一个信息检索任务。需要调用搜索工具获取最新信息，然后进行综合分析和总结。',
      action: '🔧 [工具调用] web_search(query=用户问题, top_k=5) → 获取搜索结果',
      observe: '📊 [观察结果] 搜索返回 5 条相关结果，正在分析信息质量与相关性...',
      response: '我通过搜索工具找到了相关信息并进行了综合分析。注意，这是 Agent 的关键优势：它能主动获取外部信息，而不是仅依赖训练数据中的知识。'
    },
    {
      keywords: ['agent', 'Agent', '智能体', '架构'],
      think: '用户询问 Agent 相关概念。我需要提供准确的定义和解释，同时给出结构化对比。',
      action: '🔧 [工具调用] query_knowledge_base(topic="Agent架构") → 检索知识库',
      observe: '📊 [观察结果] 获取到 Agent 架构相关的核心知识点和最佳实践文档',
      response: 'Agent 的核心架构包含四大组件：模型层（LLM推理引擎）、工具层（可调用的外部功能）、编排层（执行流程控制）和安全层（输入输出防护）。理解这个架构是学习 Agent 的基础。'
    },
    {
      keywords: ['安全', '攻击', '注入', 'prompt injection', '防护'],
      think: '用户关心安全问题。需要解释提示注入攻击原理和常见防护策略。',
      action: '🔧 [工具调用] fetch_security_best_practices(topic="prompt_injection")',
      observe: '📊 [观察结果] 获取到 OWASP Top 10 for LLM 和最新的安全防护指南',
      response: '提示注入是 Agent 安全的首要威胁。关键在于：1) 输入验证和清洗；2) 指令隔离（系统指令与用户输入明确分离）；3) 最小权限原则——Agent 只拥有完成任务所需的最小权限。永远不要给 Agent 超出必要的权限。'
    }
  ];

  const fallback = {
    think: '仔细分析用户的输入，理解其真实意图和需求类型...',
    action: '🔧 [工具选择] 分析任务特征 → 匹配最佳工具组合 → 准备调用参数',
    observe: '📊 [结果收集] 工具执行完成，正在整理和验证返回的数据...',
    response: '我已经处理了你的请求。请留意上面的"思考→行动→观察"过程——这正是 AI Agent 的核心工作模式。每一步都有明确的推理、工具选择和结果验证，确保输出质量。你可以试试问我关于天气、代码、安全或其他话题！'
  };

  function init() {
    const toggleBtn = AL.$('#simToggle');
    const closeBtn = AL.$('#simClose');
    const panel = AL.$('#simPanel');
    messagesContainer = AL.$('#simMessages');
    inputEl = AL.$('#simInput');
    sendBtn = AL.$('#simSend');

    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', toggle);
    if (closeBtn) closeBtn.addEventListener('click', toggle);
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      inputEl.addEventListener('input', () => {
        inputEl.style.height = 'auto';
        inputEl.style.height = Math.min(inputEl.scrollHeight, 80) + 'px';
      });
    }
  }

  function toggle() {
    isOpen = !isOpen;
    const panel = AL.$('#simPanel');
    if (panel) panel.classList.toggle('active', isOpen);
    if (isOpen && inputEl) inputEl.focus();
  }

  async function sendMessage() {
    if (isTyping || !inputEl) return;
    const text = inputEl.value.trim();
    if (!text) return;

    isTyping = true;
    if (sendBtn) sendBtn.disabled = true;

    addMessage('user', text);
    inputEl.value = '';
    inputEl.style.height = 'auto';

    const pattern = patterns.find(p =>
      p.keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))
    ) || fallback;

    await delay(500);
    addMessage('thinking', '💭 <strong>【思考 Thought】</strong><br>' + pattern.think);
    await delay(900);
    addMessage('tool', pattern.action);
    await delay(700);
    addMessage('tool', pattern.observe);
    await delay(600);
    addMessage('agent', pattern.response);

    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    isTyping = false;
    if (sendBtn) sendBtn.disabled = false;
  }

  function addMessage(type, content) {
    if (!messagesContainer) return;
    const div = document.createElement('div');
    div.className = `sim-msg ${type}`;
    div.innerHTML = content;
    messagesContainer.appendChild(div);
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  AL.Simulator = { init, toggle, sendMessage };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(AgentLearn);
