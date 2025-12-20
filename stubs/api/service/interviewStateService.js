class InterviewStateService {
  constructor() {
    this.conversationStates = new Map(); // Активные сессии
    this.evaluationHistory = new Map(); // Завершенные отчеты
  }

  // --- Session State (Hot Data) ---

  async getSession(sessionId) {
    return this.conversationStates.get(sessionId) || null;
  }

  async createSession(sessionId, state) {
    this.conversationStates.set(sessionId, state);
    return state;
  }

  async updateSession(sessionId, state) {
    this.conversationStates.set(sessionId, state);
    return state;
  }

  async deleteSession(sessionId) {
    this.conversationStates.delete(sessionId);
  }

  async hasSession(sessionId) {
    return this.conversationStates.has(sessionId);
  }

  // --- Reports (Cold Data) ---

  async getReport(sessionId) {
    return this.evaluationHistory.get(sessionId) || null;
  }

  async saveReport(sessionId, report) {
    this.evaluationHistory.set(sessionId, report);
  }

  async hasReport(sessionId) {
    return this.evaluationHistory.has(sessionId);
  }

  // Только для дебага
  async getAllSessions() {
    return this.conversationStates;
  }
}

module.exports = new InterviewStateService();