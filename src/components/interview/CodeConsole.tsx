// components/interview/CodeConsole.tsx
import React, { useState, useEffect } from 'react'
import { compilerService } from '../../service/interview/compilerService'
import { Button } from '../ui/Button/Button'
import Editor from 'react-simple-code-editor'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/lib/languages/python'
import 'highlight.js/lib/languages/javascript'

interface CodeConsoleProps {
  sessionId: string;
  isTaskMode?: boolean; // Режим практической задачи
  timeRemaining?: number | null; // Оставшееся время в секундах
  onTaskComplete?: (allTestsPassed: boolean) => void; // Колбэк при завершении задачи
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

export const CodeConsole: React.FC<CodeConsoleProps> = ({ 
  sessionId, 
  isTaskMode = false,
  timeRemaining = null,
  onTaskComplete
}) => {
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [language, setLanguage] = useState('javascript')
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [taskCompleted, setTaskCompleted] = useState(false)

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
    if (!code.trim() || isRunning || (isTaskMode && taskCompleted)) return

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
        
        // В режиме задачи проверяем, все ли тесты прошли
        if (isTaskMode && !taskCompleted) {
          const allPassed = result.testResults.every(tr => tr.passed)
          console.log(`📊 Проверка результатов задачи: все тесты прошли=${allPassed}, количество тестов=${result.testResults.length}`)
          if (allPassed && result.testResults.length > 0) {
            console.log('✅ Все тесты прошли! Задача выполнена успешно.')
            setTaskCompleted(true)
            if (onTaskComplete) {
              onTaskComplete(true)
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ Execution error:', error)
      setOutput(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
    }
  }

  // Отслеживаем истечение времени в режиме задачи
  useEffect(() => {
    if (isTaskMode && timeRemaining !== null && timeRemaining <= 0 && !taskCompleted) {
      console.log('⏰ Время на задачу истекло в CodeConsole')
      setTaskCompleted(true)
      if (onTaskComplete) {
        // Проверяем результаты перед завершением
        const allPassed = testResults.length > 0 && testResults.every(tr => tr.passed)
        console.log(`📊 Задача завершена по времени. Все тесты прошли: ${allPassed}`, { testResults })
        onTaskComplete(allPassed)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTaskMode, timeRemaining, taskCompleted, onTaskComplete])

  // Форматирование времени для отображения
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
    <div className="container mx-auto px-4 py-6 bg-gray-950 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-center text-2xl font-bold text-gray-200">
          {isTaskMode ? 'Практическая задача' : 'Консоль программирования'}
        </h1>
        {isTaskMode && timeRemaining !== null && (
          <div className={`text-xl font-bold ${
            timeRemaining < 60 ? 'text-red-600' : 
            timeRemaining < 300 ? 'text-orange-600' : 
            'text-green-600'
          }`}>
            ⏱️ {formatTime(timeRemaining)}
          </div>
        )}
      </div>
      
      {isTaskMode && taskCompleted && (
        <div className={`mb-4 p-4 rounded-lg border ${
          testResults.length > 0 && testResults.every(tr => tr.passed)
            ? 'bg-green-900/30 border-green-700 text-green-200'
            : 'bg-red-900/30 border-red-700 text-red-200'
        }`}>
          <h3 className="font-bold text-lg mb-2">
            {testResults.length > 0 && testResults.every(tr => tr.passed)
              ? '✅ Задача выполнена! Все тесты прошли.'
              : '❌ Время истекло или не все тесты прошли.'}
          </h3>
          <p className="text-sm">
            {testResults.length > 0 && testResults.every(tr => tr.passed)
              ? 'Вы получили балл за практическую задачу.'
              : 'Балл не начислен.'}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label htmlFor="language" className="text-sm font-medium text-gray-300 mb-1">
              Язык программирования:
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-300 mb-1">
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
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
            disabled={isRunning || !code.trim() || (isTaskMode && taskCompleted)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Выполняется...
              </span>
            ) : isTaskMode && taskCompleted ? (
              'Задача завершена'
            ) : (
              'Запустить код'
            )}
          </Button>
        </div>
      </div>

      <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="font-medium text-gray-200">Сумма двух чисел</h3>
        <p className="text-sm text-gray-400 mt-1">Напишите функцию sum(a, b), которая возвращает сумму двух чисел.</p>

        {totalTests > 0 && (
          <div className="mt-2 text-sm text-gray-400">
            Тесты: <span className="font-medium text-gray-200">{passedTests}/{totalTests}</span> пройдено
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">
            Код:
          </label>
          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
            {code.length} символов
          </span>
        </div>
        <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-900">
          <Editor
            value={code}
            onValueChange={setCode}
            highlight={(code) => hljs.highlight(code, { language }).value}
            padding={16}
            style={{
              fontFamily: '"Fira Code", "Cascadia Code", monospace',
              fontSize: 14,
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              minHeight: '300px',
            }}
            className="w-full focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-300">Результат:</h3>
          {output && (
            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
              {output.split('\n').length} строк
            </span>
          )}
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-600 min-h-[150px]">
          <div className="font-mono text-sm whitespace-pre-wrap text-gray-100">
            {output || <span className="text-gray-500">Результат выполнения появится здесь...</span>}
          </div>
        </div>
      </div>

      {testResults.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Результаты тестов:</h3>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded border ${
                  result.passed ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-200">
                    Тест {result.testId}: {result.passed ? '✅' : '❌'}
                  </span>
                  <span className="text-xs text-gray-400">{result.executionTime}ms</span>
                </div>
                {!result.passed && (
                  <div className="mt-1 text-sm text-gray-300">
                    <div>Ожидалось: <span className="text-gray-200">{result.expected}</span></div>
                    <div>Получено: <span className="text-gray-200">{result.actual}</span></div>
                    {result.error && (
                      <div className="text-red-400">Ошибка: {result.error}</div>
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