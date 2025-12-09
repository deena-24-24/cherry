// components/interview/CodeConsole.tsx
import React, { useState, useEffect } from 'react'
import { useInterviewStore } from '../../store'
import { compilerService } from '../../service/interview/compilerService'
import { Button } from '../ui/Button/Button'
import Editor from 'react-simple-code-editor'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/lib/languages/python'
import 'highlight.js/lib/languages/javascript'

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
  const [testResults, setTestResults] = useState<{ passed: boolean, message: string }[]>([])
  const [history, setHistory] = useState<any[]>([])
  const { addCodeResult } = useInterviewStore()

  const codeTasks: CodeTask[] = [
    {
      id: '1',
      title: 'Сумма двух чисел (JS)',
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
      title: 'Палиндром (JS)',
      description: 'Напишите функцию isPalindrome(str), которая проверяет, является ли строка палиндромом',
      initialCode: `function isPalindrome(str) {\n  // Ваш код здесь\n  \n}\n\n// Пример использования\nconsole.log(isPalindrome("racecar")); // true\nconsole.log(isPalindrome("hello"));   // false`,
      language: 'javascript',
      tests: [
        { input: 'isPalindrome("racecar")', expected: 'true' },
        { input: 'isPalindrome("hello")', expected: 'false' },
        { input: 'isPalindrome("a")', expected: 'true' }
      ]
    },
    {
      id: '3',
      title: 'Сумма двух чисел (Python)',
      description: 'Напишите функцию sum(a, b), которая возвращает сумму двух чисел',
      language: 'python',
      initialCode: `def sum(a, b):
    # Ваш код здесь
    return a + b

# Для тестирования на платформе
if __name__ == "__main__":
    # Тестовые случаи
    test_cases = [
        (2, 3),
        (5, 7),
        (-1, 1)
    ]
    
    for a, b in test_cases:
        result = sum(a, b)
        print(result)`,
      tests: [
        { input: '', expected: '5\n12\n0' }
      ]
    },
    {
      id: '4',
      title: 'Факториал (Python)',
      description: 'Напишите функцию factorial(n), которая вычисляет факториал числа',
      initialCode: `def factorial(n):
    # Ваш код здесь
    
# Пример использования
print(factorial(5))  # Должно быть 120
print(factorial(0))  # Должно быть 1`,
      language: 'python',
      tests: [
        { input: '', expected: '120\n1\n1' }
      ]
    }
  ]

  useEffect(() => {
    if (codeTasks.length > 0) {
      loadTask(codeTasks[0])
      loadHistory()
    }
  }, [])

  const loadTask = (task: CodeTask) => {
    setCurrentTask(task)
    setCode(task.initialCode)
    setLanguage(task.language)
    setOutput('')
    setTestResults([])
  }

  const loadHistory = async () => {
    const historyData = await compilerService.getExecutionHistory(sessionId)
    setHistory(historyData)
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput('🔄 Выполнение кода...')
    setTestResults([])

    try {
      const testCases = currentTask?.tests || []

      const result = await compilerService.executeCode(
        code,
        language,
        sessionId,
        testCases
      )

      console.log('📨 Received result:', result)

      if (result.success) {
        setOutput(result.output)

        if (result.testResults) {
          setTestResults(result.testResults.map((test: any) => ({
            passed: test.passed,
            message: test.passed
              ? `✅ Тест ${test.testId}: ${test.input} → ${test.expected}`
              : `❌ Тест ${test.testId}: ${test.input} → Получено: ${test.actual}, Ожидалось: ${test.expected}`
          })))
        }
      } else {
        setOutput(`❌ ${result.error}`)
      }

    } catch (error) {
      console.error('❌ Execution error:', error)
      setOutput(`❌ Ошибка: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const runTests = (executionOutput: string) => {
    if (!currentTask) return

    const results = currentTask.tests.map(test => {
      const passed = executionOutput.includes(test.expected)
      return {
        passed,
        message: passed
          ? `✅ ${test.input} → ${test.expected}`
          : `❌ ${test.input} → Ожидалось: ${test.expected}`
      }
    })

    setTestResults(results)
  }

  const highlightCode = (code: string) => {
    try {
      return hljs.highlight(code, {
        language: language === 'typescript' ? 'typescript' : language
      }).value
    } catch (error) {
      try {
        return hljs.highlightAuto(code).value
      } catch {
        return hljs.highlight(code, { language: 'plaintext' }).value
      }
    }
  };

  const formatOutput = (text: string) => {
    if (!text) {
      return <div className="text-gray-500 italic">Результат выполнения появится здесь...</div>
    }

    const lines = text.split('\n')
    return lines.map((line, index) => {
      let className = 'text-green-300'
      if (line.includes('❌') || line.toLowerCase().includes('error')) {
        className = 'text-red-400 font-medium'
      } else if (line.includes('✅') || line.includes('→')) {
        className = 'text-green-400'
      } else if (line.includes('🔄')) {
        className = 'text-yellow-400'
      } else if (line.includes('Traceback')) {
        className = 'text-red-300'
      }
      return (
        <div key={index} className={className}>
          {line}
        </div>
      )
    })
  }

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    const filteredTasks = codeTasks.filter(task => task.language === newLanguage)
    if (filteredTasks.length > 0) {
      loadTask(filteredTasks[0])
    } else {
      setCurrentTask(null)
      setCode('')
      setOutput('')
    }
  }

  const passedTests = testResults.filter(r => r.passed).length
  const totalTests = testResults.length

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-center text-2xl font-bold text-gray-800 mb-6">Online Compiler</h1>

      {/* Верхняя панель с выбором языка и кнопкой запуска */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label htmlFor="language" className="text-sm font-medium text-gray-700 mb-1">
              Язык программирования:
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="typescript">TypeScript</option>
            </select>
          </div>

          {/* Выбор задачи */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Задача:
            </label>
            <div className="flex gap-2">
              {codeTasks
                .filter(task => task.language === language)
                .map(task => (
                  <button
                    key={task.id}
                    onClick={() => loadTask(task)}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${
                      currentTask?.id === task.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {task.title}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <Button
          onClick={handleRunCode}
          disabled={isRunning || !code.trim()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Выполняется...
            </span>
          ) : (
            'Запустить код'
          )}
        </Button>
      </div>

      {/* Описание задачи */}
      {currentTask && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium text-gray-800">{currentTask.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{currentTask.description}</p>
            </div>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
              {currentTask.language}
            </span>
          </div>

          {totalTests > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="text-sm text-gray-600">
                Тесты: <span className="font-medium">{passedTests}/{totalTests}</span> пройдено
              </div>
              {passedTests === totalTests && totalTests > 0 && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  ✓ Все тесты пройдены!
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Редактор кода */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Код:
          </label>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {code.length} символов
          </span>
        </div>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <Editor
            value={code}
            onValueChange={setCode}
            highlight={highlightCode}
            padding={16}
            style={{
              fontFamily: '"Fira Code", "Cascadia Code", monospace',
              fontSize: 14,
              backgroundColor: '#ffffff',
              minHeight: '300px',
            }}
            className="w-full focus:outline-none"
          />
        </div>
      </div>

      {/* Область вывода */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Вывод:</h3>
          {output && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {output.split('\n').length} строк
            </span>
          )}
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[150px]">
          <div className="font-mono text-sm whitespace-pre-wrap">
            {formatOutput(output)}
          </div>
        </div>
      </div>

      {/* Результаты тестов */}
      {testResults.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Результаты тестов:</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            {testResults.map((result, index) => (
              <div key={index} className={`text-sm mb-1 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                {result.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* История выполнения */}
      {history.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <details className="cursor-pointer">
            <summary className="text-sm text-gray-600 hover:text-gray-800">
              История выполнения ({history.length})
            </summary>
            <div className="mt-2 space-y-2">
              {history.slice(0, 5).map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.language}</span>
                    <span className="text-xs text-gray-500">{item.executionTime}ms</span>
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {item.status === 'success' ? '✅' : '❌'} {item.code.substring(0, 60)}...
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}