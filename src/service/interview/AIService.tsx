export class AIService {
  async processAudio(audioChunk: ArrayBuffer): Promise<string> {
    return "Это текстовая расшифровка вашего ответа"
  }

  async getAIResponse(userMessage: string, position: string): Promise<string> {
    const responses: Record<string, string> = {
      frontend: "Расскажите о вашем опыте работы с React?",
      backend: "Как вы организуете структуру API?",
      fullstack: "Как вы распределяете задачи между фронтендом и бэкендом?"
    }

    return responses[position] || "Продолжайте, пожалуйста"
  }
}

export const aiService = new AIService()