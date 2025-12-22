const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const { AgentExecutor, createToolCallingAgent } = require("langchain/agents");
const { RunnableWithMessageHistory } = require("@langchain/core/runnables");
const { ChatMessageHistory } = require("langchain/stores/message/in_memory");
const { getModel } = require("../llm");
const { tools } = require("./chatAgentTools");

// Хранилище истории чатов в памяти
// В продакшене лучше заменить на Redis (RedisChatMessageHistory)
const messageHistories = new Map();

const getMessageHistoryForSession = (sessionId) => {
  if (!messageHistories.has(sessionId)) {
    messageHistories.set(sessionId, new ChatMessageHistory());
  }
  return messageHistories.get(sessionId);
};

class ChatAgentService {
  constructor() {
    this.agentExecutor = null;
    this.isInitializing = false;
    // Запускаем инициализацию, но не блокируем конструктор
    this.initAgent().catch(e => console.error("Initial Agent Boot Error:", e));
  }

  async initAgent() {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      console.log("⚙️ Starting AI Agent Initialization...");

      // 1. Получаем модель
      // Убедитесь, что GIGA_AUTH корректен в .env
      const llm = getModel({ provider: 'gigachat', streaming: false });

      // 2. Биндим инструменты
      // Проверка на наличие метода bindTools (для совместимости версий)
      if (!llm.bindTools) {
        throw new Error("Selected LLM model does not support tool binding (bindTools method missing).");
      }
      const llmWithTools = llm.bindTools(tools);

      // 3. Создаем промпт
      const prompt = ChatPromptTemplate.fromMessages([
        [
          "system",
          `Ты — карьерный консультант CareerUp AI.

          У тебя есть доступ к инструментам для получения актуальных данных (вакансии, зарплаты, новости).
      
          ПРАВИЛА ИСПОЛЬЗОВАНИЯ ИНСТРУМЕНТОВ:
          1. 🛑 **НЕ ИСПОЛЬЗУЙ инструменты** для общих теоретических вопросов (например, "Что такое ООП?", "Как работает useEffect?", "Напиши пример кода на JS"). Для этого используй **свои внутренние знания**.
          2. ✅ **ИСПОЛЬЗУЙ инструменты**, только когда нужны:
             - Свежие вакансии (HH.ru).
             - Актуальные зарплаты.
             - Отзывы о конкретных компаниях.
             - Новости или события, произошедшие после даты твоего обучения.
             - Ссылки на конкретные репозитории GitHub.
      
          Если пользователь просит написать код или объяснить термин — отвечай мгновенно, не обращаясь к поиску.
          Отвечай на русском языке в формате Markdown.`
        ],
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"],
        new MessagesPlaceholder("agent_scratchpad"),
      ]);

      // 4. Создаем агента
      const agent = await createToolCallingAgent({
        llm: llmWithTools,
        tools,
        prompt,
      });

      // 5. Создаем исполнителя
      this.agentExecutor = new AgentExecutor({
        agent,
        tools,
        verbose: false,
        handleParsingErrors: true, // Позволяет агенту исправлять ошибки вызова инструментов
        maxIterations: 5, // Защита от бесконечных циклов
      });

      console.log("🤖 Chat Agent Successfully Initialized with Tools");
    } catch (error) {
      console.error("❌ Agent Initialization Failed:", error);
      this.agentExecutor = null; // Сбрасываем, чтобы попробовать снова при запросе
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Обработка сообщения пользователя
   * @param {string} sessionId - ID сессии пользователя
   * @param {string} message - Текст сообщения
   */
  async processMessage(sessionId, message) {
    // Если агент не готов, пробуем инициализировать снова
    if (!this.agentExecutor) {
      await this.initAgent();
      if (!this.agentExecutor) {
        console.warn("⚠️ Agent still not ready. Switching to Fallback Mode.");
        return this.fallbackSimpleChat(sessionId, message);
      }
    }

    try {
      const agentWithHistory = new RunnableWithMessageHistory({
        runnable: this.agentExecutor,
        getMessageHistory: (sid) => getMessageHistoryForSession(sid),
        inputMessagesKey: "input",
        historyMessagesKey: "chat_history",
      });

      console.log(`🏃‍♂️ Agent running for session: ${sessionId}`);

      const result = await agentWithHistory.invoke(
        { input: message },
        { configurable: { sessionId } }
      );

      return result.output;

    } catch (error) {
      console.error("❌ Error during Agent Execution:", error.message);
      // Если произошла ошибка во время выполнения (например, таймаут API инструментов),
      // переходим на простой режим, чтобы пользователь хоть что-то получил.
      return this.fallbackSimpleChat(sessionId, message);
    }
  }

  /**
   * Простой режим чата (без инструментов), если агент сломался
   */
  async fallbackSimpleChat(sessionId, message) {
    try {
      console.log("🔄 Fallback: Executing simple LLM request...");
      const llm = getModel({ provider: 'gigachat', streaming: false });

      const history = getMessageHistoryForSession(sessionId);

      // Примечание: GigaChat SDK может требовать другой формат истории,
      // здесь используем прямой invoke с текстом или массивом, который поддерживает getModel
      const response = await llm.invoke([
        ["system", "Ты карьерный консультант. Отвечай в формате Markdown."],
        ["human", message]
      ]);

      const responseText = typeof response === 'string' ? response : response.content;

      // Сохраняем в историю (чтобы при восстановлении агента контекст не пропал)
      await history.addUserMessage(message);
      await history.addAIChatMessage(responseText);

      return responseText;

    } catch (fallbackError) {
      console.error("❌ Fallback Fatal Error:", fallbackError);
      return "Произошла ошибка соединения с ИИ-сервисом. Пожалуйста, попробуйте позже.";
    }
  }
}

const chatAgentService = new ChatAgentService();
module.exports = chatAgentService;