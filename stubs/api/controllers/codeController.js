const CodeExecution = require('../models/CodeExecution');

class CodeController {
  // Выполнение кода
  async executeCode(req, res) {
    try {
      const { sessionId, code, language } = req.body;

      // Эмуляция выполнения кода
      const result = await this.simulateCodeExecution(code, language);

      // Сохраняем результат в базу
      const execution = new CodeExecution({
        sessionId,
        code,
        language,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        status: result.error ? 'error' : 'success'
      });

      await execution.save();

      res.json({
        success: true,
        result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Получение истории выполнения кода для сессии
  async getExecutionHistory(req, res) {
    try {
      const { sessionId } = req.params;

      const executions = await CodeExecution.find({ sessionId })
        .sort({ createdAt: -1 })
        .limit(20);

      res.json({
        success: true,
        executions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Эмуляция выполнения кода
  async simulateCodeExecution(code, language) {
    // Имитация задержки выполнения
    await new Promise(resolve => setTimeout(resolve, 1000));

    const languageOutputs = {
      javascript: 'Hello from JavaScript!\nCode executed successfully.',
      typescript: 'Hello from TypeScript!\nCode executed successfully.',
      python: 'Hello from Python!\nCode executed successfully.',
      java: 'Hello from Java!\nCode executed successfully.'
    };

    const output = languageOutputs[language] || `Code executed in ${language}\nExecution completed.`;

    return {
      output,
      error: '',
      executionTime: 150 + Math.floor(Math.random() * 100)
    };
  }
}

module.exports = new CodeController();