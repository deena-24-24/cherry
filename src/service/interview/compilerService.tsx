import { CodeExecutionResult } from '../../types/interview'

export class CompilerService {
  async executeCode(code: string, language: string): Promise<CodeExecutionResult> {
    try {
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language }),
      })

      return await response.json()
    } catch (error) {
      console.error('Error executing code:', error)
      return { output: '', error: 'Execution failed', executionTime: 0 }
    }
  }
}

export const compilerService = new CompilerService()