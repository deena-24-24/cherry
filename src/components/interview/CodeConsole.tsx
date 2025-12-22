import React, { useState, useEffect } from 'react'
import { compilerService } from '../../service/api/compilerService'
import { Button } from '../ui/Button/Button'
import Editor from 'react-simple-code-editor'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/lib/languages/python'
import 'highlight.js/lib/languages/javascript'
import * as styles from './CodeConsole.module.css'

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

      setOutput(result.output)

      if (result.testResults) {
        setTestResults(result.testResults)

        // В режиме задачи проверяем, все ли тесты прошли
        if (isTaskMode && !taskCompleted) {
          const allPassed = result.testResults.every(tr => tr.passed)
          if (allPassed && result.testResults.length > 0) {
            setTaskCompleted(true)
            if (onTaskComplete) {
              onTaskComplete(true)
            }
          }
        }
      }

    } catch (error) {
      console.error('Execution error:', error)
      setOutput(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
    }
  }

  // Отслеживаем истечение времени в режиме задачи
  useEffect(() => {
    if (isTaskMode && timeRemaining !== null && timeRemaining <= 0 && !taskCompleted) {
      setTaskCompleted(true)
      if (onTaskComplete) {
        // Проверяем результаты перед завершением
        const allPassed = testResults.length > 0 && testResults.every(tr => tr.passed)
        onTaskComplete(allPassed)
      }
    }
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
    <div className={styles.consoleContainer}>
      <div className={styles.consoleHeader}>
        <h1 className={styles.consoleTitle}>
          {isTaskMode ? 'Практическая задача' : 'Консоль программирования'}
        </h1>
        {isTaskMode && timeRemaining !== null && (
          <div className={`${styles.timer} ${
            timeRemaining < 60 ? styles.timerDanger :
              timeRemaining < 300 ? styles.timerWarning :
                styles.timerNormal
          }`}>
            ⏱️ {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      {isTaskMode && taskCompleted && (
        <div className={`${styles.taskCompletedBanner} ${
          testResults.length > 0 && testResults.every(tr => tr.passed)
            ? styles.taskCompletedSuccess
            : styles.taskCompletedFailed
        }`}>
          <h3 className={styles.taskResultTitle}>
            {testResults.length > 0 && testResults.every(tr => tr.passed)
              ? '✅ Задача выполнена! Все тесты прошли.'
              : '❌ Время истекло или не все тесты прошли.'}
          </h3>
          <p className={styles.taskResultDescription}>
            {testResults.length > 0 && testResults.every(tr => tr.passed)
              ? 'Вы получили балл за практическую задачу.'
              : 'Балл не начислен.'}
          </p>
        </div>
      )}

      <div className={styles.controlsRow}>
        <div className={styles.controlsLeft}>
          <div className={styles.controlGroup}>
            <label htmlFor="language" className={styles.controlLabel}>
              Язык программирования:
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className={styles.languageSelect}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>
              Задача:
            </label>
            <div className={styles.taskButtons}>
              {codeTasks
                .filter(task => task.language === language)
                .map(task => (
                  <button
                    key={task.id}
                    onClick={() => loadTask(task)}
                    className={`${styles.taskButton} ${
                      language === task.language
                        ? styles.taskButtonActive
                        : styles.taskButtonInactive
                    }`}
                  >
                    {task.title}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className={styles.controlsRight}>
          <button
            onClick={handleResetCode}
            className={`${styles.actionButton} ${styles.buttonSecondary}`}
          >
            Сбросить код
          </button>
          <button
            onClick={handleRunCode}
            disabled={isRunning || !code.trim() || (isTaskMode && taskCompleted)}
            className={`${styles.actionButton} ${styles.buttonPrimary}`}
          >
            {isRunning ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                Выполняется...
              </span>
            ) : isTaskMode && taskCompleted ? (
              'Задача завершена'
            ) : (
              'Запустить код'
            )}
          </button>
        </div>
      </div>

      <div className={styles.taskInfoBox}>
        <h3 className={styles.taskTitle}>Сумма двух чисел</h3>
        <p className={styles.taskDescription}>
          Напишите функцию sum(a, b), которая возвращает сумму двух чисел.
        </p>
        {totalTests > 0 && (
          <div className={styles.taskStats}>
            Тесты: <span style={{ fontWeight: 600, color: '#f5f5ff' }}>{passedTests}/{totalTests}</span> пройдено
          </div>
        )}
      </div>

      <div className={styles.codeSection}>
        <div className={styles.sectionHeader}>
          <label className={styles.sectionLabel}>Код:</label>
          <span className={styles.badge}>{code.length} символов</span>
        </div>
        <div className={styles.codeEditorWrapper}>
          <Editor
            value={code}
            onValueChange={setCode}
            highlight={(code) => hljs.highlight(code, { language }).value}
            padding={16}
            style={{
              fontFamily: '"Fira Code", "Cascadia Code", monospace',
              fontSize: 14,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              color: '#f5f5ff',
              minHeight: '300px',
            }}
            className="w-full focus:outline-none"
          />
        </div>
      </div>

      {testResults.length > 0 && (
        <div className={styles.testResultsContainer}>
          <div className={`${styles.testResultBox} ${
            testResults.every(tr => tr.passed)
              ? styles.testResultSuccess
              : styles.testResultFailed
          }`}>
            {testResults.every(tr => tr.passed) ? (
              <>
                <div className={styles.testResultHeader}>
                  <span className={styles.testResultIcon}>✅</span>
                  <h3 className={`${styles.testResultTitle} ${styles.testResultTitleSuccess}`}>
                    Все тесты пройдены
                  </h3>
                </div>
                <p className={`${styles.testResultDescription} ${styles.testResultDescriptionSuccess}`}>
                  Все {testResults.length} тестов выполнены успешно
                </p>
              </>
            ) : (
              <>
                <div className={styles.testResultHeader}>
                  <span className={styles.testResultIcon}>❌</span>
                  <h3 className={`${styles.testResultTitle} ${styles.testResultTitleFailed}`}>
                    Тесты не пройдены
                  </h3>
                </div>

              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}