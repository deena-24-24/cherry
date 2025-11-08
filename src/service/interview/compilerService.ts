import { CodeExecutionResult } from '../../types'

export class CompilerService {
  async executeCode(code: string, language: string, sessionId: string): Promise<CodeExecutionResult> {
    try {
      const response = await fetch('http://localhost:5000/api/code/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language, sessionId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Execution failed on server')
      }

      return await response.json()
    } catch (error) {
      console.error('Error executing code:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown execution error'
      return { output: '', error: errorMessage, executionTime: 0 }
    }
  }
}

export const compilerService = new CompilerService()