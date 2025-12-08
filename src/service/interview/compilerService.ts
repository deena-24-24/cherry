// service/interview/compilerService.ts
import { CodeExecutionResult } from '../../types'

export class CompilerService {
  async executeCode(code: string, language: string, sessionId: string): Promise<CodeExecutionResult> {
    console.log('🚀 CompilerService.executeCode called', {
      language,
      sessionId,
      codePreview: code.substring(0, 100)
    })

    try {
      const response = await fetch('http://localhost:5000/api/code/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language, sessionId }),
      })

      console.log('📨 Server response status:', response.status)

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`
        try {
          const errorData = await response.json()
          console.log('📨 Server error response:', errorData)
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.log('📨 Could not parse error response')
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('✅ Server success response:', result)

      return {
        output: result.output || '',
        error: result.error || '',
        executionTime: result.executionTime || 0
      }
    } catch (error) {
      console.error('❌ Error executing code:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown execution error'

      return {
        output: '',
        error: `❌ ${errorMessage}`,
        executionTime: 0
      }
    }
  }
}

export const compilerService = new CompilerService()