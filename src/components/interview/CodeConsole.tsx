import React, { useState } from 'react'
import { useInterviewStore } from '../../store/useInterviewStore'
import { compilerService } from '../../service/interview/compilerService'

export const CodeConsole: React.FC = () => {
  const [code, setCode] = useState('// Напишите ваш код здесь\nconsole.log("Hello World");')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const { addCodeResult } = useInterviewStore()

  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput('Выполнение кода...')

    try {
      const result = await compilerService.executeCode(code, 'javascript')
      setOutput(result.output || result.error)
      addCodeResult(result.output)
    } catch (error) {
      setOutput('Ошибка выполнения кода')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="code-console bg-gray-900 rounded-xl h-full flex flex-col border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between bg-gray-900/60 border-b border-gray-800">
        <h3 className="font-medium text-base">Редактор кода</h3>
        <div className="flex items-center gap-2">
          <select className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700">
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
          </select>
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className={`px-3 py-1.5 rounded text-xs font-medium ${
              isRunning ? 'bg-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            {isRunning ? 'Выполняется…' : 'Запустить'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-rows-[1fr_auto]">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full bg-transparent p-4 text-white font-mono text-sm resize-none focus:outline-none"
          placeholder="// Напишите ваш код здесь…"
        />

        <div className="border-t border-gray-800 bg-black/90">
          <div className="px-4 py-2 text-xs text-gray-400">Консоль</div>
          <div className="px-4 pb-3 max-h-40 overflow-auto">
            <pre className="text-green-400 text-sm whitespace-pre-wrap">
              {output || 'Результат выполнения появится здесь…'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}