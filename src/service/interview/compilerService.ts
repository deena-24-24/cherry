// service/interview/compilerService.ts
import { CodeExecutionResult } from '../../types'

export class CompilerService {
  private apiBaseUrl: string

  constructor() {
    this.apiBaseUrl = 'http://localhost:5000/api/code'
  }

  async executeCode(
    code: string,
    language: string,
    sessionId: string,
    testCases?: Array<{ input: string, expected: string }>
  ): Promise<CodeExecutionResult> {
    console.log('🚀 CompilerService.executeCode called', {
      language,
      sessionId,
      codeLength: code.length,
      testCasesCount: testCases?.length || 0
    })

    try {
      const body: any = {
        code,
        language,
        sessionId
      }

      // Если есть тест-кейсы, отправляем их
      if (testCases && testCases.length > 0) {
        body.testCases = testCases
      } else {
        // Иначе отправляем пустой stdin
        body.stdin = ''
      }

      const response = await fetch(`${this.apiBaseUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
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
        executionTime: result.executionTime || 0,
        success: result.success || false,
        testResults: result.testResults,
        passedCount: result.passedCount,
        totalCount: result.totalCount
      }
    } catch (error) {
      console.error('❌ Error executing code:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown execution error'

      return {
        output: '',
        error: `❌ ${errorMessage}`,
        executionTime: 0,
        success: false
      }
    }
  }

  async getExecutionHistory(sessionId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions/${sessionId}/executions`)
      if (response.ok) {
        const data = await response.json()
        return data.history || []
      }
      return []
    } catch (error) {
      console.error('Error fetching history:', error)
      return []
    }
  }
}

export const compilerService = new CompilerService()