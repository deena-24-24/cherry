// stubs/controllers/codeController.js
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { mockDB } = require('../mockData');
const { v4: uuidv4 } = require('uuid');

// Статусы выполнения
const ExecutionStatus = {
  OK: 'OK',
  COMPILATION_ERROR: 'CE',
  RUNTIME_ERROR: 'RE',
  TIME_LIMIT_EXCEEDED: 'TL',
  WRONG_ANSWER: 'WA',
  SERVER_ERROR: 'SE'
};

class CodeController {
  constructor() {
    this.tempDir = path.join(__dirname, '..', '..', 'temp_code');
    this.maxExecutionTime = 10000;
  }

  async executeCode(req, res) {
    try {
      const { code, language, sessionId, stdin = '', testCases = [] } = req.body;

      // Валидация
      if (!code || !language) {
        return res.status(400).json({
          success: false,
          error: 'Укажите код и язык программирования',
          output: '',
          status: ExecutionStatus.SERVER_ERROR
        });
      }

      // Если есть тест-кейсы, запускаем тестирование
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
          executionTime: result.executionTime,
          status: result.status || ExecutionStatus.OK
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

    try {
      // Создаем временную папку
      await fs.mkdir(this.tempDir, { recursive: true });

      // Подготовка для каждого языка
      if (language === 'javascript') {
        filepath = path.join(this.tempDir, `${filename}.js`);

        const wrappedCode = this.wrapJavaScriptCode(code, stdin);
        await fs.writeFile(filepath, wrappedCode);
        command = `node "${filepath}"`;

      } else if (language === 'python') {
        filepath = path.join(this.tempDir, `${filename}.py`);

        const wrappedCode = this.wrapPythonCode(code, stdin);
        await fs.writeFile(filepath, wrappedCode);
        command = `python "${filepath}"`;
      } else {
        throw new Error(`Язык "${language}" не поддерживается`);
      }

      // Запускаем выполнение
      const result = await this.executeWithTimeout(command, 10000);

      // Определяем статус выполнения
      let status = ExecutionStatus.OK;
      if (result.error) {
        if (result.error.includes('timeout') || result.error.includes('Таймаут')) {
          status = ExecutionStatus.TIME_LIMIT_EXCEEDED;
        } else if (result.error.includes('SyntaxError') || result.error.includes('ReferenceError')) {
          status = ExecutionStatus.RUNTIME_ERROR;
        } else if (result.error.includes('sum is not defined')) {
          status = ExecutionStatus.COMPILATION_ERROR;
        } else {
          status = ExecutionStatus.RUNTIME_ERROR;
        }
      }

      return {
        success: result.success,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        status: status
      };

    } catch (error) {
      console.error('❌ Ошибка выполнения:', error);
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime,
        status: ExecutionStatus.SERVER_ERROR
      };
    } finally {
      // Очищаем файлы
      await this.cleanupFiles(filepath).catch(() => {});
    }
  }

  // Оборачиваем JavaScript код для вызова функции sum
  wrapJavaScriptCode(code, stdin) {
    // Парсим входные данные (формат: "2 3")
    const numbers = stdin.trim().split(/\s+/).map(Number);
    const a = numbers[0] || 0;
    const b = numbers[1] || 0;

    return `${code}

// Автоматически добавленный вызов функции
try {
  const result = sum(${a}, ${b});
  console.log(result);
} catch (error) {
  console.error('Ошибка:', error.message);
}`;
  }

  // Оборачиваем Python код для вызова функции sum
  wrapPythonCode(code, stdin) {
    // Парсим входные данные (формат: "2 3")
    const numbers = stdin.trim().split(/\s+/).map(Number);
    const a = numbers[0] || 0;
    const b = numbers[1] || 0;

    return `${code}

# Автоматически добавленный вызов функции
try:
    result = sum(${a}, ${b})
    print(result)
except Exception as e:
    print(f'Ошибка: {e}')`;
  }

  executeWithTimeout(command, timeoutMs) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const child = exec(command, (error, stdout, stderr) => {
        const executionTime = Date.now() - startTime;

        resolve({
          success: !error,
          output: stdout || '',
          error: stderr || (error ? error.message : ''),
          executionTime
        });
      });

      // Таймаут
      setTimeout(() => {
        if (child.exitCode === null) {
          child.kill();
          resolve({
            success: false,
            output: '',
            error: `Таймаут выполнения (${timeoutMs/1000} секунд)`,
            executionTime: timeoutMs
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
        error: result.error,
        status: result.status
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
      error: allPassed ? '' : 'Некоторые тесты не пройдены',
      executionTime: totalTime,
      testResults: results,
      passedCount: results.filter(r => r.passed).length,
      totalCount: results.length,
      status: allPassed ? ExecutionStatus.OK : ExecutionStatus.WRONG_ANSWER
    };
  }

  checkTestResult(actual, expected) {
    const cleanActual = actual.trim().replace(/\r\n/g, '\n');
    const cleanExpected = expected.trim().replace(/\r\n/g, '\n');

    // Убираем префикс ошибки если есть
    const actualWithoutError = cleanActual.replace(/^Ошибка:\s*/i, '').replace(/^Error:\s*/i, '');

    return actualWithoutError === cleanExpected;
  }

  async cleanupFiles(filepath) {
    try {
      if (filepath) {
        await fs.unlink(filepath);
      }
    } catch (error) {
      console.errror('⚠️ Не удалось очистить файлы:', error.message);
    }
  }
}

module.exports = new CodeController();