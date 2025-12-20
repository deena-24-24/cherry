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
        actionsHistory: []
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

      // 4. ГЕНЕРАЦИЯ ОБЫЧНОГО ОТВЕТА (ЕСЛИ ЛИМИТЫ НЕ ПРЕВЫШЕНЫ)
      const prompt = this.buildTextOnlyPrompt(state, transcript);
      const llm = getModel({ provider: 'gigachat', model: 'GigaChat-2-Max', streaming: true, temperature: 0.7 });
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
            isInterviewComplete: true, // Включаем завершение
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
      const fallback = "Извините, произошла техническая заминка. Повторите, пожалуйста, ваш ответ.";
      if (onChunk) onChunk(fallback);
      return { text: fallback };
    }
  }

  // --- Фоновый анализ ---
  async backgroundAnalysis(state, userResponse, aiResponse, sessionId) {
    try {
      const responseLower = aiResponse.toLowerCase();
      // Эвристика для переключения тем
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

    // 2. Проверка лимитов
    const currentExchanges = Math.floor(state.conversationHistory.length / 2);

    console.log(`Session ${sessionId}: Exchanges ${currentExchanges}/${COMPLETION_CRITERIA.maxExchanges}`);

    if (currentExchanges >= COMPLETION_CRITERIA.maxExchanges) {
      return { complete: true, reason: "Достигнут лимит вопросов" };
    }

    // 3. Если тема стала "завершение"
    if (state.currentTopic === 'завершение') {
      return { complete: true, reason: "Темы исчерпаны" };
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
    return {
      totalExchanges: Math.floor(state.conversationHistory.length / 2),
      averageScore: 7.5,
      topicsCovered: Array.from(state.topicProgress || []),
      completionPercentage: Math.min(100, (state.conversationHistory.length / COMPLETION_CRITERIA.maxExchanges) * 100)
    };
  }

  async generateComprehensiveReport(sessionId) {
    console.log(`📊 Generating REAL report for session ${sessionId}...`);

    // 1. Получаем историю сообщений
    const state = await stateService.getSession(sessionId);
    if (!state || !state.conversationHistory || state.conversationHistory.length === 0) {
      console.warn("⚠️ No history found, returning mock report");
      return this.createMockFinalReport();
    }

    // 2. Формируем контекст диалога для LLM
    const conversationText = state.conversationHistory
      .map(m => `${m.role === 'user' ? 'Кандидат' : 'Интервьюер (AI)'}: ${m.content}`)
      .join('\n');

    const prompt = `
      Ты - старший технический интервьюер (Senior Technical Interviewer). 
      Твоя задача - проанализировать проведенное собеседование и составить финальный отчет в формате JSON.
      
      ПОЗИЦИЯ: ${state.position}
      
      ИСТОРИЯ ДИАЛОГА:
      ${conversationText}
      
      ТРЕБОВАНИЯ К ОТЧЕТУ:
      1. Оцени кандидата строго, но справедливо.
      2. Выдели реальные сильные и слабые стороны на основе ответов.
      3. Определи уровень (Junior, Middle, Senior).
      4. Дай рекомендацию (hire, no_hire, etc).
      
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
          "total_duration": "XX мин",
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
      const llm = getModel({ provider: 'gigachat', model: 'GigaChat-2-Max', streaming: false, temperature: 0.4 });

      const response = await llm.invoke(prompt);
      const responseText = typeof response === 'string' ? response : response.content;

      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      const report = JSON.parse(cleanJson);

      console.log("✅ Report generated successfully");
      return report;

    } catch (error) {
      console.error("❌ Error generating report with LLM:", error);
      return this.createMockFinalReport();
    }
  }

  createMockFinalReport() {
    return {
      overall_assessment: {
        final_score: 8.5,
        level: "Middle+",
        recommendation: "hire",
        confidence: 0.9,
        strengths: ["React Hooks", "CSS Grid", "Communication"],
        improvements: ["WebSockets deep dive", "Docker optimization"],
        potential_areas: []
      },
      technical_skills: {
        topics_covered: ["Frontend Core", "React", "State Management"],
        strong_areas: ["UI Development"],
        weak_areas: ["DevOps basics"],
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
        total_duration: "20 мин",
        total_questions: 5,
        topics_covered_count: 4,
        average_response_quality: 8,
        topic_progression: ["Intro", "JS", "React", "Outro"],
        action_pattern: { total_actions: 5, action_breakdown: {}, most_common_action: "question", completion_rate: "completed" }
      },
      detailed_feedback: "Собеседование прошло успешно. Кандидат продемонстрировал глубокие знания в основной специализации.",
      next_steps: ["Назначить техническое интервью с тимлидом", "Предложить оффер"],
      raw_data: { evaluationHistory: [], actionsHistory: [] }
    };
  }

  createEmptyInterviewReport(sessionId, duration, reason) {
    return this.createMockFinalReport();
  }

  async calculateDurationMinutes(sessionId) {
    const state = await stateService.getSession(sessionId);
    if (!state || !state.sessionStart) return 0;
    const start = new Date(state.sessionStart);
    const end = new Date();
    return Math.round((end - start) / 60000);
  }

  getSmartCompletionMessage(report) {
    return "Отчет готов. Вы можете ознакомиться с ним.";
  }
}

module.exports = new InterviewLogicService();