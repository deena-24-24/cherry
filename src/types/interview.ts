// src/types/interview.ts
export interface InterviewSession {
  id: string
  title: string
  position: string
  difficulty: 'junior' | 'middle' | 'senior'
  status: 'scheduled' | 'active' | 'completed'
  createdAt: Date
}

export interface AudioState {
  isRecording: boolean
  isPlaying: boolean
  error?: string
}

export interface CodeExecutionResult {
  output: string
  error: string
  executionTime: number
}

// ТИПЫ ДЛЯ ОЦЕНКИ ОТВЕТА
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

// ТИПЫ ДЛЯ СЛЕДУЮЩЕГО ДЕЙСТВИЯ
export interface NextAction {
  action: 'continue_topic' | 'next_topic' | 'deep_dive_topic' | 'challenge_candidate' | 'complete_interview'
  reason: string
  confidence: number
  suggested_topic?: string | null
  priority: 'low' | 'medium' | 'high'
}

// ТИПЫ ДЛЯ ПРОГРЕССА ИНТЕРВЬЮ
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

// ТИПЫ ДЛЯ АНАЛИЗА ТЕМ
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

// ТИПЫ ДЛЯ АНАЛИЗА ДЕЙСТВИЙ
export interface ActionAnalysis {
  total_actions: number
  action_breakdown: Record<string, number>
  most_common_action: string
  completion_rate: 'completed' | 'not_completed'
}

// ТИПЫ ДЛЯ ПОВЕДЕНЧЕСКОГО АНАЛИЗА
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

// ТИПЫ ДЛЯ ТЕХНИЧЕСКИХ НАВЫКОВ
export interface TechnicalSkills {
  topics_covered: string[]
  strong_areas: string[]
  weak_areas: string[]
  technical_depth: number
  recommendations: string[]
}

// ТИПЫ ДЛЯ ОБЩЕЙ ОЦЕНКИ
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

// ТИПЫ ДЛЯ АНАЛИТИКИ ИНТЕРВЬЮ
export interface InterviewAnalytics {
  total_duration: string
  total_questions: number
  topics_covered_count: number
  average_response_quality: number
  topic_progression: string[]
  action_pattern: ActionAnalysis
}

// ГЛАВНЫЙ ТИП ДЛЯ ФИНАЛЬНОГО ОТЧЕТА
export interface FinalReport {
  overall_assessment: OverallAssessment
  technical_skills: TechnicalSkills
  behavioral_analysis: BehavioralAnalysis
  interview_analytics: InterviewAnalytics
  detailed_feedback: string
  next_steps: string[]
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

// ОБНОВЛЯЕМ AIResponse ДЛЯ ПОДДЕРЖКИ МЕТАДАННЫХ
export interface AIResponse {
  text: string
  audio?: ArrayBuffer
  timestamp: string
  metadata?: {
    isInterviewComplete?: boolean
    finalReport?: FinalReport
    completionReason?: string
    wasAutomatic?: boolean
    evaluation?: ResponseEvaluation
    nextAction?: NextAction
    currentTopic?: string
    interviewProgress?: InterviewProgress
    isFallback?: boolean
    error?: string
  }
}

export interface SocketMessage {
  type: 'ai-audio-response' | 'audio-chunk' | 'join-interview' | 'error' | 'interview-completed' | 'complete-interview'
  sessionId?: string
  text?: string
  chunkSize?: number
  message?: string
  metadata?: AIResponse['metadata']
}