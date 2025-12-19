const { getModel } = require('../llm');
const stateService = require('./interviewStateService');

const initialGreetings = {
  frontend: "Здравствуйте! Давайте начнем наше собеседование на позицию Frontend-разработчика. Расскажите, пожалуйста, немного о себе и вашем опыте.",
  backend: "Добрый день. Рад приветствовать вас на собеседовании на позицию Backend-разработчика. Для начала, расскажите о своем самом интересном проекте.",
  fullstack: "Здравствуйте! Начнем собеседование на позицию Fullstack-разработчика. Расскажите о себе и технологиях, с которыми вы предпочитаете работать.",
};

const COMPLETION_CRITERIA = {
  minExchanges: 8,
  targetScore: 7.0,
  maxExchanges: 25,
  minTopics: 4,
  minDuration: 5
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
    // Обновляем позицию, если она изменилась (например, перезаход с другой страницы)
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
    // 1. Проверка сессии
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
      // 3. ПРОВЕРКА НА ЗАВЕРШЕНИЕ
      const completionCheck = await this.shouldCompleteInterview(sessionId);

      if (completionCheck.complete) {
        let finalReport;
        try {
          finalReport = await this.generateComprehensiveReport(sessionId);
        } catch (error) {
          console.error('Error generating report:', error);
          const duration = await this.calculateDurationMinutes(sessionId);
          finalReport = this.createEmptyInterviewReport(sessionId, duration, 'llm_error');
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

      // 4. Если не завершаем — формируем промпт
      const prompt = this.buildTextOnlyPrompt(state, transcript);

      // 5. Запускаем стриминг
      const llm = getModel({ provider: 'gigachat', model: 'GigaChat-2-Max', streaming: true, temperature: 0.7 });

      const stream = await llm.stream(prompt);

      let aiReplyText = "";

      for await (const chunk of stream) {
        const content = chunk.content;
        if (content) {
          aiReplyText += content;
          // Сразу отправляем части текста на клиент
          if (onChunk) onChunk(content);
        }
      }

      // 6. Обновляем историю
      state.conversationHistory.push({
        role: 'assistant',
        content: aiReplyText,
        timestamp: new Date()
      });

      // 7. Фоновый анализ (не блокирует ответ)
      this.backgroundAnalysis(state, transcript, aiReplyText, sessionId);

      await stateService.updateSession(sessionId, state);

      return {
        text: aiReplyText,
        isStreamed: true
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
        if (nextTopic !== 'завершение') {
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
    // Берем последние 3 сообщения пользователя
    const lastUserMsgs = state.conversationHistory
      .filter(m => m.role === 'user')
      .slice(-3)
      .map(m => m.content.toLowerCase());

    const stopWords = ['стоп', 'хватит', 'закончить', 'завершить', 'конец', 'остановись'];

    if (lastUserMsgs.some(msg => stopWords.some(w => msg.includes(w)))) {
      return { complete: true, reason: "Запрос пользователя", userRequested: true };
    }

    // 2. Проверка лимитов
    const progress = await this.getInterviewProgress(sessionId);

    if (progress.totalExchanges >= COMPLETION_CRITERIA.maxExchanges) {
      return { complete: true, reason: "Достигнут лимит вопросов" };
    }

    return { complete: false };
  }

  buildTextOnlyPrompt(state, userInput) {
    const history = state.conversationHistory.slice(-6).map(m => `${m.role === 'user' ? 'Кандидат' : 'Интервьюер'}: ${m.content}`).join('\n');
    return `Ты - дружелюбный и профессиональный IT-интервьюер. Ты проводишь собеседование на позицию ${state.position}.
    Текущая тема обсуждения: ${state.currentTopic}.
    
    Твоя цель:
    1. Оценить ответ кандидата (про себя).
    2. Задать ОДИН следующий вопрос по текущей теме или углубиться в детали.
    3. Если тема исчерпана, предложить перейти к следующей.
    
    История диалога (последние сообщения):
    ${history}
    
    Кандидат только что сказал: "${userInput}"
    
    Твой ответ (только текст вопроса или комментария, без разметки, без JSON):`;
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
      averageScore: 7.5, // Mock
      topicsCovered: Array.from(state.topicProgress || []),
      completionPercentage: Math.min(100, (state.conversationHistory.length / 50) * 100)
    };
  }

  async generateComprehensiveReport(sessionId) {
    const state = await stateService.getSession(sessionId);
    if (state) {
      stateService.deleteSession(sessionId);
    }
    return this.createMockFinalReport();
  }

  createMockFinalReport() {
    return {
      overall_assessment: { final_score: 8.0, level: "Middle", recommendation: "hire", confidence: 0.9, strengths: ["React", "CSS"], improvements: ["Node.js"], potential_areas: [] },
      technical_skills: { topics_covered: ["Frontend", "React"], strong_areas: ["UI"], weak_areas: ["Backend"], technical_depth: 8, recommendations: ["Изучить Docker"] },
      behavioral_analysis: { communication_skills: { score: 8, feedback: "Отлично" }, problem_solving: { score: 7, feedback: "Хорошо" }, learning_ability: { score: 8, feedback: "Быстро" }, adaptability: { score: 8, feedback: "Гибко" } },
      interview_analytics: { total_duration: "15 мин", total_questions: 10, topics_covered_count: 3, average_response_quality: 8, topic_progression: [], action_pattern: { total_actions: 10, action_breakdown: {}, most_common_action: "", completion_rate: "completed" } },
      detailed_feedback: "Кандидат показал хорошие знания.",
      next_steps: ["Техническое интервью"],
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
    return "Собеседование завершено. Спасибо за уделенное время.";
  }
}

module.exports = new InterviewLogicService();