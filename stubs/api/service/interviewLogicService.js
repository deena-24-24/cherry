const { getModel } = require('../llm');
const stateService = require('./interviewStateService');

const initialGreetings = {
  frontend: "Здравствуйте! Давайте начнем наше собеседование на позицию Frontend-разработчика. Расскажите, пожалуйста, немного о себе и вашем опыте.",
  backend: "Добрый день. Рад приветствовать вас на собеседовании на позицию Backend-разработчика. Для начала, расскажите о своем самом интересном проекте.",
  fullstack: "Здравствуйте! Начнем собеседование на позицию Fullstack-разработчика. Расскажите о себе и технологиях, с которыми вы предпочитаете работать.",
};

const COMPLETION_CRITERIA = {
  minExchanges: 3,
  targetScore: 7.0,
  maxExchanges: 7,
  minTopics: 1,
  minDuration: 2
};

class InterviewLogicService {
  constructor() {
    this.topicSequences = {
      frontend: ['введение', 'javascript', 'react', 'производительность', 'архитектура', 'завершение'],
      backend: ['введение', 'db', 'api', 'security', 'deploy', 'завершение'],
      fullstack: ['введение', 'frontend', 'backend', 'devops', 'architecture', 'завершение']
    };
  }

  async initializeSession(sessionId, position) {
    const greeting = initialGreetings[position] || initialGreetings.frontend;

    const exists = await stateService.hasSession(sessionId);
    if (!exists) {
      const newState = {
        position: position,
        conversationHistory: [{ role: 'assistant', content: greeting, timestamp: new Date() }],
        currentTopic: 'введение',
        evaluationHistory: [],
        topicProgress: new Set(['введение']),
        sessionStart: new Date(),
        llmErrorCount: 0,
        actionsHistory: [],
        hasCodeTask: false
      };
      await stateService.createSession(sessionId, newState);

      return {
        text: greeting,
        metadata: {
          isInitial: true,
          currentTopic: 'введение',
          interviewProgress: await this.getInterviewProgress(sessionId)
        }
      };
    }

    const state = await stateService.getSession(sessionId);
    if (state.position !== position) {
      state.position = position;
      await stateService.updateSession(sessionId, state);
    }

    return {
      text: greeting,
      metadata: {
        isInitial: false,
        currentTopic: state.currentTopic || 'введение',
        interviewProgress: await this.getInterviewProgress(sessionId)
      }
    };
  }

  /**
   * Основной метод для потоковой генерации ответа
   */
  async getAIResponseStream(transcript, position, sessionId, onChunk) {
    const exists = await stateService.hasSession(sessionId);
    if (!exists) {
      await this.initializeSession(sessionId, position);
    }

    const state = await stateService.getSession(sessionId);

    // 2. Сохраняем ответ пользователя
    state.conversationHistory.push({
      role: 'user',
      content: transcript,
      timestamp: new Date()
    });

    try {
      // 3. ПРОВЕРКА НА ЗАВЕРШЕНИЕ ПО ЛИМИТАМ (ДО ГЕНЕРАЦИИ)
      const completionCheck = await this.shouldCompleteInterview(sessionId);

      if (completionCheck.complete) {
        console.log(`🤖 AI decided to finish session ${sessionId} BEFORE generation. Reason: ${completionCheck.reason}`);

        const goodbyeMessage = "Спасибо за ваши ответы. Мы достаточно обсудили основные темы. На этом техническая часть интервью завершена. Сейчас я подготовлю финальный отчет.";

        if (onChunk) onChunk(goodbyeMessage);

        state.conversationHistory.push({
          role: 'assistant',
          content: goodbyeMessage,
          timestamp: new Date()
        });
        await stateService.updateSession(sessionId, state);

        return {
          text: goodbyeMessage,
          metadata: {
            isInterviewComplete: true,
            completionReason: completionCheck.reason,
            wasAutomatic: !completionCheck.userRequested,
            finalReport: await this.generateComprehensiveReport(sessionId)
          }
        };
      }

      // === ПРОВЕРКА НА ПРАКТИЧЕСКУЮ ЗАДАЧУ ===
      const codeTaskCheck = this.shouldTriggerCodeTask(state, transcript);

      if (codeTaskCheck.trigger) {
        console.log(`🚀 Triggering Code Task for session ${sessionId}`);

        // Фраза-триггер, которую ждет фронтенд
        const triggerPhrase = "А теперь хочу посмотреть на твои практические знания. Даю тебе 10 минут на выполнение задачи у консоли.";

        // Отправляем чанк сразу, чтобы пользователь услышал начало
        if (onChunk) onChunk(triggerPhrase);

        // Обновляем состояние
        state.hasCodeTask = true;
        state.conversationHistory.push({
          role: 'assistant',
          content: triggerPhrase,
          timestamp: new Date()
        });

        await stateService.updateSession(sessionId, state);

        return {
          text: triggerPhrase,
          metadata: {
            isCodeTask: true,
            currentTopic: state.currentTopic
          }
        };
      }

      // 4. ГЕНЕРАЦИЯ ОБЫЧНОГО ОТВЕТА (ЕСЛИ ЛИМИТЫ НЕ ПРЕВЫШЕНЫ)
      const prompt = this.buildTextOnlyPrompt(state, transcript);
      // Передаем sessionId для кэширования контекста в GigaChat
      const llm = getModel({ 
        provider: 'gigachat', 
        model: 'GigaChat-2-Max', 
        streaming: true, 
        temperature: 0.7,
        sessionId: sessionId  // Для кэширования контекста через X-Session-ID
      });
      const stream = await llm.stream(prompt);

      let aiReplyText = "";

      for await (const chunk of stream) {
        const content = chunk.content;
        if (content) {
          aiReplyText += content;
          if (onChunk) onChunk(content);
        }
      }

      state.conversationHistory.push({
        role: 'assistant',
        content: aiReplyText,
        timestamp: new Date()
      });

      this.backgroundAnalysis(state, transcript, aiReplyText, sessionId);
      await stateService.updateSession(sessionId, state);

      // 5. ПРОВЕРКА НА ЗАВЕРШЕНИЕ ПО СОДЕРЖАНИЮ ОТВЕТА
      const lowerReply = aiReplyText.toLowerCase();
      const isNaturalGoodbye = ["всего доброго", "до свидания", "завершаем", "на этом всё", "спасибо за уделенное время", "подготовлю отчет"].some(phrase => lowerReply.includes(phrase));

      if (isNaturalGoodbye) {
        console.log(`🤖 AI said goodbye naturally in session ${sessionId}`);
        return {
          text: aiReplyText,
          isStreamed: true,
          metadata: {
            isInterviewComplete: true,
            completionReason: "ИИ завершил диалог",
            wasAutomatic: true,
            finalReport: await this.generateComprehensiveReport(sessionId)
          }
        };
      }

      // Иначе возвращаем обычный ответ
      return {
        text: aiReplyText,
        isStreamed: true,
        metadata: {
          isInterviewComplete: false
        }
      };

    } catch (error) {
      console.error('Streaming Error:', error);
      
      // Проверяем, является ли это ошибкой оплаты GigaChat (402 Payment Required)
      const isPaymentError = error?.response?.status === 402 || 
                            error?.message?.includes('402') || 
                            error?.message?.includes('Payment Required');
      
      if (isPaymentError) {
        console.warn('⚠️ GigaChat Payment Required (402). Attempting fallback to alternative provider...');
        
        // Пытаемся использовать fallback провайдер (DeepSeek или Ollama)
        try {
          const fallbackProvider = process.env.GITHUB_TOKEN ? 'deepseek' : 'ollama';
          console.log(`🔄 Trying fallback provider: ${fallbackProvider}`);
          
          const prompt = this.buildTextOnlyPrompt(state, transcript);
          const fallbackLlm = getModel({ 
            provider: fallbackProvider, 
            streaming: true, 
            temperature: 0.7
          });
          
          const stream = await fallbackLlm.stream(prompt);
          let aiReplyText = "";

          for await (const chunk of stream) {
            const content = chunk.content;
            if (content) {
              aiReplyText += content;
              if (onChunk) onChunk(content);
            }
          }

          state.conversationHistory.push({
            role: 'assistant',
            content: aiReplyText,
            timestamp: new Date()
          });

          this.backgroundAnalysis(state, transcript, aiReplyText, sessionId);
          await stateService.updateSession(sessionId, state);

          console.log(`✅ Successfully used fallback provider: ${fallbackProvider}`);
          return {
            text: aiReplyText,
            isStreamed: true,
            metadata: {
              isInterviewComplete: false,
              usedFallback: true,
              fallbackProvider: fallbackProvider
            }
          };
        } catch (fallbackError) {
          console.error('❌ Fallback provider also failed:', fallbackError);
          // Если fallback тоже не работает - завершаем интервью с отчетом
          console.warn('⚠️ All LLM providers failed. Completing interview with error report.');
          
          const errorMessage = "Извините, произошла техническая ошибка с системой ИИ. Интервью завершено. Сейчас будет подготовлен финальный отчет на основе имеющихся данных.";
          if (onChunk) onChunk(errorMessage);
          
          state.conversationHistory.push({
            role: 'assistant',
            content: errorMessage,
            timestamp: new Date()
          });
          await stateService.updateSession(sessionId, state);
          
          // Генерируем финальный отчет с указанием причины
          const finalReport = await this.generateComprehensiveReport(sessionId, 'Ошибка LLM');
          
          return {
            text: errorMessage,
            metadata: {
              isInterviewComplete: true,
              completionReason: 'Ошибка LLM (все провайдеры недоступны)',
              wasAutomatic: true,
              finalReport: finalReport
            }
          };
        }
      }
      
      // Для других ошибок LLM - также завершаем интервью
      console.error('❌ LLM Error (non-payment):', error.message || error);
      console.warn('⚠️ LLM error occurred. Completing interview with error report.');
      
      const errorMessage = "Извините, произошла техническая ошибка с системой ИИ. Интервью завершено. Сейчас будет подготовлен финальный отчет на основе имеющихся данных.";
      if (onChunk) onChunk(errorMessage);
      
      state.conversationHistory.push({
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      });
      await stateService.updateSession(sessionId, state);
      
      // Генерируем финальный отчет с указанием причины
      const finalReport = await this.generateComprehensiveReport(sessionId, 'Ошибка LLM');
      
      return {
        text: errorMessage,
        metadata: {
          isInterviewComplete: true,
          completionReason: `Ошибка LLM: ${error.message || 'Неизвестная ошибка'}`,
          wasAutomatic: true,
          finalReport: finalReport
        }
      };
    }
  }

  // --- Метод определения необходимости задачи ---
  shouldTriggerCodeTask(state, userTranscript) {
    // Если задача уже была выдана, не выдаем снова
    if (state.hasCodeTask) {
      return { trigger: false };
    }

    const lowerTranscript = userTranscript.toLowerCase();

    // 1. Явный запрос от пользователя
    const practiceKeywords = [
      'практик', 'задач', 'код', 'консол',
      'написать', 'программиров', 'practice', 'code'
    ];

    // Проверяем явный запрос (например: "давай перейдем к практике", "хочу написать код")
    if (practiceKeywords.some(w => lowerTranscript.includes(w)) && lowerTranscript.length < 100) {
      return { trigger: true, reason: 'user_request' };
    }

    // 2. Автоматическое предложение (например, после 2-го сообщения от пользователя)
    // Считаем сообщения пользователя
    const userMsgCount = state.conversationHistory.filter(m => m.role === 'user').length;

    // Предлагаем задачу на 3-м ходе диалога (введение -> вопрос 1 -> вопрос 2 -> ЗАДАЧА)
    if (userMsgCount === 3) {
      return { trigger: true, reason: 'auto_schedule' };
    }

    return { trigger: false };
  }

  // --- Фоновый анализ ---
  async backgroundAnalysis(state, userResponse, aiResponse, sessionId) {
    try {
      const responseLower = aiResponse.toLowerCase();
      if (responseLower.includes("давайте перейдем") || responseLower.includes("следующая тема")) {
        const nextTopic = this.getNextTopic(state.position, state.currentTopic);
        if (nextTopic) {
          state.currentTopic = nextTopic;
          state.topicProgress.add(nextTopic);
        }
      }
      await stateService.updateSession(sessionId, state);
    } catch (e) {
      console.error("Background analysis failed", e);
    }
  }

  async shouldCompleteInterview(sessionId) {
    const state = await stateService.getSession(sessionId);
    if (!state) return { complete: false };

    // 1. Проверка явного запроса пользователя
    const lastUserMsgs = state.conversationHistory
      .filter(m => m.role === 'user')
      .slice(-1)
      .map(m => m.content.toLowerCase());

    const stopWords = ['стоп', 'хватит', 'закончить', 'завершить', 'конец', 'остановись'];

    if (lastUserMsgs.some(msg => stopWords.some(w => msg.includes(w)))) {
      return { complete: true, reason: "Запрос пользователя", userRequested: true };
    }

    const progress = await this.getInterviewProgress(sessionId);
    const duration = await this.calculateDurationMinutes(sessionId);

    // 2. Проверка лимитов
    if (progress.totalExchanges >= COMPLETION_CRITERIA.maxExchanges) {
      return { complete: true, reason: `Достигнут максимальный лимит вопросов (${COMPLETION_CRITERIA.maxExchanges})` };
    }

    // 3. Если тема стала "завершение"
    if (state.currentTopic === 'завершение') {
      return { complete: true, reason: "Темы исчерпаны" };
    }

    // 4. Минимальная продолжительность
    if (duration >= COMPLETION_CRITERIA.minDuration &&
      progress.totalExchanges >= COMPLETION_CRITERIA.minExchanges &&
      progress.topicsCovered.length >= 3) {
      return {
        complete: true,
        reason: `Достигнута минимальная продолжительность и охват тем`,
        userRequested: false
      };
    }

    return { complete: false };
  }

  buildTextOnlyPrompt(state, userInput) {
    const history = state.conversationHistory.slice(-6).map(m => `${m.role === 'user' ? 'Кандидат' : 'Интервьюер'}: ${m.content}`).join('\n');
    return `Ты - профессиональный IT-интервьюер. Позиция: ${state.position}. Тема: ${state.currentTopic}.
    
    Твоя цель: оценить знания, задать уточняющий вопрос или перейти к следующей теме.
    Не будь слишком многословным (не более 2-3 предложений). Не повторяй приветствие.
    
    Если кандидат ответил, оцени и задай следующий вопрос.
    Если кандидат ответил неправильно, мягко поправь и задай другой вопрос.
    
    История диалога:
    ${history}
    
    Ответ кандидата: "${userInput}"
    
    Твой ответ (текст):`;
  }

  getNextTopic(position, currentTopic) {
    const seq = this.topicSequences[position] || this.topicSequences.frontend;
    const idx = seq.indexOf(currentTopic);
    return idx < seq.length - 1 ? seq[idx + 1] : 'завершение';
  }

  async getInterviewProgress(sessionId) {
    const state = await stateService.getSession(sessionId);
    if (!state) return null;

    const totalExchanges = state.conversationHistory.filter(m => m.role === 'user').length;
    const averageScore = 7.5;
    const topicsCovered = Array.from(state.topicProgress || []);

    return {
      totalExchanges: totalExchanges,
      averageScore: averageScore,
      topicsCovered: topicsCovered,
      completionPercentage: Math.min(100, (totalExchanges / COMPLETION_CRITERIA.maxExchanges) * 100)
    };
  }

  async generateComprehensiveReport(sessionId, errorReason = null) {
    console.log(`📊 Generating REAL report for session ${sessionId}...`);
    if (errorReason) {
      console.warn(`⚠️ Report generation reason: ${errorReason}`);
    }

    // 1. Получаем историю сообщений
    const state = await stateService.getSession(sessionId);
    if (!state || !state.conversationHistory || state.conversationHistory.length === 0) {
      console.warn("⚠️ No history found, returning mock report");
      return await this.createMockFinalReport(sessionId, errorReason);
    }

    // Получаем заметки из сессии
    const { mockDB } = require('../mockData');
    const session = mockDB.sessions.find(s => s.id === sessionId);
    const notes = session?.notes || '';
    const codeTaskResults = session?.codeTaskResults || [];

    const duration = await this.calculateDurationMinutes(sessionId);
    const totalExchanges = state.conversationHistory.filter(m => m.role === 'user').length;
    const topicsCovered = Array.from(state.topicProgress || []).length;
    const hasCodeTask = state.hasCodeTask || false;
    const codeTaskPassed = codeTaskResults.length > 0 && codeTaskResults.some(r => r.allTestsPassed);
    const codeTaskScore = codeTaskResults.length > 0 ? codeTaskResults[codeTaskResults.length - 1].score : null;

    // 2. Формируем контекст диалога для LLM
    const conversationText = state.conversationHistory
      .map(m => `${m.role === 'user' ? 'Кандидат' : 'Интервьюер (AI)'}: ${m.content}`)
      .join('\n');

    // Определяем качество интервью для контекста оценки
    const isShortInterview = totalExchanges < 3 || duration < 2;
    const isInsufficientData = totalExchanges < 2 || conversationText.length < 100;

    const prompt = `
      Ты - старший технический интервьюер (Senior Technical Interviewer). 
      Твоя задача - проанализировать проведенное собеседование и составить финальный отчет в формате JSON.
      
      КОНТЕКСТ ИНТЕРВЬЮ:
      - ПОЗИЦИЯ: ${state.position}
      - ПРОДОЛЖИТЕЛЬНОСТЬ: ${duration} мин
      - КОЛИЧЕСТВО ОБМЕНОВ (вопрос-ответ): ${totalExchanges}
      - ТЕМ ПОКРЫТО: ${topicsCovered}
      - ПРАКТИЧЕСКОЕ ЗАДАНИЕ: ${hasCodeTask ? 'Да' : 'Нет'}
      ${hasCodeTask && codeTaskResults.length > 0 ? `- РЕЗУЛЬТАТ ПРАКТИКИ: ${codeTaskPassed ? 'Пройдено успешно' : 'Не пройдено или частично'}, балл: ${codeTaskScore !== null ? codeTaskScore : 'не указан'}` : ''}
      
      ${isShortInterview ? '⚠️ ВНИМАНИЕ: Интервью было очень коротким. Оценка должна быть консервативной и учитывать недостаток данных.' : ''}
      ${isInsufficientData ? '⚠️ ВНИМАНИЕ: Недостаточно данных для полноценной оценки. Confidence должен быть низким (0.3-0.5), а final_score должен отражать ограниченность данных.' : ''}
      
      ИСТОРИЯ ДИАЛОГА:
      ${conversationText}
      
      ${notes ? `ЗАМЕТКИ ИНТЕРВЬЮЕРА:
      ${notes}` : ''}
      
      ${errorReason ? `⚠️ ВАЖНО: Интервью было прервано из-за технической ошибки: ${errorReason}. Оценка должна быть консервативной, так как данных недостаточно. В detailed_feedback обязательно укажи, что интервью было прервано из-за технической ошибки и рекомендуется повторное собеседование.` : ''}
      
      ТРЕБОВАНИЯ К ОЦЕНКЕ:
      1. **Строгость оценки:**
         ${isShortInterview ? '- Интервью было прервано рано - оценка должна быть НИЗКОЙ (3-5/10) с низкой уверенностью (0.3-0.5)' : ''}
         ${isInsufficientData ? '- Недостаточно данных - оценка должна быть НИЗКОЙ (2-4/10) с очень низкой уверенностью (0.2-0.4)' : ''}
         - Если было менее 3 обменов: final_score НЕ БОЛЕЕ 5/10, confidence НЕ БОЛЕЕ 0.5
         - Если было менее 2 обменов: final_score НЕ БОЛЕЕ 3/10, confidence НЕ БОЛЕЕ 0.3
         - Если интервью длилось менее 2 минут: final_score НЕ БОЛЕЕ 4/10
      
      2. **Учет практического задания:**
         ${hasCodeTask ? 
           (codeTaskResults.length > 0 ? 
             (codeTaskPassed ? 
               '- Практическое задание ВЫПОЛНЕНО УСПЕШНО - это СИЛЬНЫЙ ПЛЮС к оценке (+1-2 балла к final_score)' :
               '- Практическое задание НЕ ВЫПОЛНЕНО или выполнено плохо - это МИНУС к оценке (-1-2 балла от final_score)'
             ) :
             '- Практическое задание было предложено, но результат не получен - не учитывать в оценке'
           ) :
           '- Практического задания НЕ было - это нормально, но не добавляет баллов'
         }
      
      3. **КРИТИЧНОСТЬ к заявлениям кандидата:**
         - НЕ ДОБАВЛЯЙ в "strengths" (сильные стороны) технологии/навыки, которые НЕ БЫЛИ ПРОВЕРЕНЫ
         - Если кандидат только УПОМЯНУЛ технологию (например, "я делал на Python"), но не ответил на вопросы по ней - это НЕ сильная сторона
         - Сильные стороны должны быть ТОЛЬКО из проверенных знаний (есть вопросы и ответы по теме)
         - Если интервью короткое (менее 3 обменов) - НЕ добавляй технические навыки в сильные стороны, только общие качества (коммуникация, если видна)
         - Если кандидат только заявил о навыке без проверки - добавь его в "improvements" или "potential_areas", но НЕ в "strengths"
         - Будь КРИТИЧНЫМ: заявление ≠ знание. Нужна проверка.
      
      4. **Качество оценки:**
         - Оценивай ТОЛЬКО на основе реальных ответов кандидата
         - Если данных мало - будь консервативным (низкая оценка, низкая уверенность)
         - Если данных достаточно (3+ обменов, 2+ минут) - оценивай по содержанию
         - Если данных много (5+ обменов, 5+ минут) - оценивай полно и справедливо
         - НЕ завышай оценку из-за упоминаний технологий без проверки
      
      5. **Рекомендация:**
         - При final_score < 4: recommendation = "no_hire"
         - При final_score 4-6: recommendation = "maybe_hire" или "no_hire"
         - При final_score 7-8: recommendation = "hire" или "maybe_hire"
         - При final_score 9-10: recommendation = "strong_hire" или "hire"
      
      ФОРМАТ ОТВЕТА (JSON):
      Ты ДОЛЖЕН вернуть ТОЛЬКО валидный JSON без Markdown разметки. Структура:
      {
        "overall_assessment": {
          "final_score": (число 1-10),
          "level": "Junior/Middle/Senior",
          "recommendation": "strong_hire" | "hire" | "maybe_hire" | "no_hire",
          "confidence": (число 0-1),
          "strengths": ["список сильных сторон"],
          "improvements": ["список зон роста"],
          "potential_areas": []
        },
        "technical_skills": {
          "topics_covered": ["список тем"],
          "strong_areas": ["сильные темы"],
          "weak_areas": ["слабые темы"],
          "technical_depth": (число 1-10),
          "recommendations": ["что поучить"]
        },
        "behavioral_analysis": {
          "communication_skills": { "score": (1-10), "feedback": "текст" },
          "problem_solving": { "score": (1-10), "feedback": "текст" },
          "learning_ability": { "score": (1-10), "feedback": "текст" },
          "adaptability": { "score": (1-10), "feedback": "текст" }
        },
        "interview_analytics": {
          "total_duration": "${duration} мин",
          "total_questions": (число),
          "topics_covered_count": (число),
          "average_response_quality": (число 1-10),
          "topic_progression": [],
          "action_pattern": { 
             "total_actions": 0, 
             "action_breakdown": {}, 
             "most_common_action": "none", 
             "completion_rate": "completed" 
          }
        },
        "detailed_feedback": "Развернутый текстовый фидбек для кандидата (на 'вы').",
        "next_steps": ["рекомендованные следующие шаги"],
        "raw_data": { "evaluationHistory": [], "actionsHistory": [] }
      }
    `;

    try {
      // Передаем sessionId для кэширования контекста при генерации отчета
      const llm = getModel({ 
        provider: 'gigachat', 
        model: 'GigaChat-2-Max', 
        streaming: false, 
        temperature: 0.4,
        sessionId: sessionId  // Для кэширования контекста через X-Session-ID (GigaChat API)
      });

      const response = await llm.invoke(prompt);
      const responseText = typeof response === 'string' ? response : response.content;

      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      const report = JSON.parse(cleanJson);

      // Добавляем заметки в отчет
      if (notes && notes.trim().length > 0) {
        report.notes = notes;
      }

      console.log("✅ Report generated successfully");
      return report;

    } catch (error) {
      console.error("❌ Error generating report with LLM:", error);
      
      // Проверяем, является ли это ошибкой оплаты GigaChat (402 Payment Required)
      const isPaymentError = error?.response?.status === 402 || 
                            error?.message?.includes('402') || 
                            error?.message?.includes('Payment Required');
      
      if (isPaymentError) {
        console.warn('⚠️ GigaChat Payment Required (402) during report generation. Using mock report.');
      }
      
      // В любом случае возвращаем mock отчет при ошибке
      return await this.createMockFinalReport(sessionId, errorReason);
    }
  }

  async createMockFinalReport(sessionId = null, errorReason = null) {
    // Получаем заметки и данные сессии, если sessionId передан
    let notes = '';
    let totalExchanges = 0;
    let duration = 0;
    let hasCodeTask = false;
    let codeTaskPassed = false;
    
    if (sessionId) {
      try {
        const { mockDB } = require('../mockData');
        const session = mockDB.sessions.find(s => s.id === sessionId);
        notes = session?.notes || '';
        
        // Получаем состояние для расчета метрик
        const state = await stateService.getSession(sessionId);
        if (state) {
          totalExchanges = state.conversationHistory?.filter(m => m.role === 'user').length || 0;
          hasCodeTask = state.hasCodeTask || false;
          if (state.sessionStart) {
            duration = Math.round((new Date() - new Date(state.sessionStart)) / 1000 / 60);
          }
        }
        
        // Проверяем результаты практического задания
        if (session?.codeTaskResults && session.codeTaskResults.length > 0) {
          codeTaskPassed = session.codeTaskResults.some(r => r.allTestsPassed);
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch session data for mock report:', error.message);
      }
    }

    // Рассчитываем оценку на основе метрик
    let baseScore = 5.0; // Базовая оценка
    let confidence = 0.5;
    
    // Учет количества обменов
    if (totalExchanges >= 5) {
      baseScore = 7.5;
      confidence = 0.8;
    } else if (totalExchanges >= 3) {
      baseScore = 6.0;
      confidence = 0.6;
    } else if (totalExchanges >= 2) {
      baseScore = 4.0;
      confidence = 0.4;
    } else if (totalExchanges >= 1) {
      baseScore = 3.0;
      confidence = 0.3;
    } else {
      baseScore = 2.0;
      confidence = 0.2;
    }
    
    // Учет длительности
    if (duration < 2) {
      baseScore = Math.min(baseScore, 4.0);
      confidence = Math.min(confidence, 0.4);
    }
    
    // Учет практического задания
    if (hasCodeTask && codeTaskPassed) {
      baseScore = Math.min(10, baseScore + 1.5);
      confidence = Math.min(1.0, confidence + 0.1);
    } else if (hasCodeTask && !codeTaskPassed) {
      baseScore = Math.max(1, baseScore - 1.5);
      confidence = Math.max(0.1, confidence - 0.1);
    }
    
    // Определяем рекомендацию
    let recommendation = "no_hire";
    if (baseScore >= 8) recommendation = "strong_hire";
    else if (baseScore >= 7) recommendation = "hire";
    else if (baseScore >= 5) recommendation = "maybe_hire";
    
    // Определяем уровень
    let level = "Junior";
    if (baseScore >= 8) level = "Senior";
    else if (baseScore >= 6) level = "Middle";
    
    const report = {
      overall_assessment: {
        final_score: Math.round(baseScore * 10) / 10,
        level: level,
        recommendation: recommendation,
        confidence: Math.round(confidence * 10) / 10,
        strengths: totalExchanges >= 3 && duration >= 2 
          ? (codeTaskPassed ? ["Базовые знания", "Практические навыки"] : ["Базовые знания", "Готовность к обучению"])
          : (totalExchanges > 0 ? ["Готовность к общению"] : ["Недостаточно данных для оценки"]),
        improvements: totalExchanges >= 3 
          ? (hasCodeTask && !codeTaskPassed ? ["Практические навыки программирования", "Углубить знания"] : ["Нужно больше практики", "Углубить знания"])
          : ["Необходимо пройти полноценное собеседование", "Проверить технические навыки на практике"],
        potential_areas: []
      },
      technical_skills: {
        topics_covered: totalExchanges >= 3 ? ["Frontend Core", "React", "State Management"] : ["Недостаточно данных"],
        strong_areas: totalExchanges >= 3 && duration >= 2 ? (codeTaskPassed ? ["UI Development", "Практические навыки"] : ["UI Development"]) : [],
        weak_areas: totalExchanges >= 3 ? ["DevOps basics"] : ["Недостаточно данных для оценки"],
        technical_depth: 8,
        recommendations: ["Поглубже изучить CI/CD"]
      },
      behavioral_analysis: {
        communication_skills: { score: 9, feedback: "Кандидат говорит уверенно и четко." },
        problem_solving: { score: 8, feedback: "Хорошо структурирует ответ." },
        learning_ability: { score: 8, feedback: "Быстро схватывает контекст." },
        adaptability: { score: 8, feedback: "Адекватно реагирует на сложные вопросы." }
      },
      interview_analytics: {
        total_duration: `${duration} мин`,
        total_questions: totalExchanges,
        topics_covered_count: totalExchanges > 0 ? 1 : 0,
        average_response_quality: Math.round(baseScore / 10 * 5) + 3,
        topic_progression: totalExchanges > 0 ? ["Intro"] : [],
        action_pattern: { total_actions: totalExchanges, action_breakdown: {}, most_common_action: "question", completion_rate: "completed" }
      },
      detailed_feedback: errorReason 
        ? `Интервью было прервано из-за технической ошибки: ${errorReason}. Оценка составлена на основе имеющихся данных (${totalExchanges} обменов, ${duration} минут). Из-за ограниченности данных оценка может быть неточной. Рекомендуется провести повторное собеседование.`
        : totalExchanges < 3 
          ? `Это предварительный отчет. Оценка основана на ограниченных данных (${totalExchanges} обменов, ${duration} минут). Рекомендуется провести более полное собеседование для точной оценки.`
          : `Оценка основана на ${totalExchanges} обменах за ${duration} минут.`,
      next_steps: errorReason 
        ? ["Провести повторное собеседование после устранения технических проблем", "Оценить кандидата на основе имеющихся данных"]
        : totalExchanges < 3 
          ? ["Продолжить собеседование для более полной оценки", "Проверить технические навыки на практике"]
          : ["Продолжить развитие в указанных направлениях"],
      raw_data: { evaluationHistory: [], actionsHistory: [] }
    };

    // Добавляем заметки, если они есть
    if (notes && notes.trim().length > 0) {
      report.notes = notes;
    }

    return report;
  }

  async calculateDurationMinutes(sessionId) {
    const state = await stateService.getSession(sessionId);
    if (!state || !state.sessionStart) return 0;
    const start = new Date(state.sessionStart);
    const end = new Date();
    return Math.max(1, Math.round((end - start) / 60000));
  }

  getSmartCompletionMessage(_report) {
    return "Отчет готов. Вы можете ознакомиться с ним.";
  }
}

module.exports = new InterviewLogicService();