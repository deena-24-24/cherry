import { API_URL } from '../../config'

export interface CodeExecutionRequest {
  code: string;
  language: string;
  sessionId: string;
  testCases?: Array<{ input: string, expected: string }>;
}

export interface CodeExecutionResponse {
  output: string;
  error?: string;
  executionTime: number;
  success: boolean;
  testResults?: Array<{
    testId: number;
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    executionTime: number;
    error?: string;
  }>;
}

export class CompilerService {
  private apiBaseUrl: string

  constructor() {
    this.apiBaseUrl = `${API_URL}/api/code`
  }

  async executeCode(
    code: string,
    language: string,
    sessionId: string,
    testCases?: Array<{ input: string, expected: string }>
  ): Promise<CodeExecutionResponse> {
    try {
      const body: CodeExecutionRequest = {
        code,
        language,
        sessionId
      }

      if (testCases && testCases.length > 0) {
        body.testCases = testCases
      }

      const response = await fetch(`${this.apiBaseUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('❌ Error executing code:', error)

      return {
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
        success: false
      }
    }
  }
}

export const compilerService = new CompilerService()