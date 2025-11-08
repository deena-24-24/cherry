const { mockDB } = require('../mockData');

class CodeController {
  // Выполнение кода
  async executeCode(req, res) {
    try {
      const { code, language, sessionId } = req.body;

      // Эмуляция выполнения кода
      const result = await this.simulateCodeExecution(code, language);

      // Сохранение в "БД"
      if (sessionId) {
        mockDB.codeExecutions.push({
          sessionId,
          code,
          language,
          output: result.output,
          error: result.error,
          executionTime: result.executionTime,
          status: result.error ? 'error' : 'success',
          executedAt: new Date().toISOString()
        });
      }

      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message, output: '' });
    }
  }

  // Имитация выполнения кода
  async simulateCodeExecution(code, language) {
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 300));

    if (code.includes('error') || code.includes('throw new Error')) {
      return {
        output: '',
        error: `Error: Something went wrong in ${language} execution.`,
        executionTime: 45
      };
    }

    const mockOutputs = {
      javascript: `> ${eval(code)}`,
      python: `Running python code...\nResult: ${code.split('\n').pop()}`,
      typescript: `Type checking passed.\n> ${eval(code.replace(/let|const/g, 'var'))}`
    };

    return {
      output: mockOutputs[language] || `Executed ${language} code successfully.`,
      error: '',
      executionTime: Math.floor(Math.random() * (150 - 50 + 1)) + 50
    };
  }

  async getExecutionHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const history = mockDB.codeExecutions.filter(e => e.sessionId === sessionId);
      res.json({ success: true, history });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new CodeController();