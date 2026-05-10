/**
 * Quiz Engine — Agent 学习平台
 * 测验系统引擎
 */
(function(AL) {
  'use strict';

  // 正确答案映射：{ chapterNum: { questionNum: correctAnswerIndex } }
  const answerKey = {
    1: { 1: 1, 2: 2, 3: 0 },
    2: { 1: 0, 2: 2, 3: 1 },
    3: { 1: 1, 2: 2, 3: 0 },
    4: { 1: 2, 2: 1, 3: 1 },
    5: { 1: 0, 2: 1, 3: 2 },
    6: { 1: 2, 2: 1, 3: 0 },
    7: { 1: 1, 2: 1, 3: 2 },
    8: { 1: 1, 2: 1, 3: 0 },
    9: { 1: 2, 2: 1, 3: 0 },
    10: { 1: 1, 2: 0, 3: 1 },
    11: { 1: 0, 2: 2, 3: 1 },
    12: { 1: 1, 2: 2, 3: 0 },
    13: { 1: 1, 2: 0, 3: 2 },
    14: { 1: 2, 2: 0, 3: 1 },
    15: { 1: 0, 2: 2, 3: 1 },
    16: { 1: 2, 2: 1, 3: 0 }
  };

  function init() {
    // 委托事件：选项点击
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('quiz-option') && !e.target.dataset.disabled) {
        handleOptionClick(e.target);
      }
      if (e.target.classList.contains('quiz-submit')) {
        handleSubmit(e.target);
      }
      if (e.target.classList.contains('quiz-retry')) {
        handleRetry(e.target);
      }
    });
  }

  function handleOptionClick(opt) {
    const question = opt.closest('.quiz-question');
    question.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
  }

  function handleSubmit(btn) {
    const section = btn.closest('.quiz-section');
    const chapterNum = parseInt(section.dataset.quiz);
    const questions = section.querySelectorAll('.quiz-question');
    const resultDiv = section.querySelector('.quiz-result');
    const key = answerKey[chapterNum];

    if (!key) { AL.toast('题库未找到', 'error'); return; }

    let correct = 0;
    let total = 0;
    let allAnswered = true;

    questions.forEach(q => {
      const qNum = parseInt(q.dataset.q);
      const selected = q.querySelector('.quiz-option.selected');
      const correctIdx = key[qNum];

      if (!selected) { allAnswered = false; return; }

      total++;
      const userAnswer = parseInt(selected.dataset.answer);

      q.querySelectorAll('.quiz-option').forEach(opt => {
        const ansIdx = parseInt(opt.dataset.answer);
        if (ansIdx === correctIdx) opt.classList.add('correct');
        if (opt === selected && userAnswer !== correctIdx) opt.classList.add('incorrect');
        opt.dataset.disabled = '1';
        opt.style.pointerEvents = 'none';
      });

      if (userAnswer === correctIdx) correct++;
    });

    if (!allAnswered) {
      AL.toast('请回答所有问题后再提交', 'error');
      return;
    }

    const score = Math.round((correct / total) * 100);
    resultDiv.classList.add('show');

    if (score === 100) {
      resultDiv.className = 'quiz-result show perfect';
      resultDiv.textContent = `🎉 完美！答对 ${correct}/${total} 题 (${score}分)`;
      AL.Progress.markQuizComplete(chapterNum);
    } else if (score >= 50) {
      resultDiv.className = 'quiz-result show good';
      resultDiv.textContent = `👍 不错！答对 ${correct}/${total} 题 (${score}分)。可重新答题。`;
    } else {
      resultDiv.className = 'quiz-result show poor';
      resultDiv.textContent = `📚 答对 ${correct}/${total} 题 (${score}分)。建议重新学习本章。`;
    }

    btn.disabled = true;

    if (score < 100) {
      const retryBtn = document.createElement('button');
      retryBtn.textContent = '🔄 重新答题';
      retryBtn.className = 'btn quiz-retry';
      retryBtn.style.marginLeft = '12px';
      btn.parentNode.appendChild(retryBtn);
    }
  }

  function handleRetry(btn) {
    const section = btn.closest('.quiz-section');
    section.querySelectorAll('.quiz-option').forEach(opt => {
      opt.classList.remove('correct', 'incorrect', 'selected');
      opt.dataset.disabled = '';
      opt.style.pointerEvents = 'auto';
    });
    const resultDiv = section.querySelector('.quiz-result');
    resultDiv.className = 'quiz-result';
    resultDiv.textContent = '';
    const submitBtn = section.querySelector('.quiz-submit');
    if (submitBtn) submitBtn.disabled = false;
    btn.remove();
  }

  // Public API
  AL.Quiz = { init, answerKey };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(AgentLearn);
