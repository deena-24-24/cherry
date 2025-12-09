// stubs/controllers/codeController.js
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { mockDB } = require('../mockData');

class CodeController {
  constructor() {
    this.tempDir = path.join(__dirname, '..', '..', 'temp_code');
  }

  async executeCode(req, res) {
    try {
      const { code, language, sessionId, stdin = '', testCases = [] } = req.body;

      console.log('🚀 Выполнение кода:', {
        language,
        codeLength: code?.length,
        stdinLength: stdin?.length,
        testCasesCount: testCases?.length
      });

      // Валидация
      if (!code || !language) {
        return res.status(400).json({
          success: false,
          error: 'Укажите код и язык программирования',
          output: ''
        });
      }

      // Если есть тест-кейсы, запускаем каждый отдельно
      if (testCases.length > 0) {
        const results = await this.runTestCases(code, language, testCases, sessionId);
        res.json(results);
      } else {
        // Одиночный запуск
        const result = await this.executeCodeSafely(code, language, stdin);

        // Сохраняем в историю
        if (sessionId && result.success) {
          mockDB.codeExecutions.push({
            sessionId,
            code: code.substring(0, 500),
            language,
            output: result.output,
            error: result.error,
            executionTime: result.executionTime,
            status: result.success ? 'success' : 'error',
            executedAt: new Date().toISOString(),
            stdin: stdin.substring(0, 200)
          });
        }

        res.json({
          success: result.success,
          output: result.output,
          error: result.error,
          executionTime: result.executionTime
        });
      }

    } catch (error) {
      console.error('❌ Ошибка в executeCode:', error);
      res.status(500).json({
        success: false,
        error: `Ошибка сервера: ${error.message}`,
        output: ''
      });
    }
  }

  async executeCodeSafely(code, language, stdin = '') {
    // Создаем уникальный файл
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `code_${timestamp}_${random}`;

    let filepath;
    let command;

    // Подготовка для каждого языка
    if (language === 'javascript' || language === 'typescript') {
      const ext = language === 'typescript' ? 'ts' : 'js';
      filepath = path.join(this.tempDir, `${filename}.${ext}`);

      // Для JS оборачиваем в async функцию для обработки stdin
      const wrappedCode = this.wrapJavaScriptCode(code, stdin);
      await fs.writeFile(filepath, wrappedCode);
      command = language === 'typescript'
        ? `npx ts-node "${filepath}"`
        : `node "${filepath}"`;

    } else if (language === 'python') {
      filepath = path.join(this.tempDir, `${filename}.py`);
      await fs.writeFile(filepath, code);
      command = `python "${filepath}"`;
    } else {
      throw new Error(`Язык "${language}" не поддерживается`);
    }

    try {
      // Создаем временную папку
      await fs.mkdir(this.tempDir, { recursive: true });

      // Запускаем выполнение
      const result = await this.executeWithTimeout(command, stdin, 10000);

      // Очищаем
      await this.cleanupFiles(filepath);

      return result;
    } catch (error) {
      await this.cleanupFiles(filepath).catch(() => {});
      throw error;
    }
  }

  wrapJavaScriptCode(code, stdin) {
    // Если в коде есть console.log, но нет обработки stdin, оставляем как есть
    if (!code.includes('readline') && !code.includes('process.stdin')) {
      return code;
    }

    // Иначе оборачиваем для поддержки stdin
    return `
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let inputLines = [];
rl.on('line', (line) => {
  inputLines.push(line);
});

rl.on('close', () => {
  // Выполняем пользовательский код с доступом к inputLines
  ${code.replace(/readline\(\)/g, 'inputLines.shift()')}
});
`;
  }

  executeWithTimeout(command, stdin, timeoutMs) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const child = exec(command, (error, stdout, stderr) => {
        const executionTime = Date.now() - startTime;

        resolve({
          success: !error,
          output: stdout || '',
          error: stderr || (error ? error.message : ''),
          executionTime,
          memory: 0
        });
      });

      // КРИТИЧНО: передаем stdin в процесс
      if (stdin && stdin.trim()) {
        child.stdin.write(stdin);
        child.stdin.end();
      } else {
        // Если нет stdin, закрываем stdin чтобы избежать зависания
        child.stdin.end();
      }

      // Таймаут
      setTimeout(() => {
        if (child.exitCode === null) {
          child.kill();
          resolve({
            success: false,
            output: '',
            error: `Таймаут выполнения (${timeoutMs/1000} секунд)`,
            executionTime: timeoutMs,
            memory: 0
          });
        }
      }, timeoutMs);
    });
  }

  async runTestCases(code, language, testCases, sessionId) {
    const results = [];
    let allPassed = true;
    let totalTime = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`🧪 Запуск теста ${i + 1}:`, testCase.input);

      const result = await this.executeCodeSafely(code, language, testCase.input);
      totalTime += result.executionTime;

      const passed = this.checkTestResult(result.output, testCase.expected);

      results.push({
        testId: i + 1,
        input: testCase.input,
        expected: testCase.expected,
        actual: result.output.trim(),
        passed,
        executionTime: result.executionTime,
        error: result.error
      });

      if (!passed) allPassed = false;

      // Сохраняем в историю
      if (sessionId) {
        mockDB.codeExecutions.push({
          sessionId,
          code: code.substring(0, 300),
          language,
          output: result.output,
          error: result.error,
          executionTime: result.executionTime,
          status: passed ? 'success' : 'error',
          executedAt: new Date().toISOString(),
          testCase: `Тест ${i + 1}`
        });
      }
    }

    return {
      success: allPassed,
      output: this.formatTestResults(results),
      error: allPassed ? '' : 'Некоторые тесты не пройдены',
      executionTime: totalTime,
      testResults: results,
      passedCount: results.filter(r => r.passed).length,
      totalCount: results.length
    };
  }

  checkTestResult(actual, expected) {
    const cleanActual = actual.trim().replace(/\r\n/g, '\n');
    const cleanExpected = expected.trim().replace(/\r\n/g, '\n');
    return cleanActual === cleanExpected;
  }

  formatTestResults(results) {
    let output = '🧪 Результаты тестов:\n\n';

    results.forEach((test, index) => {
      output += `Тест ${index + 1}:\n`;
      output += `  Вход: ${test.input}\n`;
      output += `  Ожидалось: ${test.expected}\n`;
      output += `  Получено: ${test.actual}\n`;
      output += `  Статус: ${test.passed ? '✅ ПРОЙДЕН' : '❌ НЕ ПРОЙДЕН'}\n`;
      output += `  Время: ${test.executionTime}ms\n\n`;
    });

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    output += `📊 Итого: ${passed}/${total} тестов пройдено`;

    return output;
  }

  async cleanupFiles(filepath) {
    try {
      await fs.unlink(filepath);

      // Удаляем скомпилированные файлы если есть
      const dir = path.dirname(filepath);
      const base = path.basename(filepath, path.extname(filepath));

      const files = await fs.readdir(dir);
      for (const file of files) {
        if (file.startsWith(base)) {
          await fs.unlink(path.join(dir, file)).catch(() => {
          });
        }
      }
    } catch (error) {
      console.log('⚠️  Не удалось очистить файлы:', error.message);
    }
  }

  async getExecutionHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const history = mockDB.codeExecutions
        .filter(e => e.sessionId === sessionId)
        .sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt));

      res.json({
        success: true,
        history,
        count: history.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async clearHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const initialLength = mockDB.codeExecutions.length;

      mockDB.codeExecutions = mockDB.codeExecutions.filter(e => e.sessionId !== sessionId);

      res.json({
        success: true,
        message: `Удалено ${initialLength - mockDB.codeExecutions.length} записей`,
        count: mockDB.codeExecutions.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new CodeController();