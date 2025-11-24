// controllers/codeController.js
const { mockDB } = require('../mockData');

class CodeController {
  async executeCode(req, res) {
    try {
      const { code, language, sessionId } = req.body;

      console.log('🔧 Received code execution request:', {
        language,
        sessionId,
        codeLength: code?.length
      });

      // Валидация
      if (!code || !language) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: code and language',
          output: '',
          executionTime: 0
        });
      }

      // Эмуляция выполнения кода
      const result = await this.simulateCodeExecution(code, language);

      console.log('✅ Code execution result:', result);

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

      res.json({
        success: true,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime
      });

    } catch (error) {
      console.error('❌ Error in executeCode:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        output: '',
        executionTime: 0
      });
    }
  }

  // Имитация выполнения кода
  async simulateCodeExecution(code, language) {
    console.log(`🎯 Simulating ${language} code execution`);

    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    try {
      let output = '';
      let error = '';

      // Проверка на ошибки
      if (code.includes('error') || code.includes('throw new Error') || code.includes('undefined(')) {
        error = `RuntimeError: Something went wrong in ${language} execution`;
      } else {
        // Генерация реалистичного вывода
        output = this.generateMockOutput(code, language);
      }

      return {
        output,
        error,
        executionTime: Math.floor(Math.random() * 100) + 50
      };
    } catch (e) {
      return {
        output: '',
        error: `CompilationError: ${e.message}`,
        executionTime: 10
      };
    }
  }

  generateMockOutput(code, language) {
    const logs = [];

    // Извлекаем console.log/print вызовы
    const logPatterns = {
      javascript: /console\.log\(([^)]+)\)/g,
      typescript: /console\.log\(([^)]+)\)/g,
      python: /print\(([^)]+)\)/g
    };

    const pattern = logPatterns[language];
    if (pattern) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const expression = match[1];
        // Безопасное извлечение значений
        if (expression.includes('"') || expression.includes("'")) {
          // Строковые литералы
          logs.push(expression.replace(/['"]/g, ''));
        } else if (expression.includes('+')) {
          // Конкатенация строк
          const parts = expression.split('+').map(part => part.trim().replace(/['"]/g, ''));
          logs.push(parts.join(''));
        } else {
          // Переменные или выражения
          logs.push(`[${expression}]`);
        }
      }
    }

    // Проверяем наличие функций
    if (code.includes('function') || code.includes('def ')) {
      logs.push('✅ Function executed successfully');
    }

    // Проверяем наличие return
    const returnMatch = code.match(/return\s+([^;]+)/);
    if (returnMatch) {
      logs.push(`Return: ${returnMatch[1]}`);
    }

    return logs.length > 0 ? logs.join('\n') : '✅ Code executed (no output)';
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