// components/interview/CodeConsole.tsx
import React, { useState, useEffect } from 'react'
import { useInterviewStore } from '../../store'
import { compilerService } from '../../service/interview/compilerService'
import { Button } from '../ui/Button'
import Editor from 'react-simple-code-editor'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

interface CodeConsoleProps {
  sessionId: string;
}

interface CodeTask {
  id: string;
  title: string;
  description: string;
  initialCode: string;
  language: string;
  tests: {
    input: string;
    expected: string;
  }[];
}

export const CodeConsole: React.FC<CodeConsoleProps> = ({ sessionId }) => {
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [language, setLanguage] = useState('javascript')
  const [currentTask, setCurrentTask] = useState<CodeTask | null>(null)
  const [testResults, setTestResults] = useState<{passed: boolean, message: string}[]>([])
  const { addCodeResult } = useInterviewStore()

  // Моковые задачи
  const codeTasks: CodeTask[] = [
    {
      id: '1',
      title: 'Сумма двух чисел',
      description: 'Напишите функцию sum(a, b), которая возвращает сумму двух чисел',
      initialCode: `function sum(a, b) {\n  // Ваш код здесь\n  \n}\n\n// Пример использования\nconsole.log(sum(2, 3)); // Должно быть 5\nconsole.log(sum(5, 7)); // Должно быть 12`,
      language: 'javascript',
      tests: [
        { input: 'sum(2, 3)', expected: '5' },
        { input: 'sum(5, 7)', expected: '12' },
        { input: 'sum(-1, 1)', expected: '0' }
      ]
    },
    {
      id: '2',
      title: 'Палиндром',
      description: 'Напишите функцию isPalindrome(str), которая проверяет, является ли строка палиндромом',
      initialCode: `function isPalindrome(str) {\n  // Ваш код здесь\n  \n}\n\n// Пример использования\nconsole.log(isPalindrome("racecar")); // true\nconsole.log(isPalindrome("hello"));   // false`,
      language: 'javascript',
      tests: [
        { input: 'isPalindrome("racecar")', expected: 'true' },
        { input: 'isPalindrome("hello")', expected: 'false' },
        { input: 'isPalindrome("a")', expected: 'true' }
      ]
    }
  ];

  useEffect(() => {
    if (codeTasks.length > 0) {
      loadTask(codeTasks[0]);
    }
  }, []);

  const loadTask = (task: CodeTask) => {
    setCurrentTask(task);
    setCode(task.initialCode);
    setLanguage(task.language);
    setOutput('');
    setTestResults([]);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('🔄 Выполнение кода...');
    setTestResults([]);

    try {
      console.log('🚀 Sending code to execution:', { code, language, sessionId });
      const result = await compilerService.executeCode(code, language, sessionId);

      console.log('📨 Received result:', result);
      setOutput(result.error ? `❌ ${result.error}` : result.output);

      addCodeResult({
        output: result.output,
        error: result.error,
        executionTime: result.executionTime
      });

      // Запускаем тесты если нет ошибок
      if (!result.error && currentTask) {
        runTests(result.output);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Execution error:', error);
      setOutput(`❌ Ошибка: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runTests = (executionOutput: string) => {
    if (!currentTask) return;

    const results = currentTask.tests.map(test => {
      // Простая проверка - ищем ожидаемый результат в выводе
      const passed = executionOutput.includes(test.expected);
      return {
        passed,
        message: passed
          ? `✅ ${test.input} → ${test.expected}`
          : `❌ ${test.input} → Ожидалось: ${test.expected}`
      };
    });

    setTestResults(results);
  };

  const highlightCode = (code: string) => {
    try {
      return hljs.highlight(code, {
        language: language === 'typescript' ? 'javascript' : language
      }).value;
    } catch (error) {
      return hljs.highlightAuto(code).value;
    }
  };

  const formatOutput = (text: string) => {
    if (!text) {
      return <div className="text-gray-500 italic">Результат выполнения появится здесь...</div>;
    }

    const lines = text.split('\n');
    return lines.map((line, index) => {
      let className = 'text-green-300';
      if (line.includes('❌') || line.toLowerCase().includes('error')) {
        className = 'text-red-400 font-medium';
      } else if (line.includes('✅') || line.includes('→')) {
        className = 'text-green-400';
      } else if (line.includes('🔄')) {
        className = 'text-yellow-400';
      }
      return (
        <div key={index} className={className}>
          {line}
        </div>
      );
    });
  };

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;

  return (
    <div className="code-console bg-gray-900 rounded-lg h-full flex flex-col border border-gray-700 overflow-hidden">
      {/* Заголовок */}
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white text-lg">💻 Редактор кода</h3>
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-700 text-white text-sm px-3 py-1.5 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
            </select>
            <Button
              onClick={handleRunCode}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Выполняется...
                </span>
              ) : (
                '🚀 Запустить код'
              )}
            </Button>
          </div>
        </div>

        {/* Выбор задачи */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {codeTasks.map(task => (
            <button
              key={task.id}
              onClick={() => loadTask(task)}
              className={`px-3 py-1.5 text-sm rounded border whitespace-nowrap transition-colors ${
                currentTask?.id === task.id
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {task.title}
            </button>
          ))}
        </div>
      </div>

      {/* Описание задачи */}
      {currentTask && (
        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
          <h4 className="font-medium text-white mb-1">{currentTask.title}</h4>
          <p className="text-sm text-gray-300">{currentTask.description}</p>
          {totalTests > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="text-xs text-gray-400">
                Тесты: {passedTests}/{totalTests} пройдено
              </div>
              {passedTests === totalTests && totalTests > 0 && (
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">✓ Все тесты пройдены!</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Основной контент */}
      <div className="flex-1 grid grid-rows-[1fr_auto] min-h-0">
        {/* Редактор кода */}
        <div className="relative bg-gray-950 overflow-auto">
          <Editor
            value={code}
            onValueChange={setCode}
            highlight={highlightCode}
            padding={16}
            style={{
              fontFamily: '"Fira Code", monospace',
              fontSize: 14,
              backgroundColor: '#0a0a0a',
              minHeight: '100%',
            }}
            className="w-full h-full focus:outline-none"
          />
        </div>

        {/* Консоль вывода */}
        <div className="border-t border-gray-700 bg-gray-800">
          <div className="px-4 py-2.5 flex items-center justify-between bg-gray-750 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span className="text-sm font-medium text-gray-300">Результат</span>
            </div>
            {output && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                {output.split('\n').length} строк
              </span>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto">
            {/* Результаты тестов */}
            {testResults.length > 0 && (
              <div className="px-4 py-2 border-b border-gray-700 bg-gray-750">
                <div className="text-sm font-medium text-gray-300 mb-1">Результаты тестов:</div>
                {testResults.map((result, index) => (
                  <div key={index} className={`text-sm ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {result.message}
                  </div>
                ))}
              </div>
            )}

            {/* Вывод выполнения */}
            <div className="px-4 py-3 font-mono">
              <div className="text-sm whitespace-pre-wrap">
                {formatOutput(output)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};