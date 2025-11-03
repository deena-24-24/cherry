import React, { useState } from 'react'
import { useInterviewStore } from '../../store'
import { compilerService } from '../../service/interview/compilerService'
import { Button } from '../ui/Button'

interface CodeConsoleProps {
  sessionId: string;
}

export const CodeConsole: React.FC<CodeConsoleProps> = ({ sessionId }) => {
  const [code, setCode] = useState('// Напишите ваш код здесь\nconsole.log("Hello World");')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [language, setLanguage] = useState('javascript')
  const { addCodeResult } = useInterviewStore()

  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput('Выполнение кода...')

    try {
      const result = await compilerService.executeCode(code, language, sessionId)
      setOutput(result.output || result.error)
      addCodeResult({ output: result.output, error: result.error, executionTime: result.executionTime })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setOutput(`Ошибка выполнения кода: ${errorMessage}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="code-console bg-gray-900 rounded-xl h-full flex flex-col border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between bg-gray-900/60 border-b border-gray-800">
        <h3 className="font-medium text-base">Редактор кода</h3>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
          </select>
          <Button
            onClick={handleRunCode}
            disabled={isRunning}
          >
            {isRunning ? 'Выполняется…' : 'Запустить'}
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-rows-[1fr_auto]">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full bg-gray-950 p-4 text-white font-mono text-sm resize-none focus:outline-none"
          placeholder="// Напишите ваш код здесь…"
        />

        <div className="border-t border-gray-800 bg-black/90">
          <div className="px-4 py-2 text-xs text-gray-400">Консоль</div>
          <div className="px-4 pb-3 max-h-40 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap text-gray-300">
              {output || 'Результат выполнения появится здесь…'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}