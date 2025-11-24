// stubs/api/service/interviewAI.js
const { getModel } = require('../llm');

const initialGreetings = {
  frontend: "Здравствуйте! Давайте начнем наше собеседование на позицию Frontend-разработчика. Расскажите, пожалуйста, немного о себе и вашем опыте.",
  backend: "Добрый день. Рад приветствовать вас на собеседовании на позицию Backend-разработчика. Для начала, расскажите немного о своем самом интересном проекте.",
  fullstack: "Здравствуйте! Начнем собеседование на позицию Fullstack-разработчика. Расскажите о себе и технологиях, с которыми вы предпочитаете работать.",
};

// Критерии завершения интервью
const COMPLETION_CRITERIA = {
  minExchanges: 8,
  targetScore: 7.0,
  maxExchanges: 25,
  minTopics: 4,
  minDuration: 5 // минут
};

class SuperAiService {
  constructor() {
    this.conversationStates = new Map();
    this.evaluationHistory = new Map();

    // Улучшенные последовательности тем
    this.topicSequences = {
      frontend: [
        'введение',
        'javascript/typescript',
        'react/vue/angular',
        'производительность и оптимизация',
        'архитектура и паттерны',
        'тестирование и качество кода',
        'инструменты и сборка'
      ],
      backend: [
        'введение',
        'базы данных и ORM',
        'API и микросервисы',
        'безопасность и аутентификация',
        'кэширование и производительность',
        'контейнеризация и развертывание',
        'мониторинг и логирование'
      ],
      fullstack: [
        'введение',
        'frontend технологии',
        'backend технологии',
        'интеграция и API дизайн',
        'деплой и DevOps',
        'безопасность полного стека',
        'архитектура и масштабирование'
      ]
    };
  }

  /**
   * Инициализирует сессию с улучшенным приветствием
   */
  initializeSession(sessionId, position) {
    if (!this.conversationStates.has(sessionId)) {
      const greeting = initialGreetings[position] || initialGreetings.frontend;

      this.conversationStates.set(sessionId, {
        position: position,
        conversationHistory: [
          {
            role: 'assistant',
            content: greeting,
            timestamp: new Date()
          }
        ],
        currentTopic: 'введение',
        evaluationHistory: [],
        topicProgress: new Set(['введение']),
        sessionStart: new Date(),
        topicStartTime: new Date(),
        actionsHistory: []
      });

      console.log(`🎯 Initialized enhanced session ${sessionId} for ${position}`);

      return {
        text: greeting,
        metadata: {
          isInitial: true,
          currentTopic: 'введение',
          interviewProgress: this.getInterviewProgress(sessionId)
        }
      };
    }
    return null;
  }

  /**
   * Умный AI response с улучшенной логикой
   */
  async getAIResponse(transcript, position, sessionId) {
    console.log(`🎯 Processing enhanced AI request: session=${sessionId}, position=${position}, transcript="${transcript}"`);

    // Инициализируем состояние диалога
    if (!this.conversationStates.has(sessionId)) {
      this.initializeSession(sessionId, position);
    }

    const state = this.conversationStates.get(sessionId);

    // Добавляем ответ пользователя
    state.conversationHistory.push({
      role: 'user',
      content: transcript,
      timestamp: new Date()
    });

    try {
      // Улучшенная оценка ответа
      const evaluation = this.enhancedEvaluateResponse(transcript, state.currentTopic);

      // Сохраняем оценку
      state.evaluationHistory.push({
        topic: state.currentTopic,
        response: transcript,
        evaluation: evaluation,
        timestamp: new Date().toISOString()
      });

      // УМНОЕ определение следующего действия
      const nextAction = this.determineSmartNextAction(evaluation, state, sessionId);
      state.actionsHistory.push(nextAction);

      // Проверяем автозавершение на основе умной логики
      const completionCheck = this.shouldCompleteInterview(sessionId);
      if (completionCheck.complete) {
        console.log(`🏁 Smart interview completion: ${completionCheck.reason}`);
        const finalReport = await this.generateComprehensiveReport(sessionId);

        return {
          text: this.getSmartCompletionMessage(finalReport),
          metadata: {
            isInterviewComplete: true,
            finalReport: finalReport,
            completionReason: completionCheck.reason,
            wasAutomatic: !completionCheck.userRequested
          }
        };
      }

      // Формируем умный промпт
      const prompt = this.buildSmartPrompt(state, transcript, nextAction);
      console.log(`🤖 Sending smart prompt to LLM (${prompt.length} chars)`);

      // Получаем ответ
      const aiResponse = await this.getLLMResponse(prompt);
      console.log(`✅ LLM Response: ${aiResponse}`);

      // Обновляем состояние на основе следующего действия
      this.applyNextAction(state, nextAction);

      // Добавляем ответ AI
      state.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });

      this.conversationStates.set(sessionId, state);

      return {
        text: aiResponse,
        metadata: {
          evaluation: evaluation,
          nextAction: nextAction,
          currentTopic: state.currentTopic,
          interviewProgress: this.getInterviewProgress(sessionId),
          completionCheck: completionCheck // Добавляем информацию о прогрессе завершения
        }
      };

    } catch (error) {
      console.error('❌ Enhanced AI Error:', error.message);
      const fallbackResponse = this.getSmartFallbackResponse(state);
      return {
        text: fallbackResponse,
        metadata: {
          isFallback: true,
          currentTopic: state.currentTopic,
          error: error.message
        }
      };
    }
  }

  /**
   * Улучшенная система оценки (из EnhancedAiService)
   */
  enhancedEvaluateResponse(response, topic) {
    const responseLength = response.length;
    const technicalTerms = this.countTechnicalTerms(response);
    const hasStructure = this.hasGoodStructure(response);
    const relevanceScore = this.calculateRelevance(response, topic);

    // Более сложные метрики
    const completeness = Math.min(10, responseLength / 25 + (technicalTerms * 0.5));
    const technicalDepth = Math.min(10, technicalTerms * 1.5 + (this.hasCodeExamples(response) ? 2 : 0));
    const structure = hasStructure ? 8 : 5;
    const relevance = Math.min(10, relevanceScore * 2);

    const overallScore = (completeness + technicalDepth + structure + relevance) / 4;

    return {
      completeness: Math.round(completeness * 10) / 10,
      technical_depth: Math.round(technicalDepth * 10) / 10,
      structure: Math.round(structure * 10) / 10,
      relevance: Math.round(relevance * 10) / 10,
      overall_score: Math.round(overallScore * 10) / 10,
      strengths: this.identifyEnhancedStrengths(response),
      improvements: this.suggestSmartImprovements(response, topic),
      topic_mastery: this.determineMasteryLevel(overallScore),
      needs_review: overallScore < 6,
      has_potential: overallScore >= 7 && technicalDepth >= 8,
      response_quality: this.determineResponseQuality(responseLength, technicalTerms)
    };
  }

  /**
   * Умное определение следующего действия (объединенная логика)
   */
  determineSmartNextAction(evaluation, state, sessionId) {
    const { overall_score, needs_review, has_potential, topic_mastery } = evaluation;
    const { evaluationHistory, currentTopic } = state;
    const progress = this.getInterviewProgress(sessionId);

    // Критерии для завершения
    if (overall_score >= 8.5 && evaluationHistory.length >= 6 && progress.topicsCovered.length >= 4) {
      return {
        action: 'complete_interview',
        reason: 'Превосходные результаты по всем ключевым темам',
        confidence: 0.9,
        suggested_topic: null,
        priority: 'high'
      };
    }

    // Критерии для смены темы
    if ((overall_score >= 7.5 && !needs_review) ||
      (topic_mastery === 'advanced' && evaluationHistory.filter(e => e.topic === currentTopic).length >= 2)) {
      const nextTopic = this.getNextTopic(state.position, currentTopic);
      return {
        action: 'next_topic',
        reason: 'Успешное освоение текущей темы',
        confidence: 0.7,
        suggested_topic: nextTopic,
        priority: 'medium'
      };
    }

    // Критерии для углубления в тему
    if (needs_review || (overall_score < 7 && topic_mastery === 'beginner')) {
      return {
        action: 'deep_dive_topic',
        reason: 'Требуется углубленное изучение темы',
        confidence: 0.8,
        suggested_topic: currentTopic,
        priority: 'high'
      };
    }

    // Критерии для проверки потенциала
    if (has_potential && evaluationHistory.length >= 4) {
      return {
        action: 'challenge_candidate',
        reason: 'Кандидат показывает потенциал для более сложных задач',
        confidence: 0.6,
        suggested_topic: currentTopic,
        priority: 'medium'
      };
    }

    // Продолжить текущую тему
    return {
      action: 'continue_topic',
      reason: 'Продолжить изучение текущей темы',
      confidence: 0.5,
      suggested_topic: currentTopic,
      priority: 'low'
    };
  }

  /**
   * Умная проверка завершения интервью
   */
  shouldCompleteInterview(sessionId) {
    const state = this.conversationStates.get(sessionId);
    if (!state) return { complete: false, reason: "Session not found" };

    const progress = this.getInterviewProgress(sessionId);
    const duration = this.calculateDurationMinutes(sessionId);

    // 1. Явный запрос пользователя
    const lastUserMessage = state.conversationHistory
      .filter(msg => msg.role === 'user')
      .pop()?.content.toLowerCase() || '';

    const userCompletionKeywords = ['завершить', 'закончить', 'достаточно', 'хватит', 'закончим', 'все'];
    if (userCompletionKeywords.some(keyword => lastUserMessage.includes(keyword))) {
      return {
        complete: true,
        reason: "Запрос на завершение от пользователя",
        userRequested: true
      };
    }

    // 2. Достигнут максимальный лимит
    if (progress.totalExchanges >= COMPLETION_CRITERIA.maxExchanges) {
      return {
        complete: true,
        reason: `Достигнут максимальный лимит вопросов (${COMPLETION_CRITERIA.maxExchanges})`,
        userRequested: false
      };
    }

    // 3. Отличные результаты
    if (progress.averageScore >= 8.5 && progress.totalExchanges >= COMPLETION_CRITERIA.minExchanges) {
      return {
        complete: true,
        reason: `Превосходные результаты (оценка: ${progress.averageScore})`,
        userRequested: false
      };
    }

    // 4. Хорошие результаты + достаточно тем
    if (progress.averageScore >= COMPLETION_CRITERIA.targetScore &&
      progress.topicsCovered.length >= COMPLETION_CRITERIA.minTopics &&
      progress.totalExchanges >= COMPLETION_CRITERIA.minExchanges) {
      return {
        complete: true,
        reason: `Хорошие результаты по достаточному количеству тем`,
        userRequested: false
      };
    }

    // 5. Минимальная продолжительность + базовые критерии
    if (duration >= COMPLETION_CRITERIA.minDuration &&
      progress.totalExchanges >= COMPLETION_CRITERIA.minExchanges &&
      progress.topicsCovered.length >= 3) {
      return {
        complete: true,
        reason: `Достигнута минимальная продолжительность и охват тем`,
        userRequested: false
      };
    }

    return {
      complete: false,
      reason: `Прогресс: ${progress.totalExchanges}/25 вопросов, ${progress.averageScore} балл, ${progress.topicsCovered.length} тем, ${duration} мин.`,
      userRequested: false
    };
  }

  /**
   * Умный промпт с контекстом действий
   */
  buildSmartPrompt(state, userInput, nextAction) {
    const { position, conversationHistory, currentTopic } = state;

    const actionInstructions = {
      'continue_topic': 'Продолжи исследование текущей темы, задавая уточняющие вопросы',
      'next_topic': 'Плавно перейди к следующей теме, связав ее с предыдущими ответами',
      'deep_dive_topic': 'Задай более глубокие технические вопросы по текущей теме',
      'challenge_candidate': 'Задай сложный вопрос чтобы проверить границы знаний кандидата',
      'complete_interview': 'Вежливо заверши интервью и поблагодари кандидата'
    };

    let conversationContext = `Ты - опытный IT-интервьюер для позиции ${position}. 
Текущая тема: ${currentTopic}
Следующее действие: ${nextAction.action}
Инструкция: ${actionInstructions[nextAction.action]}

КРИТЕРИИ ОЦЕНКИ:
- Полнота (0-10): детализация и полнота ответа
- Техническая глубина (0-10): знание технологий и best practices
- Структурированность (0-10): логика и ясность изложения
- Релевантность (0-10): соответствие вопросу и теме

ТВОЯ ЗАДАЧА:
1. Анализируй ответы по всем критериям
2. Адаптируй сложность вопросов под уровень кандидата
3. Следуй плану следующего действия
4. Поддерживай естественную беседу
5. Будь профессиональным но дружелюбным

ИСТОРИЯ ДИАЛОГА:`;

    // Добавляем только последние 6 сообщений для экономии токенов
    const recentHistory = conversationHistory.slice(-6);
    recentHistory.forEach((message) => {
      const role = message.role === 'user' ? 'КАНДИДАТ' : 'ИНТЕРВЬЮЕР';
      conversationContext += `\n${role}: ${message.content}`;
    });

    conversationContext += `\n\nКАНДИДАТ: ${userInput}`;
    conversationContext += `\n\nИНТЕРВЬЮЕР (следуя инструкции "${actionInstructions[nextAction.action]}"):`;

    return conversationContext;
  }

  /**
   * Применяем следующее действие к состоянию
   */
  applyNextAction(state, nextAction) {
    if (nextAction.action === 'next_topic' && nextAction.suggested_topic) {
      const oldTopic = state.currentTopic;
      state.currentTopic = nextAction.suggested_topic;
      state.topicProgress.add(state.currentTopic);
      state.topicStartTime = new Date();
      console.log(`🔄 Smart topic change: ${oldTopic} → ${state.currentTopic}`);
    }

    // Для deep_dive и challenge обновляем время начала темы
    if (nextAction.action === 'deep_dive_topic' || nextAction.action === 'challenge_candidate') {
      state.topicStartTime = new Date();
    }
  }

  /**
   * Улучшенный финальный отчет
   */
  async generateComprehensiveReport(sessionId) {
    const state = this.conversationStates.get(sessionId);
    if (!state) throw new Error('Session not found');

    const progress = this.getInterviewProgress(sessionId);
    const duration = this.calculateDurationMinutes(sessionId);

    // Анализируем действия и прогресс
    const actionAnalysis = this.analyzeActions(state.actionsHistory);
    const topicAnalysis = this.analyzeTopicPerformance(state.evaluationHistory);

    // Определяем уровень и рекомендацию
    const { level, recommendation, confidence } = this.determineHireDecision(progress, topicAnalysis);

    const report = {
      overall_assessment: {
        final_score: progress.averageScore,
        level: level,
        recommendation: recommendation,
        confidence: confidence,
        strengths: this.aggregateEnhancedStrengths(state.evaluationHistory),
        improvements: this.aggregateSmartImprovements(state.evaluationHistory),
        potential_areas: this.identifyPotentialAreas(topicAnalysis)
      },
      technical_skills: {
        topics_covered: progress.topicsCovered,
        strong_areas: topicAnalysis.strongTopics,
        weak_areas: topicAnalysis.weakTopics,
        technical_depth: topicAnalysis.averageTechnicalDepth,
        recommendations: this.generateTechnicalRecommendations(topicAnalysis)
      },
      behavioral_analysis: {
        communication_skills: this.assessCommunicationSkills(state.conversationHistory),
        problem_solving: this.assessProblemSolving(state.evaluationHistory),
        learning_ability: this.assessLearningAbility(state.actionsHistory),
        adaptability: this.assessAdaptability(state.evaluationHistory)
      },
      interview_analytics: {
        total_duration: `${duration} минут`,
        total_questions: progress.totalExchanges,
        topics_covered_count: progress.topicsCovered.length,
        average_response_quality: progress.averageScore,
        topic_progression: Array.from(state.topicProgress),
        action_pattern: actionAnalysis
      },
      detailed_feedback: this.generateDetailedFeedback(progress, level, topicAnalysis),
      next_steps: this.generateSmartNextSteps(recommendation, level),
      raw_data: {
        evaluationHistory: state.evaluationHistory,
        actionsHistory: state.actionsHistory
      }
    };

    // Сохраняем отчет и очищаем сессию
    this.evaluationHistory.set(sessionId, report);
    this.conversationStates.delete(sessionId);

    console.log(`📊 Generated comprehensive report for ${sessionId}: ${level} (${progress.averageScore})`);
    return report;
  }

  /**
   * Умное сообщение при завершении
   */
  getSmartCompletionMessage(finalReport) {
    const score = finalReport.overall_assessment.final_score;
    const level = finalReport.overall_assessment.level;
    const duration = finalReport.interview_analytics.total_duration;

    return `Благодарю вас за участие в собеседовании! Мы обсудили ${finalReport.interview_analytics.topics_covered_count} ключевых тем за ${duration}. Ваш общий уровень: ${level} (оценка: ${score.toFixed(1)}/10). Подробный отчет с рекомендациями будет показан далее.`;
  }

  // ДОПОЛНИТЕЛЬНЫЕ УЛУЧШЕННЫЕ МЕТОДЫ

  calculateRelevance(response, topic) {
    const topicKeywords = {
      'javascript': ['javascript', 'js', 'ecmascript', 'es6', 'async', 'promise'],
      'react': ['react', 'component', 'hook', 'state', 'props', 'virtual dom'],
      'базы данных': ['sql', 'nosql', 'mongodb', 'postgresql', 'index', 'transaction'],
      'api': ['api', 'rest', 'graphql', 'endpoint', 'http', 'json'],
      'безопасность': ['security', 'auth', 'jwt', 'oauth', 'xss', 'csrf', 'sql injection']
    };

    const keywords = topicKeywords[topic] || [];
    const matches = keywords.filter(keyword =>
      response.toLowerCase().includes(keyword.toLowerCase())
    ).length;

    return matches / Math.max(keywords.length, 1);
  }

  hasCodeExamples(response) {
    const codeIndicators = ['функция', 'метод', 'класс', 'цикл', 'if', 'for', 'while', 'const ', 'let ', 'var '];
    return codeIndicators.some(indicator => response.includes(indicator));
  }

  identifyEnhancedStrengths(response) {
    const strengths = [];
    if (response.length > 150) strengths.push('Детализированный и полный ответ');
    if (this.countTechnicalTerms(response) > 3) strengths.push('Отличное знание технологий');
    if (this.hasGoodStructure(response)) strengths.push('Структурированное и логичное изложение');
    if (this.hasCodeExamples(response)) strengths.push('Практический подход с примерами');
    if (response.includes('best practice') || response.includes('лучш')) strengths.push('Знание best practices');
    return strengths.length > 0 ? strengths : ['Ответ соответствует базовым требованиям'];
  }

  suggestSmartImprovements(response, topic) {
    const improvements = [];
    if (response.length < 80) improvements.push('Рекомендуется давать более развернутые ответы');
    if (this.countTechnicalTerms(response) < 2) improvements.push(`Упоминайте конкретные технологии по теме ${topic}`);
    if (!this.hasGoodStructure(response)) improvements.push('Используйте структуру: проблема-решение-результат');
    if (!this.hasCodeExamples(response)) improvements.push('Подкрепляйте ответы практическими примерами');
    return improvements.length > 0 ? improvements : ['Продолжайте углублять знания по текущим темам'];
  }

  determineResponseQuality(length, technicalTerms) {
    if (length > 200 && technicalTerms > 4) return 'excellent';
    if (length > 100 && technicalTerms > 2) return 'good';
    if (length > 50 && technicalTerms > 1) return 'satisfactory';
    return 'needs_improvement';
  }

  analyzeActions(actionsHistory) {
    const actionCounts = {};
    actionsHistory.forEach(action => {
      actionCounts[action.action] = (actionCounts[action.action] || 0) + 1;
    });

    return {
      total_actions: actionsHistory.length,
      action_breakdown: actionCounts,
      most_common_action: Object.keys(actionCounts).reduce((a, b) => actionCounts[a] > actionCounts[b] ? a : b),
      completion_rate: actionsHistory.filter(a => a.action === 'complete_interview').length > 0 ? 'completed' : 'not_completed'
    };
  }

  analyzeTopicPerformance(evaluationHistory) {
    const topicScores = {};
    evaluationHistory.forEach(evalItem => {
      if (!topicScores[evalItem.topic]) {
        topicScores[evalItem.topic] = { scores: [], technicalDepths: [] };
      }
      topicScores[evalItem.topic].scores.push(evalItem.evaluation.overall_score);
      topicScores[evalItem.topic].technicalDepths.push(evalItem.evaluation.technical_depth);
    });

    const topicAnalysis = {};
    Object.keys(topicScores).forEach(topic => {
      const scores = topicScores[topic].scores;
      const techDepths = topicScores[topic].technicalDepths;
      topicAnalysis[topic] = {
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        averageTechnicalDepth: techDepths.reduce((a, b) => a + b, 0) / techDepths.length,
        responseCount: scores.length
      };
    });

    const strongTopics = Object.keys(topicAnalysis)
      .filter(topic => topicAnalysis[topic].averageScore >= 7.5)
      .slice(0, 3);

    const weakTopics = Object.keys(topicAnalysis)
      .filter(topic => topicAnalysis[topic].averageScore < 6)
      .slice(0, 3);

    return {
      topicAnalysis,
      strongTopics,
      weakTopics,
      averageTechnicalDepth: Object.values(topicAnalysis).reduce((sum, t) => sum + t.averageTechnicalDepth, 0) / Object.keys(topicAnalysis).length
    };
  }

  determineHireDecision(progress, topicAnalysis) {
    const { averageScore } = progress;
    const { strongTopics, weakTopics } = topicAnalysis;

    if (averageScore >= 8.5 && strongTopics.length >= 3 && weakTopics.length === 0) {
      return { level: "Senior", recommendation: "strong_hire", confidence: 0.9 };
    } else if (averageScore >= 7.5 && strongTopics.length >= 2 && weakTopics.length <= 1) {
      return { level: "Middle+", recommendation: "hire", confidence: 0.8 };
    } else if (averageScore >= 7.0 && strongTopics.length >= 1) {
      return { level: "Middle", recommendation: "hire", confidence: 0.7 };
    } else if (averageScore >= 6.0) {
      return { level: "Junior+", recommendation: "maybe_hire", confidence: 0.6 };
    } else if (averageScore >= 5.0) {
      return { level: "Junior", recommendation: "maybe_hire", confidence: 0.5 };
    } else {
      return { level: "Trainee", recommendation: "no_hire", confidence: 0.4 };
    }
  }

  // ... остальные улучшенные методы (getNextTopic, assessCommunicationSkills, и т.д.)

  getSmartFallbackResponse(state) {
    const { currentTopic } = state;

    const topicQuestions = {
      'javascript': "Расскажите о вашем опыте работы с асинхронным JavaScript?",
      'react': "Как вы управляете состоянием в больших React приложениях?",
      'базы данных': "Как вы оптимизируете запросы к базе данных?",
      'api': "Какие принципы REST API вы считаете наиболее важными?",
      'введение': "Расскажите о вашем самом интересном проекте и вашей роли в нем?"
    };

    return topicQuestions[currentTopic] ||
      "Расскажите подробнее о вашем опыте в этом направлении?";
  }

  // Сохраняем базовые методы из предыдущих версий
  getInterviewProgress(sessionId) {
    const state = this.conversationStates.get(sessionId);
    if (!state) return null;

    const evaluations = state.evaluationHistory;
    const totalExchanges = evaluations.length;
    const averageScore = evaluations.reduce((sum, item) => sum + item.evaluation.overall_score, 0) / totalExchanges || 0;

    const topicsCovered = Array.from(state.topicProgress || new Set(['введение']));

    const weakAreas = evaluations
      .filter(item => item.evaluation.overall_score < 6)
      .slice(0, 3)
      .map(item => ({
        topic: item.topic,
        score: item.evaluation.overall_score,
        improvements: item.evaluation.improvements || ['Требуется больше практики']
      }));

    return {
      totalExchanges,
      averageScore: Math.round(averageScore * 10) / 10,
      topicsCovered: topicsCovered,
      weakAreas: weakAreas,
      completionPercentage: Math.min(100, (totalExchanges / COMPLETION_CRITERIA.maxExchanges) * 100)
    };
  }

  calculateDurationMinutes(sessionId) {
    const state = this.conversationStates.get(sessionId);
    if (!state || !state.sessionStart) return 0;

    const start = new Date(state.sessionStart);
    const end = new Date();
    return Math.round((end - start) / 60000);
  }

  getNextTopic(position, currentTopic) {
    const sequence = this.topicSequences[position] || this.topicSequences.frontend;
    const currentIndex = sequence.indexOf(currentTopic);
    return currentIndex < sequence.length - 1 ? sequence[currentIndex + 1] : 'завершение';
  }

  // Базовые методы оценки
  countTechnicalTerms(response) {
    const techTerms = ['javascript', 'react', 'vue', 'angular', 'node', 'python', 'java', 'sql', 'nosql',
      'api', 'rest', 'graphql', 'docker', 'kubernetes', 'aws', 'git', 'html', 'css',
      'typescript', 'webpack', 'babel', 'redux', 'context', 'hooks', 'state', 'props',
      'microservice', 'middleware', 'database', 'orm', 'authentication', 'authorization'];
    return techTerms.filter(term => response.toLowerCase().includes(term)).length;
  }

  hasGoodStructure(response) {
    return response.length > 50 && (response.includes(',') || response.includes(';') ||
      response.includes('во-первых') || response.includes('во-вторых') ||
      response.includes('например') || response.includes('таким образом'));
  }

  determineMasteryLevel(score) {
    if (score >= 8) return 'advanced';
    if (score >= 6.5) return 'intermediate';
    if (score >= 5) return 'beginner';
    return 'novice';
  }

  async getLLMResponse(prompt) {
    try {
      const llm = getModel({
        provider: 'gigachat',
        model: 'GigaChat-2-Max',
        streaming: false,
        temperature: 0.7
      });

      const response = await llm.invoke(prompt);
      return response.content.trim();
    } catch (error) {
      console.error('LLM Error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Агрегирует улучшенные сильные стороны из истории оценок
   */
  aggregateEnhancedStrengths(evaluations) {
    const allStrengths = evaluations.flatMap(item => item.evaluation.strengths);
    const strengthCount = {};

    allStrengths.forEach(strength => {
      strengthCount[strength] = (strengthCount[strength] || 0) + 1;
    });

    // Сортируем по частоте и выбираем топ-5
    return Object.entries(strengthCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([strength, count]) => ({
        strength: strength,
        frequency: count,
        confidence: Math.min(1, count / evaluations.length)
      }));
  }

  /**
   * Агрегирует умные рекомендации по улучшению
   */
  aggregateSmartImprovements(evaluations) {
    const allImprovements = evaluations.flatMap(item => item.evaluation.improvements);
    const improvementCount = {};

    allImprovements.forEach(improvement => {
      improvementCount[improvement] = (improvementCount[improvement] || 0) + 1;
    });

    // Группируем по категориям улучшений
    const categorized = {
      technical: [],
      communication: [],
      depth: [],
      structure: []
    };

    Object.entries(improvementCount).forEach(([improvement, count]) => {
      if (improvement.includes('технолог') || improvement.includes('практик') || improvement.includes('пример')) {
        categorized.technical.push({ improvement, count });
      } else if (improvement.includes('детал') || improvement.includes('развернут') || improvement.includes('подробн')) {
        categorized.depth.push({ improvement, count });
      } else if (improvement.includes('структур') || improvement.includes('логик') || improvement.includes('изложен')) {
        categorized.structure.push({ improvement, count });
      } else {
        categorized.communication.push({ improvement, count });
      }
    });

    // Выбираем по одному улучшению из каждой категории
    const recommendations = [];
    Object.values(categorized).forEach(category => {
      if (category.length > 0) {
        const top = category.sort((a, b) => b.count - a.count)[0];
        recommendations.push(top.improvement);
      }
    });

    return recommendations.slice(0, 3);
  }

  /**
   * Определяет перспективные области для развития
   */
  identifyPotentialAreas(topicAnalysis) {
    const potentialAreas = [];
    const { topicAnalysis: topics } = topicAnalysis;

    Object.entries(topics).forEach(([topic, data]) => {
      // Области с хорошим баллом, но не максимальным техническим углублением
      if (data.averageScore >= 7 && data.averageTechnicalDepth < 8) {
        potentialAreas.push({
          topic: topic,
          reason: 'Хорошее понимание с потенциалом для углубления технических знаний',
          current_depth: data.averageTechnicalDepth,
          potential: 'high'
        });
      }

      // Области с ростом в течение собеседования
      if (data.responseCount >= 2) {
        const firstScore = topics[topic].scores[0];
        const lastScore = topics[topic].scores[topics[topic].scores.length - 1];
        if (lastScore > firstScore + 1) {
          potentialAreas.push({
            topic: topic,
            reason: 'Заметный прогресс в ходе собеседования',
            improvement: `Рост с ${firstScore.toFixed(1)} до ${lastScore.toFixed(1)}`,
            potential: 'medium'
          });
        }
      }
    });

    return potentialAreas.slice(0, 3);
  }

  /**
   * Генерирует технические рекомендации на основе анализа тем
   */
  generateTechnicalRecommendations(topicAnalysis) {
    const recommendations = [];
    const { weakTopics, averageTechnicalDepth } = topicAnalysis;

    // Рекомендации по слабым темам
    weakTopics.forEach(topic => {
      const topicData = topicAnalysis.topicAnalysis[topic];
      if (topicData.averageScore < 6) {
        recommendations.push(`Интенсивное изучение темы "${topic}" - текущий балл: ${topicData.averageScore.toFixed(1)}`);
      }
    });

    // Рекомендации по технической глубине
    if (averageTechnicalDepth < 7) {
      recommendations.push("Углубить практические знания технологий через реальные проекты");
    }

    // Общие рекомендации
    recommendations.push(
      "Практиковаться в решении алгоритмических задач",
      "Изучить best practices и паттерны проектирования",
      "Участвовать в code review и открытых проектах"
    );

    return recommendations.slice(0, 4);
  }

  /**
   * Оценивает коммуникативные навыки на основе истории диалога
   */
  assessCommunicationSkills(conversationHistory) {
    const userMessages = conversationHistory.filter(msg => msg.role === 'user');

    if (userMessages.length === 0) return { score: 5, feedback: "Недостаточно данных для оценки" };

    let totalLength = 0;
    let structureScore = 0;
    let clarityIndicators = 0;

    userMessages.forEach(message => {
      const content = message.content;
      totalLength += content.length;

      // Оценка структурированности
      if (content.length > 100) structureScore += 2;
      if (content.includes('во-первых') || content.includes('во-вторых') || content.includes('например')) {
        structureScore += 3;
      }

      // Индикаторы ясности
      if (content.includes('то есть') || content.includes('другими словами') || content.includes('например')) {
        clarityIndicators += 2;
      }
    });

    const avgLength = totalLength / userMessages.length;
    const structure = Math.min(10, structureScore / userMessages.length);
    const clarity = Math.min(10, clarityIndicators / userMessages.length * 2);
    const overall = (structure + clarity + Math.min(10, avgLength / 30)) / 3;

    return {
      score: Math.round(overall * 10) / 10,
      structure: Math.round(structure * 10) / 10,
      clarity: Math.round(clarity * 10) / 10,
      feedback: this.getCommunicationFeedback(overall)
    };
  }

  /**
   * Генерирует фидбек по коммуникативным навыкам
   */
  getCommunicationFeedback(score) {
    if (score >= 8) return "Отличные коммуникативные навыки, ясное и структурированное изложение мыслей";
    if (score >= 6) return "Хорошие коммуникативные навыки, иногда требуется больше структуры в ответах";
    if (score >= 4) return "Базовые коммуникативные навыки, рекомендуется работать над ясностью изложения";
    return "Требуется развитие коммуникативных навыков, рекомендуется тренировать структурированные ответы";
  }

  /**
   * Оценивает навыки решения проблем
   */
  assessProblemSolving(evaluationHistory) {
    const problemSolvingIndicators = evaluationHistory.filter(evalItem => {
      const response = evalItem.response.toLowerCase();
      return response.includes('решил') ||
        response.includes('проблем') ||
        response.includes('исправил') ||
        response.includes('оптимизировал') ||
        response.includes('улучшил') ||
        (response.includes('сделал') && response.includes('потому что'));
    }).length;

    const score = Math.min(10, problemSolvingIndicators / evaluationHistory.length * 20);

    return {
      score: Math.round(score * 10) / 10,
      examples_count: problemSolvingIndicators,
      feedback: this.getProblemSolvingFeedback(score)
    };
  }

  getProblemSolvingFeedback(score) {
    if (score >= 8) return "Сильные навыки решения проблем, демонстрирует системный подход";
    if (score >= 6) return "Хорошие навыки решения проблем, может объяснить свои решения";
    if (score >= 4) return "Базовые навыки решения проблем, рекомендуется больше внимания на анализ причин";
    return "Требуется развитие навыков решения проблем, рекомендуется практиковать анализ и решение технических задач";
  }

  /**
   * Оценивает способность к обучению
   */
  assessLearningAbility(actionsHistory) {
    const learningIndicators = actionsHistory.filter(action =>
      action.action === 'next_topic' && action.confidence >= 0.7
    ).length;

    const totalTopicChanges = actionsHistory.filter(action =>
      action.action === 'next_topic' || action.action === 'deep_dive_topic'
    ).length;

    const score = totalTopicChanges > 0 ?
      Math.min(10, (learningIndicators / totalTopicChanges) * 10) : 5;

    return {
      score: Math.round(score * 10) / 10,
      topics_mastered: learningIndicators,
      feedback: this.getLearningAbilityFeedback(score)
    };
  }

  getLearningAbilityFeedback(score) {
    if (score >= 8) return "Высокая скорость обучения, быстро осваивает новые темы";
    if (score >= 6) return "Хорошая способность к обучению, демонстрирует прогресс в новых темах";
    if (score >= 4) return "Умеренная способность к обучению, требуется время для освоения новых тем";
    return "Рекомендуется развивать навыки быстрого обучения и адаптации к новым технологиям";
  }

  /**
   * Оценивает адаптивность
   */
  assessAdaptability(evaluationHistory) {
    if (evaluationHistory.length < 3) {
      return { score: 5, feedback: "Недостаточно данных для оценки адаптивности" };
    }

    const scores = evaluationHistory.map(item => item.evaluation.overall_score);
    const variance = this.calculateVariance(scores);
    const trend = this.calculateTrend(scores);

    // Низкая дисперсия и положительный тренд - хорошая адаптивность
    let adaptabilityScore = 5;
    if (variance < 2 && trend > 0.1) adaptabilityScore = 8;
    else if (variance < 3 && trend > 0) adaptabilityScore = 7;
    else if (variance < 4) adaptabilityScore = 6;
    else if (variance > 5) adaptabilityScore = 4;

    return {
      score: adaptabilityScore,
      consistency: Math.max(1, 10 - variance), // Обратная зависимость от дисперсии
      trend: trend,
      feedback: this.getAdaptabilityFeedback(adaptabilityScore, trend)
    };
  }

  /**
   * Вычисляет дисперсию оценок
   */
  calculateVariance(scores) {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.round(variance * 10) / 10;
  }

  /**
   * Вычисляет тренд оценок (положительный/отрицательный)
   */
  calculateTrend(scores) {
    if (scores.length < 2) return 0;

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    return Math.round((secondAvg - firstAvg) * 10) / 10;
  }

  getAdaptabilityFeedback(score, trend) {
    if (score >= 8 && trend > 0) return "Высокая адаптивность, отличная способность улучшать ответы в ходе собеседования";
    if (score >= 6 && trend > 0) return "Хорошая адаптивность, демонстрирует прогресс в ходе обсуждения";
    if (score >= 6) return "Стабильная производительность, хорошо адаптируется к вопросам";
    return "Рекомендуется работать над адаптивностью и умением быстро подстраиваться под новые вопросы";
  }

  /**
   * Генерирует детализированный фидбек
   */
  generateDetailedFeedback(progress, level, topicAnalysis) {
    const { averageScore, totalExchanges, topicsCovered } = progress;
    const { strongTopics, weakTopics } = topicAnalysis;

    let feedback = `За ${totalExchanges} вопросов по ${topicsCovered.length} темам кандидат показал уровень ${level} `;
    feedback += `с общей оценкой ${averageScore.toFixed(1)}/10. `;

    if (strongTopics.length > 0) {
      feedback += `Особенно сильные знания продемонстрированы в темах: ${strongTopics.join(', ')}. `;
    }

    if (weakTopics.length > 0) {
      feedback += `Требуют внимания темы: ${weakTopics.join(', ')}. `;
    }

    if (averageScore >= 8) {
      feedback += "Кандидат демонстрирует глубокие технические знания и отличные коммуникативные навыки. Рекомендован к найму на соответствующий уровень.";
    } else if (averageScore >= 6.5) {
      feedback += "Кандидат обладает хорошей технической базой и потенциалом для роста. Рекомендован к найму с учетом плана развития.";
    } else if (averageScore >= 5) {
      feedback += "Кандидат показывает базовое понимание технологий. Рекомендуется рассмотреть на junior позицию с наставничеством.";
    } else {
      feedback += "Кандидату требуется дополнительная подготовка. Рекомендуется пройти обучение и рассмотреть повторно через 3-6 месяцев.";
    }

    return feedback;
  }

  /**
   * Генерирует умные следующие шаги
   */
  generateSmartNextSteps(recommendation, level) {
    const nextSteps = {
      strong_hire: [
        "Пригласить на техническое интервью с тимлидом",
        "Обсудить ожидания по зарплате и условиям",
        "Назначить встречу с HR для обсуждения оффера"
      ],
      hire: [
        "Провести дополнительное интервью с фокусом на слабые темы",
        "Оценить культурное соответствие команде",
        "Обсудить план развития на первые 3 месяца"
      ],
      maybe_hire: [
        "Рассмотреть на junior позицию с испытательным сроком",
        "Предложить тестовое задание для проверки практических навыков",
        "Назначить встречу с ментором для обсуждения плана развития"
      ],
      no_hire: [
        "Предоставить детализированный фидбек с рекомендациями по улучшению",
        "Предложить пройти курсы по слабым темам",
        "Предложить связаться повторно через 3-6 месяцев после подготовки"
      ]
    };

    const steps = nextSteps[recommendation] || [
      "Требуется дополнительная оценка",
      "Провести повторное собеседование через 2 недели"
    ];

    // Добавляем уровень-специфичные шаги
    if (level.includes('Senior')) {
      steps.push("Обсудить опыт руководства и менторства");
    } else if (level.includes('Middle')) {
      steps.push("Оценить готовность к самостоятельной работе");
    } else if (level.includes('Junior')) {
      steps.push("Разработать план обучения и наставничества");
    }

    return steps.slice(0, 3);
  }
}

module.exports = new SuperAiService();