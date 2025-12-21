// src/components/interview/FinalReportPopup.tsx
import React from 'react'
import { Button } from '../ui/Button/Button'
import { FinalReport } from '../../types'
import './FinalReportPopup.css'

interface FinalReportPopupProps {
  report: FinalReport | null
  completionReason: string
  wasAutomatic: boolean
  onClose: () => void
  notes?: string // Заметки из сессии
}

export const FinalReportPopup: React.FC<FinalReportPopupProps> = ({
  report,
  completionReason,
  wasAutomatic,
  onClose,
  notes
}) => {
  // Убрали избыточное логирование - логи только при первой отрисовке
  React.useEffect(() => {
    console.log('🎪 FinalReportPopup mounted with report:', {
      hasReport: !!report,
      completionReason
    })
  }, []) // Только при монтировании

  // Проверяем, завершилось ли интервью из-за ошибок LLM API
  const isLLMError = completionReason?.toLowerCase().includes('llm') || 
                     completionReason?.toLowerCase().includes('ошибк') ||
                     completionReason?.toLowerCase().includes('превышено') ||
                     (report?.overall_assessment?.final_score === 0 && 
                      report?.overall_assessment?.level === 'Не оценено' &&
                      (report?.detailed_feedback?.toLowerCase().includes('llm') ||
                       report?.detailed_feedback?.toLowerCase().includes('gigachat') ||
                       report?.detailed_feedback?.toLowerCase().includes('402')))

  if (!report || !report.overall_assessment) {
    console.error('❌ Invalid report data in FinalReportPopup:', {
      report,
      completionReason,
      wasAutomatic
    })
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-2xl max-w-md w-full p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            ⚠️ Данные отчета недоступны
          </h2>
          <p className="text-gray-300 mb-4">
            Не удалось загрузить полный отчет. Основные данные отсутствуют.
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Причина: {completionReason || 'Неизвестно'}
          </p>
          <Button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            Закрыть
          </Button>
        </div>
      </div>
    )
  }
  const {
    overall_assessment,
    technical_skills,
    behavioral_analysis,
    interview_analytics,
    detailed_feedback
  } = report

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_hire': return { text: '✅ Сильная рекомендация', color: 'text-green-400' }
      case 'hire': return { text: '👍 Рекомендован', color: 'text-blue-400' }
      case 'maybe_hire': return { text: '🤔 Рассмотреть', color: 'text-yellow-400' }
      case 'no_hire': return { text: '❌ Не рекомендован', color: 'text-red-400' }
      default: return { text: '⚪ Требуется оценка', color: 'text-gray-400' }
    }
  }

  const recommendation = getRecommendationText(overall_assessment.recommendation)

  // Вспомогательная функция для рендеринга сильных сторон
  const renderStrength = (strength: string | { strength: string; frequency: number; confidence: number }) => {
    if (typeof strength === 'string') {
      return strength
    }
    return strength.strength
  }

  return (
    <div className="frp-overlay">
      <div className="frp-container">
        {/* Хедер */}
        <div className="frp-header-wrapper">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="frp-title">🎯 Финальный отчет по собеседованию</h2>
              <div className="frp-recommendation-row">
                <span className={`frp-recommendation ${recommendation.color}`}>
                  {recommendation.text}
                </span>
                <span className="frp-finish-type">
                  {wasAutomatic ? '🤖 Автоматическое завершение' : '👤 Ручное завершение'}
                </span>
              </div>
            </div>
            {/*<Button onClick={onClose} className="frp-close-btn">✕</Button>*/}
          </div>
          {/*<p className="frp-reason-text">{completionReason}</p>*/}
        </div>

        {/* Специальное предупреждение для ошибок LLM API */}
        {isLLMError && (
          <div className="frp-llm-error-banner">
            <div className="frp-llm-error-icon">⚠️</div>
            <div className="frp-llm-error-content">
              <h3 className="frp-llm-error-title">Собеседование прервано из-за ошибки LLM API</h3>
              <p className="frp-llm-error-text">
                Произошла ошибка при подключении к сервису GigaChat (ошибка 402: Payment Required). 
                Интервью было автоматически завершено после 3 неудачных попыток.
              </p>
              <p className="frp-llm-error-note">
                <strong>Оценка: 0/10</strong> - не может быть выставлена из-за технических проблем с API.
              </p>
            </div>
          </div>
        )}

        {/* Контент */}
        <div className="frp-content">
          {/* Общая оценка */}
          <div className="frp-section-box">
            <h3 className="frp-section-title">📊 Общая оценка</h3>
            <div className="frp-two-cols">
              <div className="frp-score-col">
                <div className="frp-score-main">{overall_assessment.final_score}/10 </div>
                <div className="frp-score-label">Общий балл</div>
              </div>
              <div className="frp-score-col">
                <div className="frp-score-level">{overall_assessment.level}</div>
                <div className="frp-score-label">Уровень</div>
              </div>
            </div>

            {/* Сильные стороны и улучшения */}
            <div className="frp-two-cols mt-20">
              <div>
                <h4 className="frp-section-title">✅ Сильные стороны:</h4>
                <ul className="frp-list">
                  {overall_assessment.strengths?.map((strength, index: number) => (
                    <li key={index}>{ renderStrength(strength) }</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="frp-section-title">📈 Улучшения:</h4>
                {/*<ul className=" list-disc list-inside text-gray-300 text-sm">*/}
                <ul className="frp-list">
                  {overall_assessment.improvements?.map((improvement: string, index: number) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Технические навыки */}
          {technical_skills && (
            <div className="frp-section-box">
              <h3 className="frp-section-title">💻 Технические навыки</h3>
              <div className="space-y-4">
                <div className="">
                  <h4 className="frp-section-title green">Освоенные темы:</h4>
                  <div className="frp-badges-row">
                    {technical_skills.topics_covered?.map((topic: string, index: number) => (
                      <span key={index} className="frp-badge green">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {technical_skills.strong_areas && technical_skills.strong_areas.length > 0 && (
                  <div>
                    <h4 className="frp-section-title">Сильные области:</h4>
                    <div className="frp-badges-row">
                      {technical_skills.strong_areas.map((area: string, index: number) => (
                        <span key={index} className="frp-badge blue">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {technical_skills.weak_areas && technical_skills.weak_areas.length > 0 && (
                  <div>
                    <h4 className="frp-section-title">Зоны роста:</h4>
                    <div className="frp-section-title">
                      {technical_skills.weak_areas.map((area: string, index: number) => (
                        <span key={index} className="frp-badge yellow">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Поведенческий анализ */}
          {behavioral_analysis && (
            <div className="frp-section-box">
              <h3 className="frp-section-title">🧠 Поведенческий анализ</h3>
              <div className="frp-two-cols">
                <div className="frp-score-col">
                  <div className="frp-score-purple">
                    {behavioral_analysis.communication_skills?.score}/10</div>
                  <div className="frp-score-label">Коммуникация</div>
                  <p className="frp-small-text">
                    {behavioral_analysis.communication_skills?.feedback}
                  </p>
                </div>
                <div className="frp-score-col">
                  <div className="frp-score-purple">
                    {behavioral_analysis.problem_solving?.score}/10
                  </div>
                  <div className="frp-score-label">Решение проблем</div>
                  <p className="frp-small-text">
                    {behavioral_analysis.problem_solving?.feedback}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Аналитика интервью */}
          {interview_analytics && (
            <div className="frp-section-box">
              <h3 className="frp-section-title">📈 Аналитика интервью</h3>
              <div className="frp-four-grid">
                <div className="frp-analytic-item">
                  <div className="frp-analytic-value blue">
                    {interview_analytics.total_questions}
                  </div>
                  <div className="frp-analytic-label">Всего вопросов</div>
                </div>
                <div className="frp-analytic-item">
                  <div className="frp-analytic-value green">
                    {interview_analytics.topics_covered_count}
                  </div>
                  <div className="frp-analytic-label">Тем покрыто</div>
                </div>
                <div className="frp-analytic-item">
                  <div className="frp-analytic-value purple">
                    {interview_analytics.average_response_quality}/10
                  </div>
                  <div className="frp-analytic-label">Средняя оценка</div>
                </div>
                <div className="frp-analytic-item">
                  <div className="frp-analytic-value yellow">
                    {interview_analytics.total_duration}
                  </div>
                  <div className="frp-analytic-label">Продолжительность</div>
                </div>
              </div>
            </div>
          )}

          {/* Детальный фидбек */}
          {detailed_feedback && (
            <div className="frp-section-box">
              <h3 className="frp-section-title">📝 Детальный фидбек</h3>
              <div className="frp-feedback-structured">
                {detailed_feedback.split(/\.\s+/).filter(s => s.trim().length > 0).map((sentence, index, array) => {
                  // Проверяем, является ли предложение важной информацией (баллы, рекомендации и т.д.)
                  const isImportant = sentence.toLowerCase().includes('балл') || 
                                      sentence.toLowerCase().includes('рекоменд') ||
                                      sentence.toLowerCase().includes('найм') ||
                                      sentence.toLowerCase().includes('уровень')
                  
                  // Проверяем, начинается ли с цифр (вероятно статистика)
                  const isStats = /^\d+/.test(sentence.trim())
                  
                  return (
                    <div 
                      key={index} 
                      className={`frp-feedback-sentence ${
                        isImportant ? 'frp-feedback-important' : 
                          isStats ? 'frp-feedback-stats' : 
                            'frp-feedback-normal'
                      }`}
                    >
                      {index < array.length - 1 ? sentence + '.' : sentence}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Заметки */}
          {notes && notes.trim().length > 0 && (
            <div className="frp-section-box">
              <h3 className="frp-section-title">📋 Заметки интервьюера</h3>
              <div className="frp-notes-content">
                {notes.split('\n').filter(line => line.trim().length > 0).map((line, index) => (
                  <div key={index} className="frp-notes-line">{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="bg-gray-900 px-6 py-4 rounded-b-2xl border-t border-gray-700">
          <div className="frp-footer">
            <Button onClick={onClose}>
              Завершить просмотр
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}