import { CodeExecutionResult } from '../../types'
import { API_URL } from '../../config'

const API_BASE_URL = `${API_URL}/api/code/execute`

export class CompilerService {
  async executeCode(code: string, language: string, sessionId: string): Promise<CodeExecutionResult> {
    try {
      const response = await fetch(API_BASE_URL, {
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