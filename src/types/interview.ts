// src/types/interview.ts

// ============================================================================
// БАЗОВЫЕ ТИПЫ ИНТЕРВЬЮ
// ============================================================================
// types/index.ts (добавьте поле success)
// types/index.ts
// types/index.ts или types/codeExecution.ts
export enum CodeExecutionStatus {
  OK = 'OK',
  COMPILATION_ERROR = 'CE',
  RUNTIME_ERROR = 'RE',
  TIME_LIMIT_EXCEEDED = 'TL',
  MEMORY_LIMIT_EXCEEDED = 'ML',
  WRONG_ANSWER = 'WA',
  PRESENTATION_ERROR = 'PE',
  SERVER_ERROR = 'SE',
  RUNNING = 'RUNNING',
  PENDING = 'PENDING'
}

export interface TestResult {
  testId: number;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  executionTime: number;
  memory?: number;
  status: CodeExecutionStatus;
  error?: string;
  diff?: string;
  hidden?: boolean;
}

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error: string;
  executionTime: number;
  memory?: number;
  status: CodeExecutionStatus;
  testResults?: TestResult[];
  passedCount?: number;
  totalCount?: number;
  compileOutput?: string;
  sessionId?: string;
}

export interface CodeTask {
  id: string;
  title: string;
  description: string;
  initialCode: string;
  language: string;
  timeLimit?: number;
  memoryLimit?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  hints?: string[];
  tests: Array<{
    id: number;
    input: string;
    expected: string;
    hidden?: boolean;
  }>;
}

// Тип для сохранения в хранилище
export interface CodeExecutionStoreResult {
  sessionId: string;
  code: string;
  language: string;
  result: CodeExecutionResult;
  timestamp: string;
}

export interface InterviewSession {
  id: string
  title: string
  position: string
  difficulty: 'junior' | 'middle' | 'senior'
  status: 'scheduled' | 'active' | 'completed'
  createdAt: Date
  finalReport?: FinalReport
  interviewId?: string
  candidateId?: string
  notes?: string
}

export interface AudioState {
  isRecording: boolean
  isPlaying: boolean
  error?: string
}
// ============================================================================
// ТИПЫ ДЛЯ ОЦЕНКИ И АНАЛИЗА
// ============================================================================

export interface ResponseEvaluation {
  completeness: number
  technical_depth: number
  structure: number
  relevance: number
  overall_score: number
  strengths: string[]
  improvements: string[]
  topic_mastery: 'novice' | 'beginner' | 'intermediate' | 'advanced'
  needs_review: boolean
  has_potential?: boolean
  response_quality?: 'needs_improvement' | 'satisfactory' | 'good' | 'excellent'
}

export interface NextAction {
  action: 'continue_topic' | 'next_topic' | 'deep_dive_topic' | 'challenge_candidate' | 'complete_interview'
  reason: string
  confidence: number
  suggested_topic?: string | null
  priority: 'low' | 'medium' | 'high'
}

export interface InterviewProgress {
  totalExchanges: number
  averageScore: number
  topicsCovered: string[]
  weakAreas: Array<{
    topic: string
    score: number
    improvements: string[]
  }>
  completionPercentage: number
}

export interface TopicAnalysis {
  topicAnalysis: Record<string, {
    averageScore: number
    averageTechnicalDepth: number
    responseCount: number
    scores?: number[]
  }>
  strongTopics: string[]
  weakTopics: string[]
  averageTechnicalDepth: number
}

export interface ActionAnalysis {
  total_actions: number
  action_breakdown: Record<string, number>
  most_common_action: string
  completion_rate: 'completed' | 'not_completed'
}

// ============================================================================
// ТИПЫ ДЛЯ ФИНАЛЬНОГО ОТЧЕТА
// ============================================================================

export interface BehavioralAnalysis {
  communication_skills: {
    score: number
    structure: number
    clarity: number
    feedback: string
  }
  problem_solving: {
    score: number
    examples_count: number
    feedback: string
  }
  learning_ability: {
    score: number
    topics_mastered: number
    feedback: string
  }
  adaptability: {
    score: number
    consistency: number
    trend: number
    feedback: string
  }
}

export interface TechnicalSkills {
  topics_covered: string[]
  strong_areas: string[]
  weak_areas: string[]
  technical_depth: number
  recommendations: string[]
}

export interface OverallAssessment {
  final_score: number
  level: string
  recommendation: 'strong_hire' | 'hire' | 'maybe_hire' | 'no_hire'
  confidence: number
  strengths: Array<string | { strength: string; frequency: number; confidence: number }>
  improvements: string[]
  potential_areas: Array<{
    topic: string
    reason: string
    current_depth?: number
    potential: 'high' | 'medium' | 'low'
  }>
}

export interface InterviewAnalytics {
  total_duration: string
  total_questions: number
  topics_covered_count: number
  average_response_quality: number
  topic_progression: string[]
  action_pattern: ActionAnalysis
}

export interface FinalReport {
  overall_assessment: OverallAssessment
  technical_skills: TechnicalSkills
  behavioral_analysis: BehavioralAnalysis
  interview_analytics: InterviewAnalytics
  detailed_feedback: string
  next_steps: string[]
  notes?: string // Заметки интервьюера
  raw_data: {
    evaluationHistory: Array<{
      topic: string
      response: string
      evaluation: ResponseEvaluation
      timestamp: string
    }>
    actionsHistory: NextAction[]
  }
}

// ============================================================================
// ТИПЫ ДЛЯ AI RESPONSE И МЕТАДАННЫХ
// ============================================================================

export interface AIMetadata {
  evaluation?: ResponseEvaluation
  nextAction?: NextAction
  currentTopic?: string
  interviewProgress?: InterviewProgress
  isInterviewComplete?: boolean
  finalReport?: FinalReport
  completionReason?: string
  wasAutomatic?: boolean
  isFallback?: boolean
  error?: string
  isInitial?: boolean
}

export interface AIResponse {
  text: string
  audio?: ArrayBuffer
  timestamp: string
  metadata?: AIMetadata
}

// ============================================================================
// ТИПЫ ДЛЯ WEB SOCKET СООБЩЕНИЙ
// ============================================================================

// Входящие сообщения от сервера
export interface SocketAIAudioResponse {
  text: string
  metadata?: AIMetadata
  timestamp?: string
  sessionId?: string
}

export interface SocketAIResponseAlt {
  response: string
  metadata?: AIMetadata
  timestamp?: string
  sessionId?: string
}

export interface SocketInterviewCompleted {
  sessionId: string
  finalReport: FinalReport
  completionReason: string
  wasAutomatic: boolean
}

export interface SocketAIError {
  message: string
  sessionId?: string
}

// Исходящие сообщения от клиента
export interface SocketUserTranscript {
  sessionId: string
  text: string
  position: string
}

export interface SocketJoinInterview {
  sessionId: string
  position: string
}

export interface SocketCompleteInterview {
  sessionId: string
}

export interface SocketAudioChunk {
  sessionId: string
  chunk: ArrayBuffer
}

// Union типы и вспомогательные типы
export type SocketAIResponse =
  | string
  | SocketAIAudioResponse
  | SocketAIResponseAlt

export interface ExtractedAIResponse {
  text: string
  metadata: AIMetadata
  timestamp: string
}


/**
 * Безопасно извлекает AIResponse из любого формата payload
 */
export function extractAIResponse(payload: SocketAIResponseExtended): ExtractedAIResponse {
  const defaultResponse: ExtractedAIResponse = {
    text: '',
    metadata: {},
    timestamp: new Date().toISOString()
  }

  try {
    // Обрабатываем строковый формат
    if (typeof payload === 'string') {
      return {
        ...defaultResponse,
        text: payload
      }
    }

    // Обрабатываем SocketAIAudioResponse
    if (isSocketAIAudioResponse(payload)) {
      return {
        text: payload.text,
        metadata: payload.metadata || {},
        timestamp: payload.timestamp || defaultResponse.timestamp
      }
    }

    // Обрабатываем SocketAIResponseAlt
    if (isSocketAIResponseAlt(payload)) {
      return {
        text: payload.response,
        metadata: payload.metadata || {},
        timestamp: payload.timestamp || defaultResponse.timestamp
      }
    }

    // Обрабатываем SocketAIAudioResponseExtended
    if (isSocketAIAudioResponseExtended(payload)) {
      let text = ''
      let metadata: AIMetadata = {}
      const timestamp = payload.timestamp || defaultResponse.timestamp

      // Обрабатываем поле text
      if (payload.text) {
        text = extractTextFromFlexible(payload.text)
        metadata = { ...metadata, ...extractMetadataFromFlexible(payload.text) }
      }

      // Обрабатываем поле response как fallback
      if (!text && payload.response) {
        text = payload.response
      }

      // Обрабатываем корневые метаданные
      if (payload.metadata) {
        metadata = { ...metadata, ...payload.metadata }
      }

      return { text, metadata, timestamp }
    }

    // Обрабатываем объект с полем text
    if (isObject(payload) && 'text' in payload && isFlexibleText(payload.text)) {
      const text = extractTextFromFlexible(payload.text)
      const metadata = extractMetadataFromFlexible(payload.text)
      // Извлекаем timestamp из объекта
      let timestamp = defaultResponse.timestamp
      if ('timestamp' in payload && typeof payload.timestamp === 'string') {
        timestamp = payload.timestamp
      }
      return { text, metadata, timestamp }
    }

    console.warn('⚠️ Unknown payload format in extractAIResponse:', payload)
    return defaultResponse

  } catch (error) {
    console.error('❌ Error in extractAIResponse:', error)
    return defaultResponse
  }
}

export type UnknownObject = Record<string, unknown>

// ============================================================================
// УСТАРЕВШИЕ ТИПЫ (ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ)
// ============================================================================

/**
 * @deprecated Используйте отдельные типы SocketAIAudioResponse, SocketInterviewCompleted и т.д.
 */
export interface SocketMessage {
  type: 'ai-audio-response' | 'audio-chunk' | 'join-interview' | 'error' | 'interview-completed' | 'complete-interview'
  sessionId?: string
  text?: string
  chunkSize?: number
  message?: string
  metadata?: AIResponse['metadata']
}

// src/types/interview.ts - ПОЛНОСТЬЮ БЕЗ ANY

// ============================================================================
// ОБНОВЛЯЕМ TYPE GUARDS - БЕЗ ANY!
// ============================================================================
export interface NestedTextObject {
  text?: string
  content?: string
  message?: string
  metadata?: AIMetadata
  [key: string]: unknown // для дополнительных полей
}
/**
 * Union тип для текстовых полей которые могут быть в разных форматах
 */
export type FlexibleText = string | NestedTextObject

/**
 * Расширенный тип для AI ответов с поддержкой вложенных структур
 */
export interface SocketAIAudioResponseExtended {
  text?: FlexibleText
  response?: string
  metadata?: AIMetadata
  timestamp?: string
  sessionId?: string
}

/**
 * Union тип для всех возможных форматов AI ответов
 */
export type SocketAIResponseExtended =
  | string
  | SocketAIAudioResponse
  | SocketAIResponseAlt
  | SocketAIAudioResponseExtended
  | { text: FlexibleText; metadata?: AIMetadata }
// ============================================================================
// БАЗОВЫЕ TYPE GUARDS

/**
 * Type guard для проверки InterviewProgress
 */
export function isInterviewProgress(payload: unknown): payload is InterviewProgress {
  if (!isObject(payload)) return false

  // Проверяем базовые поля
  const hasBasicFields = typeof payload.totalExchanges === 'number' &&
    typeof payload.averageScore === 'number' &&
    Array.isArray(payload.topicsCovered) &&
    Array.isArray(payload.weakAreas) &&
    typeof payload.completionPercentage === 'number'

  if (!hasBasicFields) return false

  // Проверяем что все элементы в weakAreas правильного типа
  if (Array.isArray(payload.weakAreas)) {
    return payload.weakAreas.every(isWeakArea)
  }

  return false
}

/**
 * Type guard для проверки weakAreas элемента
 */
export function isWeakArea(payload: unknown): payload is InterviewProgress['weakAreas'][0] {
  if (!isObject(payload)) return false

  return typeof payload.topic === 'string' &&
    typeof payload.score === 'number' &&
    Array.isArray(payload.improvements)
}
/**
 * Type guard для проверки что значение является объектом
 */
export function isObject(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload)
}

/**
 * Type guard для проверки строки
 */
export function isStringResponse(payload: unknown): payload is string {
  return typeof payload === 'string'
}

/**
 * Type guard для проверки NestedTextObject
 */
export function isNestedTextObject(payload: unknown): payload is NestedTextObject {
  if (!isObject(payload)) return false

  return (payload.text === undefined || typeof payload.text === 'string') &&
    (payload.content === undefined || typeof payload.content === 'string') &&
    (payload.message === undefined || typeof payload.message === 'string') &&
    (payload.metadata === undefined || isAIMetadata(payload.metadata))
}

/**
 * Type guard для проверки FlexibleText
 */
export function isFlexibleText(payload: unknown): payload is FlexibleText {
  return typeof payload === 'string' || isNestedTextObject(payload)
}

/**
 * Type guard для проверки AIMetadata
 */
export function isAIMetadata(payload: unknown): payload is AIMetadata {
  return isObject(payload)
}

/**  return (payload.evaluation === undefined || isResponseEvaluation(payload.evaluation)) &&
    (payload.nextAction === undefined || isNextAction(payload.nextAction)) &&
    (payload.currentTopic === undefined || typeof payload.currentTopic === 'string') &&
    (payload.interviewProgress === undefined || isInterviewProgress(payload.interviewProgress)) &&
    (payload.isInterviewComplete === undefined || typeof payload.isInterviewComplete === 'boolean') &&
    (payload.finalReport === undefined || isFinalReport(payload.finalReport)) &&
    (payload.completionReason === undefined || typeof payload.completionReason === 'string') &&
    (payload.wasAutomatic === undefined || typeof payload.wasAutomatic === 'boolean') &&
    (payload.isFallback === undefined || typeof payload.isFallback === 'boolean') &&
    (payload.error === undefined || typeof payload.error === 'string') &&
    (payload.isInitial === undefined || typeof payload.isInitial === 'boolean')
}

/**
 * Type guard для проверки ResponseEvaluation
 */
export function isResponseEvaluation(payload: unknown): payload is ResponseEvaluation {
  if (!isObject(payload)) return false

  return typeof payload.completeness === 'number' &&
    typeof payload.technical_depth === 'number' &&
    typeof payload.structure === 'number' &&
    typeof payload.relevance === 'number' &&
    typeof payload.overall_score === 'number' &&
    Array.isArray(payload.strengths) &&
    Array.isArray(payload.improvements) &&
    typeof payload.topic_mastery === 'string' &&
    typeof payload.needs_review === 'boolean'
}

/**
 * Type guard для проверки NextAction
 */
export function isNextAction(payload: unknown): payload is NextAction {
  if (!isObject(payload)) return false

  return typeof payload.action === 'string' &&
    typeof payload.reason === 'string' &&
    typeof payload.confidence === 'number' &&
    typeof payload.priority === 'string' &&
    (payload.suggested_topic === null || payload.suggested_topic === undefined || typeof payload.suggested_topic === 'string')
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ИЗВЛЕЧЕНИЯ ДАННЫХ
// ============================================================================

/**
 * Извлекает текст из FlexibleText
 */
export function extractTextFromFlexible(text: FlexibleText): string {
  if (typeof text === 'string') {
    return text
  }

  // Если это NestedTextObject, ищем текст в разных полях
  return text.text || text.content || text.message || ''
}

/**
 * Извлекает метаданные из FlexibleText
 */
export function extractMetadataFromFlexible(text: FlexibleText): AIMetadata {
  if (typeof text === 'string') {
    return {}
  }

  return text.metadata || {}
}

// ============================================================================
// TYPE GUARDS ДЛЯ СЛОЖНЫХ СТРУКТУР
// ============================================================================

/**
 * Type guard для проверки ActionAnalysis
 */
export function isActionAnalysis(payload: unknown): payload is ActionAnalysis {
  if (!isObject(payload)) return false

  return typeof payload.total_actions === 'number' &&
    isObject(payload.action_breakdown) &&
    typeof payload.most_common_action === 'string' &&
    typeof payload.completion_rate === 'string'
}

/**
 * Type guard для проверки BehavioralAnalysis.communication_skills
 */
export function isCommunicationSkills(payload: unknown): payload is BehavioralAnalysis['communication_skills'] {
  if (!isObject(payload)) return false

  return typeof payload.score === 'number' &&
    typeof payload.structure === 'number' &&
    typeof payload.clarity === 'number' &&
    typeof payload.feedback === 'string'
}

/**
 * Type guard для проверки BehavioralAnalysis.problem_solving
 */
export function isProblemSolving(payload: unknown): payload is BehavioralAnalysis['problem_solving'] {
  if (!isObject(payload)) return false

  return typeof payload.score === 'number' &&
    typeof payload.examples_count === 'number' &&
    typeof payload.feedback === 'string'
}

/**
 * Type guard для проверки BehavioralAnalysis.learning_ability
 */
export function isLearningAbility(payload: unknown): payload is BehavioralAnalysis['learning_ability'] {
  if (!isObject(payload)) return false

  return typeof payload.score === 'number' &&
    typeof payload.topics_mastered === 'number' &&
    typeof payload.feedback === 'string'
}

/**
 * Type guard для проверки BehavioralAnalysis.adaptability
 */
export function isAdaptability(payload: unknown): payload is BehavioralAnalysis['adaptability'] {
  if (!isObject(payload)) return false

  return typeof payload.score === 'number' &&
    typeof payload.consistency === 'number' &&
    typeof payload.trend === 'number' &&
    typeof payload.feedback === 'string'
}

/**
 * Type guard для проверки BehavioralAnalysis
 */
export function isBehavioralAnalysis(payload: unknown): payload is BehavioralAnalysis {
  if (!isObject(payload)) return false

  return isCommunicationSkills(payload.communication_skills) &&
    isProblemSolving(payload.problem_solving) &&
    (payload.learning_ability === undefined || isLearningAbility(payload.learning_ability)) &&
    (payload.adaptability === undefined || isAdaptability(payload.adaptability))
}

/**
 * Type guard для проверки TechnicalSkills
 */
export function isTechnicalSkills(payload: unknown): payload is TechnicalSkills {
  if (!isObject(payload)) return false

  return Array.isArray(payload.topics_covered) &&
    (payload.strong_areas === undefined || Array.isArray(payload.strong_areas)) &&
    (payload.weak_areas === undefined || Array.isArray(payload.weak_areas)) &&
    (payload.technical_depth === undefined || typeof payload.technical_depth === 'number') &&
    (payload.recommendations === undefined || Array.isArray(payload.recommendations))
}

/**
 * Type guard для проверки OverallAssessment
 */
export function isOverallAssessment(payload: unknown): payload is OverallAssessment {
  if (!isObject(payload)) return false

  return typeof payload.final_score === 'number' &&
    typeof payload.level === 'string' &&
    typeof payload.recommendation === 'string' &&
    typeof payload.confidence === 'number' &&
    Array.isArray(payload.strengths) &&
    Array.isArray(payload.improvements) &&
    (payload.potential_areas === undefined || Array.isArray(payload.potential_areas))
}

/**
 * Type guard для проверки InterviewAnalytics
 */
export function isInterviewAnalytics(payload: unknown): payload is InterviewAnalytics {
  if (!isObject(payload)) return false

  return typeof payload.total_duration === 'string' &&
    typeof payload.total_questions === 'number' &&
    typeof payload.topics_covered_count === 'number' &&
    typeof payload.average_response_quality === 'number' &&
    Array.isArray(payload.topic_progression) &&
    isActionAnalysis(payload.action_pattern)
}

/**
 * Type guard для проверки FinalReport
 */
export function isFinalReport(payload: unknown): payload is FinalReport {
  if (!isObject(payload)) return false

  return isOverallAssessment(payload.overall_assessment) &&
    isTechnicalSkills(payload.technical_skills) &&
    (payload.behavioral_analysis === undefined || isBehavioralAnalysis(payload.behavioral_analysis)) &&
    isInterviewAnalytics(payload.interview_analytics) &&
    typeof payload.detailed_feedback === 'string' &&
    Array.isArray(payload.next_steps) &&
    isObject(payload.raw_data)
}

// ============================================================================
// TYPE GUARDS ДЛЯ SOCKET СООБЩЕНИЙ
// ============================================================================

/**
 * Type guard для проверки SocketAIAudioResponse
 */

export function isSocketAIAudioResponse(payload: unknown): payload is SocketAIAudioResponse {
  if (!isObject(payload)) return false

  return typeof payload.text === 'string' &&
    (payload.metadata === undefined || isAIMetadata(payload.metadata)) &&
    (payload.timestamp === undefined || typeof payload.timestamp === 'string') &&
    (payload.sessionId === undefined || typeof payload.sessionId === 'string')
}

/**
 * Type guard для проверки SocketAIResponseAlt
 */
export function isSocketAIResponseAlt(payload: unknown): payload is SocketAIResponseAlt {
  if (!isObject(payload)) return false

  return typeof payload.response === 'string' &&
    (payload.metadata === undefined || isAIMetadata(payload.metadata)) &&
    (payload.timestamp === undefined || typeof payload.timestamp === 'string') &&
    (payload.sessionId === undefined || typeof payload.sessionId === 'string')
}

/**
 * Type guard для проверки SocketAIAudioResponseExtended
 */
export function isSocketAIAudioResponseExtended(payload: unknown): payload is SocketAIAudioResponseExtended {
  if (!isObject(payload)) return false

  return (payload.text === undefined || isFlexibleText(payload.text)) &&
    (payload.response === undefined || typeof payload.response === 'string') &&
    (payload.metadata === undefined || isAIMetadata(payload.metadata)) &&
    (payload.timestamp === undefined || typeof payload.timestamp === 'string') &&
    (payload.sessionId === undefined || typeof payload.sessionId === 'string')
}

/**
 * Type guard для проверки SocketAIResponseExtended
 */
export function isSocketAIResponseExtended(payload: unknown): payload is SocketAIResponseExtended {
  if (!payload || typeof payload !== 'object') return false

  const p = payload as Record<string, unknown>

  return (p.text !== undefined || p.response !== undefined) &&
    (p.metadata === undefined || typeof p.metadata === 'object') &&
    (p.timestamp === undefined || typeof p.timestamp === 'string') &&
    (p.sessionId === undefined || typeof p.sessionId === 'string')
}
/**
  return isStringResponse(payload) ||
    isSocketAIAudioResponse(payload) ||
    isSocketAIResponseAlt(payload) ||
    isSocketAIAudioResponseExtended(payload) ||
    (isObject(payload) &&
      'text' in payload &&
      isFlexibleText(payload.text) &&
      (payload.metadata === undefined || isAIMetadata(payload.metadata)))
}

/**
 * Type guard для проверки SocketInterviewCompleted
 */
export function isSocketInterviewCompleted(payload: unknown): payload is SocketInterviewCompleted {
  if (!isObject(payload)) return false

  return typeof payload.sessionId === 'string' &&
    //isFinalReport(payload.finalReport) && //problems
    payload.finalReport !== undefined &&
    typeof payload.completionReason === 'string' &&
    typeof payload.wasAutomatic === 'boolean'
}

/**
 * Type guard для проверки SocketAIError
 */
export function isSocketAIError(payload: unknown): payload is SocketAIError {
  if (!isObject(payload)) return false

  return typeof payload.message === 'string' &&
    (payload.sessionId === undefined || typeof payload.sessionId === 'string')
}

/**
 * Type guard для проверки AIResponse
 */
export function isAIResponse(payload: unknown): payload is AIResponse {
  if (!isObject(payload)) return false

  return typeof payload.text === 'string' &&
    typeof payload.timestamp === 'string' &&
    (payload.audio === undefined || payload.audio instanceof ArrayBuffer) &&
    (payload.metadata === undefined || isAIMetadata(payload.metadata))
}