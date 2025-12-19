// components/interview/CodeConsole.tsx
import React, { useState, useEffect } from 'react'
import { compilerService } from '../../service/api/compilerService'
import { Button } from '../ui/Button/Button'
import Editor from 'react-simple-code-editor'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/lib/languages/python'
import 'highlight.js/lib/languages/javascript'

interface CodeConsoleProps {
  sessionId: string;
}

interface TestResult {
  testId: number;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  executionTime: number;
  error?: string;
}

export const CodeConsole: React.FC<CodeConsoleProps> = ({ sessionId }) => {
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [language, setLanguage] = useState('javascript')
  const [testResults, setTestResults] = useState<TestResult[]>([])

  const codeTasks = [
    {
      id: 'js-sum',
      title: 'Сумма двух чисел',
      description: 'Напишите функцию sum(a, b), которая возвращает сумму двух чисел.',
      initialCode: `function sum(a, b) {
  // Ваш код здесь
}`,
      language: 'javascript',
      tests: [
        { id: 1, input: '2 3', expected: '5' },
        { id: 2, input: '5 7', expected: '12' },
        { id: 3, input: '-1 1', expected: '0' },
        { id: 4, input: '0 0', expected: '0' },
        { id: 5, input: '10 -5', expected: '5' }
      ]
    },
    {
      id: 'py-sum',
      title: 'Сумма двух чисел',
      description: 'Напишите функцию sum(a, b), которая возвращает сумму двух чисел.',
      initialCode: `def sum(a, b):
    # Ваш код здесь
    pass`,
      language: 'python',
      tests: [
        { id: 1, input: '2 3', expected: '5' },
        { id: 2, input: '5 7', expected: '12' },
        { id: 3, input: '-1 1', expected: '0' },
        { id: 4, input: '0 0', expected: '0' },
        { id: 5, input: '10 -5', expected: '5' }
      ]
    }
  ]

  useEffect(() => {
    const defaultTask = codeTasks.find(task => task.language === 'javascript')
    if (defaultTask) {
      loadTask(defaultTask)
    }
  }, [])

  const loadTask = (task: any) => {
    setCode(task.initialCode)
    setLanguage(task.language)
    setOutput('')
    setTestResults([])
  }

  const handleRunCode = async () => {
    if (!code.trim() || isRunning) return

    setIsRunning(true)
    setOutput('🔄 Выполнение кода...')
    setTestResults([])

    try {
      const currentTask = codeTasks.find(task => task.language === language)
      const testCases = currentTask?.tests.map(tc => ({
        input: tc.input,
        expected: tc.expected
      })) || []

      const result = await compilerService.executeCode(
        code,
        language,
        sessionId,
        testCases
      )

      console.log('📨 Result:', result)

      setOutput(result.output)

      if (result.testResults) {
        setTestResults(result.testResults)
      }

    } catch (error) {
      console.error('❌ Execution error:', error)
      setOutput(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    const filteredTasks = codeTasks.filter(task => task.language === newLanguage)
    if (filteredTasks.length > 0) {
      loadTask(filteredTasks[0])
    }
  }

  const handleResetCode = () => {
    const currentTask = codeTasks.find(task => task.language === language)
    if (currentTask) {
      setCode(currentTask.initialCode)
    }
  }

  const passedTests = testResults.filter(r => r.passed).length
  const totalTests = testResults.length

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-center text-2xl font-bold text-gray-800 mb-6">Консоль программирования</h1>

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
            </select>
          </div>

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
                      language === task.language
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

        <div className="flex gap-2">
          <Button
            onClick={handleResetCode}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-md"
          >
            Сбросить код
          </Button>
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
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="font-medium text-gray-800">Сумма двух чисел</h3>
        <p className="text-sm text-gray-600 mt-1">Напишите функцию sum(a, b), которая возвращает сумму двух чисел.</p>

        {totalTests > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            Тесты: <span className="font-medium">{passedTests}/{totalTests}</span> пройдено
          </div>
        )}
      </div>

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
            highlight={(code) => hljs.highlight(code, { language }).value}
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

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Результат:</h3>
          {output && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {output.split('\n').length} строк
            </span>
          )}
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[150px]">
          <div className="font-mono text-sm whitespace-pre-wrap">
            {output || 'Результат выполнения появится здесь...'}
          </div>
        </div>
      </div>

      {testResults.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Результаты тестов:</h3>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded border ${
                  result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    Тест {result.testId}: {result.passed ? '✅' : '❌'}
                  </span>
                  <span className="text-xs text-gray-500">{result.executionTime}ms</span>
                </div>
                {!result.passed && (
                  <div className="mt-1 text-sm text-gray-600">
                    <div>Ожидалось: {result.expected}</div>
                    <div>Получено: {result.actual}</div>
                    {result.error && (
                      <div className="text-red-500">Ошибка: {result.error}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}