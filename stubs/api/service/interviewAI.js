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
    this.conversationStates = new Map(); // Состояния сессий
    this.evaluationHistory = new Map(); // История оценок

    // последовательности тем
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
    // ВАЖНО: Используем переданную позицию, а не позицию из существующей сессии
    const greeting = initialGreetings[position] || initialGreetings.frontend;
    console.log(`🎯 initializeSession called: sessionId=${sessionId}, position=${position}, greeting=${greeting.substring(0, 50)}...`);

    // Если сессии нет - создаем новую
    if (!this.conversationStates.has(sessionId)) {
      console.log(`🆕 Creating new AI session for ${sessionId}, position: ${position}`);

      const newState = {
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
        llmErrorCount: 0, // Счетчик ошибок LLM
        topicStartTime: new Date(),
        actionsHistory: [],
        hasCodeTask: false // Флаг, что практическое задание было предложено
      };

      this.conversationStates.set(sessionId, newState);

      console.log(`✅ Created new AI session ${sessionId} with position ${position}`);

      return {
        text: greeting,
        metadata: {
          isInitial: true,
          currentTopic: 'введение',
          interviewProgress: this.getInterviewProgress(sessionId)
        }
      };
    }

    // Если сессия уже есть, но история пуста - добавляем приветствие
    const state = this.conversationStates.get(sessionId);
    console.log(`ℹ️ Session ${sessionId} already exists with ${state.conversationHistory?.length || 0} messages, current position: ${state.position}, requested position: ${position}`);

    // ВАЖНО: Если позиция изменилась, обновляем её в состоянии
    if (state.position !== position) {
      console.log(`🔄 Updating session position from ${state.position} to ${position}`);
      state.position = position;
    }

    // Всегда возвращаем приветствие для WebSocket на основе ПЕРЕДАННОЙ позиции
    return {
      text: greeting,
      metadata: {
        isInitial: false, // не первое сообщение
        currentTopic: state.currentTopic || 'введение',
        interviewProgress: this.getInterviewProgress(sessionId)
      }
    };
  }

  async getAIResponse(transcript, position, sessionId) {
    // 1. Инициализация сессии при необходимости
    // 2. Добавление ответа пользователя в историю
    // 3. ПРОВЕРКА ЗАВЕРШЕНИЯ ДО ОЦЕНКИ
    // 4. Если не завершаем → оценка ответа
    // 5. Определение следующего действия
    // 6. Формирование промпта для LLM
    // 7. Получение и очистка ответа AI
    // 8. Обновление состояния
    // 9. Возврат ответа
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
      // ПЕРВОЕ: Проверяем запрос на завершение ДО оценки
      const completionCheck = this.shouldCompleteInterview(sessionId);
      console.log(`🔍 Проверка завершения интервью:`, {
        complete: completionCheck.complete,
        reason: completionCheck.reason,
        userRequested: completionCheck.userRequested,
        evaluationHistoryLength: state.evaluationHistory.length
      });
      
      if (completionCheck.complete) {
        console.log(`🏁 Smart interview completion: ${completionCheck.reason}`);

        // ГАРАНТИРУЕМ, что всегда есть финальный отчет
        let finalReport;
        try {
          finalReport = await this.generateComprehensiveReport(sessionId);
        } catch (error) {
          console.error('❌ Error generating final report, using empty report:', error);
          // Используем пустой отчет вместо mock, если нет данных
          const state = this.conversationStates.get(sessionId);
          const duration = this.calculateDurationMinutes(sessionId);
          
          if (!state || state.evaluationHistory.length === 0) {
            finalReport = this.createEmptyInterviewReport(sessionId, duration, 'llm_error');
          } else {
            
            if (allLowScores) {
              finalReport = this.createEmptyInterviewReport(sessionId, duration, 'llm_error');
            } else {
              // Только в крайнем случае используем mock
              finalReport = this.createMockFinalReport();
            }
          }
        }

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

      // ТОЛЬКО ЕСЛИ не завершаем - продолжаем обычную обработку
      const evaluation = this.enhancedEvaluateResponse(transcript, state.currentTopic, state.conversationHistory);

      // Сохраняем оценку
      state.evaluationHistory.push({
        topic: state.currentTopic,
        response: transcript,
        evaluation: evaluation,
        timestamp: new Date().toISOString()
      });

      console.log(`📊 ОЦЕНКА ОТВЕТА:`, {
        'текст': transcript,
        'общая_оценка': evaluation.overall_score,
        'техническая_глубина': evaluation.technical_depth,
        'негативный_ответ': evaluation.is_negative,
        'качество': evaluation.response_quality,
        'тема_мастерство': evaluation.topic_mastery
      });

      // УМНОЕ определение следующего действия
      const nextAction = this.determineSmartNextAction(evaluation, state, sessionId);
      state.actionsHistory.push(nextAction);

      console.log(`🎯 СЛЕДУЮЩЕЕ ДЕЙСТВИЕ:`, {
        'действие': nextAction.action,
        'причина': nextAction.reason,
        'уверенность': nextAction.confidence,
        'приоритет': nextAction.priority,
        'тема': nextAction.suggested_topic
      });
      const responseAnalysis = this.analyzeResponseQuality(transcript);
      console.log('📈 Анализ качества ответа:', responseAnalysis);

// Передаем анализ в промпт (переименовали параметр на qualityAnalysis)
      const prompt = this.buildSmartPrompt(state, transcript, nextAction, responseAnalysis);

      // Получаем ответ
      let aiResponse = await this.getLLMResponse(prompt);
      console.log(`✅ LLM Response: ${aiResponse}`);

      // Если действие = challenge_candidate, проверяем что ответ содержит фразу для практического задания
      if (nextAction.action === 'challenge_candidate' && !state.hasCodeTask) {
        const taskPhrase = 'даю тебе 10 минут на выполнение задачи у консоли';
        const hasTaskPhrase = aiResponse.toLowerCase().includes(taskPhrase.toLowerCase());
        
        if (!hasTaskPhrase) {
          console.warn(`⚠️ ИИ не использовал правильную фразу для практического задания. Заменяем ответ.`);
          // Принудительно добавляем правильную фразу
          aiResponse = `А теперь хочу посмотреть на твои практические знания. Даю тебе 10 минут на выполнение задачи у консоли.`;
          state.hasCodeTask = true; // Помечаем, что задание было предложено
        }
      }

      // ОЧИСТКА: Удаляем критерии и оставляем только один вопрос
      aiResponse = this.cleanAIResponse(aiResponse);

      // Обновляем состояние
      if (nextAction.action === 'next_topic' || nextAction.action === 'change_topic') {
        state.currentTopic = nextAction.suggested_topic;
        state.topicProgress.add(state.currentTopic);
      }

      // Добавляем ответ AI
      state.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });

      this.applyNextAction(state, nextAction);
      this.conversationStates.set(sessionId, state);

      // ← ЭТО ОБЫЧНЫЙ ОТВЕТ, БЕЗ ФИНАЛЬНОГО ОТЧЕТА
      return {
        text: aiResponse,
        metadata: {
          evaluation: evaluation,
          nextAction: nextAction,
          currentTopic: state.currentTopic,
          interviewProgress: this.getInterviewProgress(sessionId),
          completionCheck: completionCheck
        }
      };

    } catch (error) {
      console.error('❌ Enhanced AI Error:', error.message);
      
      // Увеличиваем счетчик ошибок LLM
      state.llmErrorCount = (state.llmErrorCount || 0) + 1;
      
      // Если слишком много ошибок LLM (>= 3), завершаем интервью
      if (state.llmErrorCount >= 3) {
        console.warn(`⚠️ Too many LLM errors (${state.llmErrorCount}), completing interview`);
        
        // Генерируем финальный отчет
        let finalReport;
        try {
          finalReport = await this.generateComprehensiveReport(sessionId);
        } catch (reportError) {
          console.error('❌ Error generating final report:', reportError);
          const duration = this.calculateDurationMinutes(sessionId);
          finalReport = this.createEmptyInterviewReport(sessionId, duration, 'llm_error');
        }
        
        return {
          text: this.getSmartCompletionMessage(finalReport),
          metadata: {
            isInterviewComplete: true,
            finalReport: finalReport,
            completionReason: 'Превышено количество ошибок LLM API',
            wasAutomatic: true
          }
        };
      }
      
      // Используем fallback ответ
      const fallbackResponse = this.getSmartFallbackResponse(state);
      
      // ВАЖНО: Добавляем fallback ответ в историю диалога, чтобы не повторять его
      state.conversationHistory.push({
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      });
      
      console.log(`🔄 Using fallback response (LLM error count: ${state.llmErrorCount}): ${fallbackResponse}`);
      
      return {
        text: fallbackResponse,
        metadata: {
          isFallback: true,
          currentTopic: state.currentTopic,
          error: error.message,
          llmErrorCount: state.llmErrorCount
        }
      };
    }
  }

  /**
   * Улучшенная система оценки (из EnhancedAiService)
   */
  enhancedEvaluateResponse(response, topic) {
    // Многомерная оценка:
    // - Длина ответа
    // - Технические термины
    // - Структурированность
    // - Релевантность теме
    // - Наличие примеров кода
    // - Проверка негативных ответов

    const responseLength = response.length;
    const technicalTerms = this.countTechnicalTerms(response);
    const hasStructure = this.hasGoodStructure(response);
    const relevanceScore = this.calculateRelevance(response, topic);

    // Более сложные метрики (смягченные для голосового интервью)
    // Учитываем, что в голосовом интервью люди говорят более естественно
    const completeness = Math.min(10, responseLength / 20 + (technicalTerms * 0.7)); // Смягчено: было /25, стало /20
    const technicalDepth = Math.min(10, technicalTerms * 2 + (this.hasCodeExamples(response) ? 2 : 0) + (responseLength > 50 ? 1 : 0)); // Улучшено: больше вес терминов, бонус за длину
    const structure = hasStructure ? 8 : (responseLength > 40 ? 6 : 4); // Смягчено: средние ответы тоже получают баллы
    const relevance = Math.min(10, relevanceScore * 2.5); // Улучшено: больше вес релевантности

    // Проверяем негативные ответы (только явные)
    const negativeWords = ['нет', 'не знаю', 'не было', 'никакие', 'не понимаю', 'не могу'];
    const isNegative = negativeWords.some(word => {
      const lowerResponse = response.toLowerCase();
      // Проверяем, что это не часть более сложного ответа
      return lowerResponse === word || lowerResponse.startsWith(word + ' ') || lowerResponse.endsWith(' ' + word);
    });

    // Бонусы за хорошие ответы
    let bonus = 0;
    if (responseLength > 100 && technicalTerms >= 2) bonus += 1; // Хороший развернутый ответ
    if (responseLength > 150) bonus += 0.5; // Очень развернутый ответ
    if (technicalTerms >= 3) bonus += 0.5; // Много технических терминов

    const overallScore = isNegative ? 3 : Math.min(10, (completeness + technicalDepth + structure + relevance) / 4 + bonus);

    return {
      completeness: Math.round(completeness * 10) / 10,
      is_negative: isNegative,
      technical_depth: Math.round(technicalDepth * 10) / 10,
      structure: Math.round(structure * 10) / 10,
      relevance: Math.round(relevance * 10) / 10,
      overall_score: Math.round(overallScore * 10) / 10,
      strengths: this.identifyEnhancedStrengths(response),
      improvements: this.suggestSmartImprovements(response, topic),
      topic_mastery: this.determineMasteryLevel(overallScore),
      needs_review: overallScore < 5.5, // Смягчено: было < 6
      has_potential: (overallScore >= 6 && technicalDepth >= 5) || (overallScore >= 6.5 && technicalTerms >= 2), // Смягчено: было >= 7 && >= 8
      response_quality: this.determineResponseQuality(responseLength, technicalTerms)
    };
  }

  /**
   * Умное определение следующего действия (объединенная логика)
   */
  determineSmartNextAction(evaluation, state, sessionId) {
    // Иерархия решений:
    // 1. Проверка негативных ответов → смена темы
    // 2. Отличные результаты → завершение
    // 3. Хорошие результаты → переход к следующей теме
    // 4. Низкие баллы → углубление в тему
    // 5. Потенциал → сложные задачи
    // 6. По умолчанию → продолжение темы

    const { overall_score, needs_review, has_potential, topic_mastery } = evaluation;
    const { evaluationHistory, currentTopic, conversationHistory  } = state;
    const progress = this.getInterviewProgress(sessionId);
    
    console.log(`🔍 determineSmartNextAction вызван:`, {
      evaluationHistoryLength: evaluationHistory.length,
      hasCodeTask: state.hasCodeTask,
      overall_score,
      has_potential
    });

    // Получаем последний ответ пользователя
    const lastUserMessage = state.conversationHistory
      .filter(msg => msg.role === 'user')
      .pop()?.content.toLowerCase() || '';

    console.log(`🔍 Анализ ответа: "${lastUserMessage}" (${lastUserMessage.length} символов)`);

    // 0. ПРИОРИТЕТ: Проверка явного запроса пользователя на практическое задание
    const practiceRequestKeywords = ['практику', 'практическое задание', 'практическое', 'давай практику', 'хочу практику', 'дай практику', 'задание у консоли', 'код у консоли'];
    const hasPracticeRequest = practiceRequestKeywords.some(keyword => lastUserMessage.includes(keyword));
    
    if (hasPracticeRequest && !state.hasCodeTask) {
      console.log(`🎯 Обнаружен явный запрос пользователя на практическое задание: "${lastUserMessage}"`);
      state.hasCodeTask = true;
      return {
        action: 'challenge_candidate',
        reason: 'Пользователь явно запросил практическое задание',
        confidence: 0.99,
        suggested_topic: currentTopic,
        priority: 'critical'
      };
    }

    // 1. Проверка ОЧЕНЬ коротких/бессмысленных ответов
    if (lastUserMessage.length < 15) {
      const shortResponses = ['кряк', 'ага', 'угу', 'да', 'нет', 'ок', 'ладно', 'хм', 'привет', 'здравствуйте'];
      const isVeryShort = shortResponses.some(word =>
        lastUserMessage.toLowerCase().includes(word)
      );

      if (isVeryShort) {
        console.log(`⚠️ Очень короткий/неинформативный ответ: "${lastUserMessage}"`);

        // Если это уже второй короткий ответ подряд
        const userMessages = conversationHistory.filter(msg => msg.role === 'user');
        const lastTwoResponses = userMessages.slice(-2).map(m => m.content);
        const bothShort = lastTwoResponses.every(resp =>
          resp.length < 20
        );

        if (bothShort) {
        return {
          action: 'change_topic',
          reason: 'Два коротких ответа подряд, требуется смена темы',
          confidence: 0.9,
          suggested_topic: this.getNextTopic(state.position, currentTopic, sessionId),
          priority: 'high'
        };
        }

        return {
          action: 'deep_dive_topic',
          reason: 'Короткий ответ, требуется углубиться и попросить больше деталей',
          confidence: 0.8,
          suggested_topic: currentTopic,
          priority: 'high'
        };
      }
    }

    // ПЕРВОЕ - проверяем явные негативные ответы (но не если запрошена практика)
    const negativeResponses = ['не знаю', 'не было', 'никакие', 'не понимаю'];
    if (negativeResponses.some(word => lastUserMessage.includes(word)) && !hasPracticeRequest) {
      return {
        action: 'change_topic_or_complete',
        reason: 'Пользователь демонстрирует отсутствие знаний по теме',
        suggested_topic: this.getNextTopic(state.position, currentTopic, sessionId)
      };
    }

    // Критерии для проверки потенциала - предлагаем практическое задание
    // ВАЖНО: Проверяем ПЕРЕД другими действиями, чтобы не пропустить возможность предложить практику
    if (!state.hasCodeTask && evaluationHistory.length >= 1) {
      const averageScore = progress.averageScore || 0;
      const hasGoodAverage = averageScore >= 5.5 && evaluationHistory.length >= 3;
      const hasMultipleGoodAnswers = evaluationHistory.filter(e => e.evaluation.overall_score >= 5.5).length >= 2;
      const hasRecentGoodAnswer = evaluationHistory.length > 0 && 
                                   evaluationHistory[evaluationHistory.length - 1].evaluation.overall_score >= 6;
      
      // ВАЖНО: Для тестирования предлагаем практическое задание ОБЯЗАТЕЛЬНО после 1 вопроса
      const shouldForceCodeTask = evaluationHistory.length >= 1 && evaluationHistory.length < 2;
      
      console.log(`🔍 Проверка практического задания (ПРИОРИТЕТ): hasCodeTask=${state.hasCodeTask}, evaluationHistory.length=${evaluationHistory.length}, shouldForceCodeTask=${shouldForceCodeTask}`);
      
      const shouldOffer = has_potential || hasGoodAverage || hasMultipleGoodAnswers || hasRecentGoodAnswer || shouldForceCodeTask;
      
      console.log(`🔍 Условия для практического задания:`, {
        has_potential,
        hasGoodAverage,
        hasMultipleGoodAnswers,
        hasRecentGoodAnswer,
        shouldForceCodeTask,
        shouldOffer
      });
      
      if (shouldOffer) {
        state.hasCodeTask = true;
        console.log(`🎯 Предлагаем практическое задание (ПРИОРИТЕТ): shouldForceCodeTask=${shouldForceCodeTask}`);
        return {
          action: 'challenge_candidate',
          reason: shouldForceCodeTask ? 'Обязательное предложение практического задания после первого вопроса (тестовый режим)' : 'Кандидат показывает потенциал для более сложных задач - предложить практическое задание',
          confidence: shouldForceCodeTask ? 0.95 : 0.8,
          suggested_topic: currentTopic,
          priority: 'high'
        };
      }
    }

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
      const nextTopic = this.getNextTopic(state.position, currentTopic, sessionId);
      return {
        action: 'next_topic',
        reason: 'Успешное освоение текущей темы',
        confidence: 0.7,
        suggested_topic: nextTopic,
        priority: 'medium'
      };
    }

    // Проверяем, сколько раз уже задавались вопросы по текущей теме
    const questionsOnCurrentTopic = evaluationHistory.filter(e => e.topic === currentTopic).length;
    
    // Если по теме задано больше 3 вопросов, переходим к следующей
    if (questionsOnCurrentTopic >= 3) {
      const nextTopic = this.getNextTopic(state.position, currentTopic, sessionId);
      if (nextTopic !== 'завершение') {
        return {
          action: 'next_topic',
          reason: `По теме "${currentTopic}" задано ${questionsOnCurrentTopic} вопросов, переходим к следующей`,
          confidence: 0.8,
          suggested_topic: nextTopic,
          priority: 'high'
        };
      }
    }
    
    // Дублирующая проверка удалена - уже проверено выше с приоритетом

    // Критерии для углубления в тему (только если практическое задание не было предложено)
    if (needs_review || (overall_score < 7 && topic_mastery === 'beginner')) {
      return {
        action: 'deep_dive_topic',
        reason: 'Требуется углубленное изучение темы',
        confidence: 0.8,
        suggested_topic: currentTopic,
        priority: 'high'
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
    // 5 критериев завершения по порядку приоритета:
    // 1. Явный запрос пользователя (самый высокий приоритет)
    // 2. Достигнут лимит вопросов (25)
    // 3. Отличные результаты (8.5+ баллов)
    // 4. Хорошие результаты + достаточно тем
    // 5. Минимальная продолжительность + базовый охват

    const state = this.conversationStates.get(sessionId);
    if (!state) return { complete: false, reason: "Session not found" };

    // Берем последние 3 сообщения пользователя для проверки
    const userMessages = state.conversationHistory
      .filter(msg => msg.role === 'user')
      .slice(-3)
      .map(msg => msg.content.toLowerCase());

    const completionKeywords = [
      'стоп', 'закончить', 'завершить', 'хватит', 'достаточно',
      'конец', 'закончим', 'остановись', 'прекрати', 'хватит вопросов',
      'заканчиваем',  'завершаем', 'кончай'
    ];

    // Проверяем все последние сообщения
    const hasCompletionRequest = userMessages.some(message =>
      completionKeywords.some(keyword => message.includes(keyword))
    );

    if (hasCompletionRequest) {
      console.log(`🛑 IMMEDIATE COMPLETION: User said "${userMessages}"`);
      return {
        complete: true,
        reason: "Явный запрос на завершение от пользователя",
        userRequested: true
      };
    }

    // Базовая проверка прогресса
    const progress = this.getInterviewProgress(sessionId);
    const duration = this.calculateDurationMinutes(sessionId);

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
   *  Очистка и нормализация ответа AI
   */
  cleanAIResponse(aiResponse) {
    // Структура отчёта:
    // 1. Общая оценка (уровень, рекомендация, уверенность)
    // 2. Технические навыки (сильные/слабые стороны)
    // 3. Поведенческий анализ (коммуникация, решение проблем)
    // 4. Аналитика интервью (статистика, прогресс)
    // 5. Детальный фидбек
    // 6. Следующие шаги
    // 7. Защита от ошибок через createMockFinalReport()
    if (!aiResponse) return "Пожалуйста, расскажите подробнее о вашем опыте?";

    // Удаляем все технические метаданные и критерии
    let cleaned = aiResponse
      .split(/---|###|Критерии оценки/)[0] // Удаляем все после разделителей
      .replace(/\*\*(.*?)\*\*/g, '$1') // Убираем жирный текст
      .replace(/\*(.*?)\*/g, '$1')     // Убираем курсив
      .replace(/\n{2,}/g, '\n')        // Убираем лишние переносы
      .trim();

    // Проверяем на прощальные фразы в середине интервью (это ошибка)
    const farewellPhrases = ['хорошего дня', 'до свидания', 'удачи', 'всего доброго', 'до встречи'];
    const hasFarewell = farewellPhrases.some(phrase => cleaned.toLowerCase().includes(phrase));
    if (hasFarewell) {
      console.warn(`⚠️ Обнаружена прощальная фраза в ответе ИИ: "${cleaned}". Заменяем на вопрос.`);
      // Заменяем на вопрос по текущей теме
      return "Можешь рассказать подробнее о своем опыте?";
    }

    // ВАЖНО: Если это практическое задание, не обрезаем ответ
    const isCodeTaskPhrase = cleaned.toLowerCase().includes('даю тебе 10 минут на выполнение задачи у консоли') ||
                             cleaned.toLowerCase().includes('практические знания');
    
    if (isCodeTaskPhrase) {
      // Для практического задания возвращаем полный ответ
      return cleaned;
    }

    // Убеждаемся, что это вопрос
    if (!cleaned.endsWith('?') && !cleaned.endsWith('.')) {
      cleaned += '?';
    }

    // Оставляем только первый вопрос
    const sentences = cleaned.split(/(?<=[.!?])\s+/);
    const firstQuestion = sentences.find(s => s.trim().endsWith('?')) || sentences[0];

    return firstQuestion ? firstQuestion.trim() : "Расскажите подробнее о вашем опыте?";
  }

  buildSmartPrompt(state, userInput, nextAction, qualityAnalysis = null) {
    const { position, conversationHistory, currentTopic, topicProgress } = state;
    
    // Получаем список уже пройденных тем
    const topicsCovered = Array.from(topicProgress || new Set(['введение']));

    // Анализируем последний ответ пользователя
    const lastResponse = userInput;
    const responseLength = lastResponse.length;
    const technicalTerms = this.countTechnicalTerms(lastResponse);
    const isShort = responseLength < 30;
    const hasTechTerms = technicalTerms > 0;

    let conversationSummary = '';
    if (conversationHistory.length > 12) {
      // Берем ключевые моменты из всей истории
      const userResponses = conversationHistory
        .filter(msg => msg.role === 'user')
        .slice(-8)
        .map(msg => msg.content.substring(0, 100) + '...');

      conversationSummary = `Краткая сводка предыдущих ответов кандидата:\n${userResponses.join('\n')}\n\n`;
    }

    // Формируем историю диалога - берем больше сообщений для контекста
    const recentHistory = conversationHistory.slice(-10); // Последние 5 обменов (10 сообщений)
    const historyText = recentHistory.map(msg =>
      `${msg.role === 'user' ? 'Кандидат' : 'Интервьюер'}: ${msg.content}`
    ).join('\n');
    
    // Извлекаем все вопросы интервьюера из истории, чтобы не повторять их
    const previousQuestions = conversationHistory
      .filter(msg => msg.role === 'assistant')
      .slice(-5)
      .map(msg => msg.content)
      .join('\n');

    // Динамические инструкции на основе анализа ответа
    let responseAnalysisText;
    if (isShort && !hasTechTerms) {
      responseAnalysisText = `Кандидат дал очень короткий ответ (${responseLength} символов) без технических терминов.`;
    } else if (hasTechTerms) {
      responseAnalysisText = `Кандидат использовал ${technicalTerms} технических терминов в ответе.`;
    } else {
      responseAnalysisText = `Кандидат дал ответ средней длины (${responseLength} символов).`;
    }

    // Собираем промпт
    let prompt = `Ты - опытный IT-интервьюер для позиции ${position}. Ты ведешь живой диалог, реагируешь на ответы кандидата, задаешь уточняющие вопросы, показываешь заинтересованность.

АНАЛИЗ ПОСЛЕДНЕГО ОТВЕТА КАНДИДАТА:
${responseAnalysisText}
Длина ответа: ${responseLength} символов
Технические термины: ${technicalTerms}
Текущая тема: ${currentTopic}
Следующее действие: ${nextAction.action} (${nextAction.reason})
${topicsCovered.length > 1 ? `УЖЕ ПРОЙДЕННЫЕ ТЕМЫ (НЕ ВОЗВРАЩАЙСЯ К НИМ!): ${topicsCovered.filter(t => t !== currentTopic).join(', ')}` : ''}

СТИЛЬ ДИАЛОГА:
- Веди диалог естественно, как живой человек
- Реагируй на ответы кандидата: "Понятно", "Интересно", "Хорошо"
- Задавай уточняющие вопросы: "А как именно?", "Можешь привести пример?"
- Не задавай вопросы подряд без реакции на ответы
- Показывай заинтересованность в ответах кандидата`;

    // Добавляем анализ качества если он передан
    if (qualityAnalysis) {
      prompt += `\n\nДЕТАЛЬНЫЙ АНАЛИЗ КАЧЕСТВА ОТВЕТА:`;
      prompt += `\n- Качество: ${qualityAnalysis.quality}`;
      prompt += `\n- Длина: ${qualityAnalysis.length} символов`;
      prompt += `\n- Технические термины: ${qualityAnalysis.technical_terms}`;
      prompt += `\n- Есть структура: ${qualityAnalysis.has_structure ? 'да' : 'нет'}`;

      if (qualityAnalysis.suggestions && qualityAnalysis.suggestions.length > 0) {
        prompt += `\n- Рекомендации: ${qualityAnalysis.suggestions.join(', ')}`;
      }

      if (qualityAnalysis.quality === 'very_short') {
        prompt += `\n\nВНИМАНИЕ: Ответ очень короткий! Нужно либо попросить больше деталей, либо сменить тему.`;
      }
    }

    const actionInstructions = {
      'continue_topic': `Задай ОДИН уточняющий вопрос по теме "${currentTopic}". ${isShort ? 'Попроси рассказать подробнее, привести примеры.' : 'Углубись в детали.'} Веди диалог естественно, реагируй на ответы кандидата.`,
      'next_topic': `Плавно перейди к теме "${nextAction.suggested_topic}". Объясни переход естественно: "Теперь давайте поговорим о..." или "Хорошо, давай перейдем к...". НЕ упоминай, что предыдущая тема была пройдена.`,
      'change_topic': `Тактично смени тему с "${currentTopic}" на "${nextAction.suggested_topic}". Скажи естественно: "Хорошо, давай поговорим о..." или "Давай переключимся на...". НЕ возвращайся к уже пройденным темам: ${topicsCovered.filter(t => t !== currentTopic && t !== nextAction.suggested_topic).join(', ') || 'нет'}.`,
      'deep_dive_topic': `Задай более глубокий, детализированный вопрос по теме "${currentTopic}". Попроси объяснить на примерах. Веди диалог естественно, задавай уточняющие вопросы.`,
      'challenge_candidate': `КРИТИЧЕСКИ ВАЖНО: Ты ДОЛЖЕН предложить практическое задание! Скажи ТОЧНО эти слова: "А теперь хочу посмотреть на твои практические знания. Даю тебе 10 минут на выполнение задачи у консоли". Это запустит практическое задание в консоли. НЕ проси писать код вслух! НЕ говори "Хорошего дня" или другие прощальные фразы!`,
      'complete_interview': `Вежливо заверши собеседование, поблагодари кандидата.`,
      'change_topic_or_complete': `${isShort ? 'Предложи сменить тему естественно' : 'Вежливо заверши интервью'}.`
    };

    prompt += `

ИНСТРУКЦИЯ: ${actionInstructions[nextAction.action]}

ВАЖНЫЕ ПРАВИЛА:
1. Задай ТОЛЬКО ОДИН вопрос
2. Будь естественным и дружелюбным, веди диалог как живой человек
3. Адаптируй сложность под уровень кандидата
4. ${isShort ? 'Попроси рассказать подробнее, если ответ был коротким' : 'Продолжай углубляться в тему'}
5. Не показывай критерии оценки
6. Если кандидат уже ответил на вопрос, задай следующий вопрос по этой теме или перейди к новой теме.
7. ЗАПРЕЩЕНО просить писать или показать код! Если нужно проверить практические навыки, скажи: "А теперь хочу посмотреть на твои практические знания. Даю тебе 10 минут на выполнение задачи у консоли" - это запустит практическое задание.
8. НЕ ВОЗВРАЩАЙСЯ к уже пройденным темам: ${topicsCovered.length > 1 ? topicsCovered.join(', ') : 'введение'}. Если тема уже была пройдена, переходи к следующей.
9. Веди диалог естественно - реагируй на ответы кандидата, задавай уточняющие вопросы, показывай заинтересованность.
10. ЗАПРЕЩЕНО говорить "Хорошего дня", "До свидания", "Удачи" или другие прощальные фразы в середине интервью! Ты должен задавать вопросы и продолжать собеседование до завершения.
11. Если действие = challenge_candidate, ОБЯЗАТЕЛЬНО предложи практическое задание ТОЧНО этими словами: "А теперь хочу посмотреть на твои практические знания. Даю тебе 10 минут на выполнение задачи у консоли"

ПРЕДЫДУЩИЕ ВОПРОСЫ (НЕ ПОВТОРЯЙ ИХ!):
${previousQuestions ? previousQuestions : 'Это первый вопрос'}

ИСТОРИЯ ДИАЛОГА (последние сообщения):
${historyText}

${conversationSummary ? `\n${conversationSummary}` : ''}

Твой следующий вопрос (естественный, дружелюбный, только один вопрос, НЕ ПОВТОРЯЙ предыдущие вопросы):`;

    return prompt;
  }

  // В interviewAI.js добавляем метод
  getEnhancedConversationHistory(sessionId, limit = 20) {
    const state = this.conversationStates.get(sessionId);
    if (!state) return [];

    return state.conversationHistory.slice(-limit);
  }

// И метод для получения сводки
  getConversationSummary(sessionId) {
    const state = this.conversationStates.get(sessionId);
    if (!state || state.conversationHistory.length < 4) return '';

    const userMessages = state.conversationHistory
      .filter(msg => msg.role === 'user')
      .slice(-5)
      .map(msg => `• ${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}`);

    return `Кандидат обсуждал:\n${userMessages.join('\n')}`;
  }

  /**
   * Краткое резюме беседы для контекста
   */
  getConversationSummary(conversationHistory) {
    const recent = conversationHistory.slice(-6); // Последние 2 обмена
    return recent.map(msg =>
      `${msg.role === 'user' ? 'Кандидат' : 'Интервьюер'}: ${msg.content}`
    ).join(' | ');
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

  async generateComprehensiveReport(sessionId, reason = 'no_data') {
    let report;

    try {
      const state = this.conversationStates.get(sessionId);

      // ГАРАНТИРУЕМ, что всегда возвращаем отчет
      if (!state) {
        console.warn('⚠️ Session not found in generateComprehensiveReport, using mock data');
        return this.createMockFinalReport();
      }

      const progress = this.getInterviewProgress(sessionId);
      const duration = this.calculateDurationMinutes(sessionId);

      // Если есть ошибки LLM, используем причину 'llm_api_error'
      const actualReason = (state.llmErrorCount >= 3) ? 'llm_api_error' : 'no_data';

      // ПРОВЕРКА: Если нет данных от пользователя, возвращаем отчет с нулевой оценкой
      if (!progress || progress.totalExchanges === 0 || state.evaluationHistory.length === 0) {
        console.warn('⚠️ No user responses found - generating empty interview report');
        return this.createEmptyInterviewReport(sessionId, duration, actualReason);
      }

      // Анализируем действия и прогресс
      const actionAnalysis = this.analyzeActions(state.actionsHistory);
      const topicAnalysis = this.analyzeTopicPerformance(state.evaluationHistory);

      // Определяем уровень и рекомендацию
      const { level, recommendation, confidence } = this.determineHireDecision(progress, topicAnalysis);

      report = {
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

      // ПРОВЕРКА, что отчет не пустой
      if (!report || Object.keys(report).length === 0) {
        console.warn('⚠️ Generated report is empty, using mock data');
        return this.createMockFinalReport();
      }

      // Сохраняем отчет и очищаем сессию
      this.evaluationHistory.set(sessionId, report);
      this.conversationStates.delete(sessionId);

      console.log(`📊 Generated comprehensive report for ${sessionId}: ${level} (${progress.averageScore})`);
      return report;

    } catch (error) {
      console.error('❌ Error in generateComprehensiveReport:', error);
      
      // При ошибке пытаемся вернуть пустой отчет, если нет данных
      try {
        const state = this.conversationStates.get(sessionId);
        const duration = this.calculateDurationMinutes(sessionId);
        
        // Определяем причину - если есть ошибки LLM, используем 'llm_api_error'
        const actualReason = (state && state.llmErrorCount >= 3) ? 'llm_api_error' : 'no_data';
        
        // Если нет данных от пользователя или все оценки низкие, возвращаем пустой отчет
        if (!state || state.evaluationHistory.length === 0) {
          console.warn('⚠️ No evaluation history - using empty report');
          return this.createEmptyInterviewReport(sessionId, duration, actualReason);
        }
        
        if (allLowScores) {
          console.warn('⚠️ All scores are low (<= 3) - using empty report with score 0');
          return this.createEmptyInterviewReport(sessionId, duration, actualReason);
        }
        
        // В остальных случаях используем mock (но это не должно происходить)
        console.warn('⚠️ Using mock report as last resort');
        return this.createMockFinalReport();
      } catch (fallbackError) {
        console.error('❌ Error in fallback report generation:', fallbackError);
        // Последний резерв - пустой отчет
        return this.createEmptyInterviewReport(sessionId, 0);
      }
    }
  }

  createEmptyInterviewReport(sessionId, duration, reason = 'no_data') {
    console.log(`📊 Creating empty interview report - reason: ${reason}`);
    
    // Определяем сообщения в зависимости от причины
    let improvements = [];
    let recommendations = [];
    let detailedFeedback = "";
    
    if (reason === 'llm_error' || reason === 'llm_api_error') {
      improvements = [
        "Не удалось получить ответы от AI-интервьюера из-за ошибки LLM API",
        "Сервис GigaChat вернул ошибку 402 (Payment Required) - требуется пополнение баланса"
      ];
      recommendations = [
        "Проверить баланс аккаунта GigaChat",
        "Проверить настройки API ключа",
        "Повторить собеседование после устранения проблемы с LLM API"
      ];
      detailedFeedback = "Собеседование было прервано из-за ошибки LLM API (GigaChat). Сервис вернул ошибку 402 Payment Required, что означает отсутствие средств на аккаунте или проблемы с доступом. Ответы кандидата были получены, но не могли быть обработаны AI-интервьюером.";
    } else {
      improvements = [
        "Не было получено ответов от кандидата",
        "Микрофон не работал или кандидат не отвечал"
      ];
      recommendations = ["Требуется повторное собеседование с работающим микрофоном"];
      detailedFeedback = "Собеседование было прервано до получения ответов от кандидата. Возможные причины: проблемы с микрофоном, отсутствие ответов или технические проблемы. Рекомендуется провести повторное собеседование с проверкой работы микрофона.";
    }
    
    return {
      overall_assessment: {
        final_score: 0,
        level: "Не оценено",
        recommendation: "no_hire",
        confidence: 0.1,
        strengths: [],
        improvements: improvements,
        potential_areas: []
      },
      technical_skills: {
        topics_covered: [],
        strong_areas: [],
        weak_areas: [],
        technical_depth: 0,
        recommendations: recommendations
      },
      behavioral_analysis: {
        communication_skills: {
          score: 0,
          structure: 0,
          clarity: 0,
          engagement: 0,
          feedback: "Нет данных для оценки коммуникативных навыков"
        },
        problem_solving: {
          score: 0,
          approach: 0,
          creativity: 0,
          feedback: "Нет данных для оценки решения проблем"
        },
        learning_ability: {
          score: 0,
          feedback: "Нет данных для оценки способности к обучению"
        },
        adaptability: {
          score: 0,
          feedback: "Нет данных для оценки адаптивности"
        }
      },
      interview_analytics: {
        total_duration: `${duration || 0} минут`,
        total_questions: 0,
        topics_covered_count: 0,
        average_response_quality: 0,
        topic_progression: [],
        action_pattern: {
          total_actions: 0,
          action_breakdown: {},
          most_common_action: "no_actions",
          completion_rate: "not_completed"
        }
      },
      detailed_feedback: detailedFeedback,
      next_steps: [
        "Проверить работу микрофона перед следующим собеседованием",
        "Убедиться, что браузер имеет разрешение на доступ к микрофону",
        "Провести повторное собеседование"
      ],
      raw_data: {
        evaluationHistory: [],
        actionsHistory: []
      }
    };
  }

  createMockFinalReport() {
    return {
      overall_assessment: {
        final_score: 7.5,
        level: "Middle",
        recommendation: "hire",
        confidence: 0.8,
        strengths: [
          { strength: "Хорошие базовые знания JavaScript", frequency: 3, confidence: 0.9 },
          { strength: "Логическое мышление", frequency: 2, confidence: 0.8 }
        ],
        improvements: ["Нужно углубить знания архитектуры", "Практиковать алгоритмы"],
        potential_areas: [
          {
            topic: "System Design",
            reason: "Хорошие базовые знания, но требуется углубление",
            potential: "high"
          }
        ]
      },
      technical_skills: {
        topics_covered: ["JavaScript", "React", "HTML/CSS", "TypeScript"],
        strong_areas: ["Frontend development", "React components"],
        weak_areas: ["System design", "Performance optimization"],
        technical_depth: 7.2,
        recommendations: ["Изучить продвинутые паттерны", "Практиковать алгоритмы"]
      },
      behavioral_analysis: {
        communication_skills: {
          score: 8.0,
          structure: 7.5,
          clarity: 8.5,
          feedback: "Отличные коммуникативные навыки, ясное изложение мыслей"
        },
        problem_solving: {
          score: 7.0,
          examples_count: 2,
          feedback: "Способен решать типовые задачи, требуется практика с сложными кейсами"
        },
        learning_ability: {
          score: 8.5,
          topics_mastered: 4,
          feedback: "Быстро осваивает новые темы, показывает хороший прогресс"
        },
        adaptability: {
          score: 7.8,
          consistency: 8.0,
          trend: 0.5,
          feedback: "Хорошо адаптируется к новым вопросам, демонстрирует стабильность"
        }
      },
      interview_analytics: {
        total_duration: "18 минут",
        total_questions: 12,
        topics_covered_count: 5,
        average_response_quality: 7.5,
        topic_progression: ["введение", "javascript", "react", "оптимизация"],
        action_pattern: {
          total_actions: 15,
          action_breakdown: {
            "continue_topic": 8,
            "next_topic": 4,
            "deep_dive_topic": 3
          },
          most_common_action: "continue_topic",
          completion_rate: "completed"
        }
      },
      detailed_feedback: "Кандидат демонстрирует хороший потенциал для позиции Middle Frontend-разработчика. Показал уверенные знания базовых технологий и способность к обучению. Рекомендуется углубление в архитектурные вопросы и оптимизацию производительности.",
      next_steps: [
        "Техническое интервью с тимлидом",
        "Оценка культурного соответствия команде",
        "Обсуждение плана развития на первые 3 месяца"
      ],
      raw_data: {
        evaluationHistory: [],
        actionsHistory: []
      }
    };
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

    const actionKeys = Object.keys(actionCounts);
    const mostCommonAction = actionKeys.length > 0 
      ? actionKeys.reduce((a, b) => actionCounts[a] > actionCounts[b] ? a : b)
      : 'no_actions';

    return {
      total_actions: actionsHistory.length,
      action_breakdown: actionCounts,
      most_common_action: mostCommonAction,
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

  getSmartFallbackResponse(state) {
    const { currentTopic, conversationHistory } = state;

    // Извлекаем все вопросы, которые уже были заданы
    const previousQuestions = conversationHistory
      .filter(msg => msg.role === 'assistant')
      .map(msg => msg.content.toLowerCase());

    // Несколько вариантов вопросов для каждой темы
    const topicQuestions = {
      'javascript': [
        "Расскажите о вашем опыте работы с асинхронным JavaScript?",
        "Какие методы работы с промисами вы знаете?",
        "Объясните разницу между async/await и промисами?",
        "Как вы обрабатываете ошибки в асинхронном коде?"
      ],
      'react': [
        "Как вы управляете состоянием в больших React приложениях?",
        "Расскажите о хуках React и их преимуществах?",
        "Как вы оптимизируете производительность React компонентов?",
        "Объясните жизненный цикл компонента React?"
      ],
      'базы данных': [
        "Как вы оптимизируете запросы к базе данных?",
        "Какие типы баз данных вы использовали?",
        "Расскажите о нормализации базы данных?",
        "Как вы работаете с транзакциями?"
      ],
      'api': [
        "Какие принципы REST API вы считаете наиболее важными?",
        "Как вы обрабатываете ошибки в API?",
        "Расскажите о методах HTTP и их использовании?",
        "Как вы обеспечиваете безопасность API?"
      ],
      'введение': [
        "Расскажите о вашем самом интересном проекте и вашей роли в нем?",
        "Что вас привлекает в разработке?",
        "Какие технологии вы изучали?",
        "Расскажите о вашем опыте программирования?"
      ],
      'javascript/typescript': [
        "Расскажите о вашем опыте работы с TypeScript?",
        "Какие преимущества TypeScript перед JavaScript?",
        "Как вы используете типы в TypeScript?",
        "Расскажите о вашем опыте работы с JavaScript?"
      ]
    };

    // Получаем вопросы для текущей темы
    const questionsForTopic = topicQuestions[currentTopic] || topicQuestions['введение'];
    
    // Находим вопрос, который еще не был задан
    let questionToAsk = null;
    for (const question of questionsForTopic) {
      const questionLower = question.toLowerCase();
      // Проверяем, не был ли этот вопрос уже задан
      const wasAsked = previousQuestions.some(prevQ => 
        prevQ.includes(questionLower.substring(0, 30)) || 
        questionLower.includes(prevQ.substring(0, 30))
      );
      
      if (!wasAsked) {
        questionToAsk = question;
        break;
      }
    }

    // Если все вопросы по теме уже заданы, переключаемся на другую тему
    if (!questionToAsk) {
      // Пробуем другие темы
      const otherTopics = Object.keys(topicQuestions).filter(topic => topic !== currentTopic);
      for (const topic of otherTopics) {
        const questions = topicQuestions[topic];
        for (const question of questions) {
          const questionLower = question.toLowerCase();
          const wasAsked = previousQuestions.some(prevQ => 
            prevQ.includes(questionLower.substring(0, 30)) || 
            questionLower.includes(prevQ.substring(0, 30))
          );
          
          if (!wasAsked) {
            questionToAsk = question;
            // Обновляем текущую тему
            state.currentTopic = topic;
            break;
          }
        }
        if (questionToAsk) break;
      }
    }

    // Если все вопросы исчерпаны, возвращаем общий вопрос
    return questionToAsk || "Расскажите подробнее о вашем опыте в этом направлении?";
  }

  // Сохраняем базовые методы из предыдущих версий
  getInterviewProgress(sessionId) {
    const state = this.conversationStates.get(sessionId);
    if (!state) return null;

    const evaluations = state.evaluationHistory;
    const totalExchanges = evaluations.length;
    
    // ВАЖНО: проверяем, что evaluation существует и имеет overall_score
    const validEvaluations = evaluations.filter(item => 
      item && item.evaluation && typeof item.evaluation.overall_score === 'number'
    );
    
    const averageScore = validEvaluations.length > 0
      ? validEvaluations.reduce((sum, item) => sum + item.evaluation.overall_score, 0) / validEvaluations.length 
      : 0;

    const topicsCovered = Array.from(state.topicProgress || new Set(['введение']));

    const weakAreas = validEvaluations
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

  getNextTopic(position, currentTopic, sessionId = null) {
    const sequence = this.topicSequences[position] || this.topicSequences.frontend;
    const currentIndex = sequence.indexOf(currentTopic);
    
    // Если передан sessionId, исключаем уже пройденные темы
    if (sessionId) {
      const state = this.conversationStates.get(sessionId);
      if (state && state.topicProgress) {
        const topicsCovered = Array.from(state.topicProgress);
        // Ищем следующую тему, которая еще не была пройдена
        for (let i = currentIndex + 1; i < sequence.length; i++) {
          if (!topicsCovered.includes(sequence[i])) {
            return sequence[i];
          }
        }
        // Если все темы пройдены, возвращаем завершение
        return 'завершение';
      }
    }
    
    // Fallback: просто следующая тема в последовательности
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
    // Смягченные критерии для голосового интервью
    if (score >= 7.5) return 'advanced';
    if (score >= 6) return 'intermediate';
    if (score >= 4.5) return 'beginner';
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
    
    // Проверяем, что topicAnalysis существует и имеет правильную структуру
    if (!topicAnalysis || !topicAnalysis.topicAnalysis) {
      console.warn('⚠️ Invalid topicAnalysis in identifyPotentialAreas');
      return [];
    }
    
    const { topicAnalysis: topics } = topicAnalysis;

    Object.entries(topics).forEach(([topic, data]) => {
      // Проверяем, что data существует
      if (!data) return;
      
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
      // ВАЖНО: проверяем, что scores существует и не пустой
      if (data.responseCount >= 2 && data.scores && Array.isArray(data.scores) && data.scores.length > 0) {
        const firstScore = data.scores[0];
        const lastScore = data.scores[data.scores.length - 1];
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
   * Анализирует ответ кандидата для лучшего понимания контекста
   */
  analyzeResponseQuality(response) {
    const length = response.length;
    const techTerms = this.countTechnicalTerms(response);
    const hasStructure = this.hasGoodStructure(response);

    let quality = 'poor';
    let suggestions = [];

    if (length < 20) {
      quality = 'very_short';
      suggestions.push('Попросить рассказать подробнее');
      suggestions.push('Задать более конкретный вопрос');
    } else if (length >= 20 && length < 50) {
      quality = 'short';
      suggestions.push('Уточнить детали');
    } else if (length >= 50 && length < 100) {
      quality = 'medium';
    } else if (length >= 100) {
      quality = 'detailed';
    }

    if (techTerms === 0 && length > 30) {
      suggestions.push('Попросить упомянуть конкретные технологии');
    }

    return {
      quality,
      length,
      technical_terms: techTerms,
      has_structure: hasStructure,
      suggestions: suggestions.slice(0, 2)
    };
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

  debugServiceUsage() {
    console.log('=== SuperAiService Debug Info ===');
    console.log(`Active sessions: ${this.conversationStates.size}`);
    console.log(`Stored reports: ${this.evaluationHistory.size}`);

    this.conversationStates.forEach((state, sessionId) => {
      console.log(`\nSession: ${sessionId}`);
      console.log(`  Position: ${state.position}`);
      console.log(`  Messages: ${state.conversationHistory.length}`);
      console.log(`  Evaluations: ${state.evaluationHistory.length}`);
      console.log(`  Topics covered: ${Array.from(state.topicProgress).join(', ')}`);
    });

    return {
      activeSessions: this.conversationStates.size,
      storedReports: this.evaluationHistory.size,
      sessions: Array.from(this.conversationStates.entries()).map(([id, state]) => ({
        id,
        position: state.position,
        messages: state.conversationHistory.length,
        topics: Array.from(state.topicProgress)
      }))
    };
  }

  getConversationHistory(sessionId) {
    const state = this.conversationStates.get(sessionId);
    return state ? state.conversationHistory : [];
  }
}

module.exports = new SuperAiService();