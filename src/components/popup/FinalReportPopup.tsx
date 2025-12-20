import React from 'react'
import { Button } from '../ui/Button/Button'
import { FinalReport } from '../../types'
import './FinalReportPopup.css'

interface FinalReportPopupProps {
  report: FinalReport | null
  completionReason: string
  wasAutomatic: boolean
  onClose: () => void
  isLoading?: boolean
}

export const FinalReportPopup: React.FC<FinalReportPopupProps> = ({
  report,
  completionReason,
  wasAutomatic,
  onClose,
  isLoading = false
}) => {
  // 1. Состояние загрузки
  if (isLoading) {
    return (
      <div className="frp-overlay">
        <div className="frp-container" style={{ textAlign: 'center', padding: '60px' }}>
          <h2 className="frp-title" style={{ marginBottom: '20px' }}>
            ⏳ Формируем финальный отчет...
          </h2>
          <p className="frp-reason-text" style={{ fontSize: '16px' }}>
            ИИ анализирует ваши ответы, оценивает навыки и составляет рекомендации.
            <br />
            Это может занять от 10 до 30 секунд.
          </p>
          <div style={{ marginTop: '30px' }}>
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  // 2. Состояние ошибки (если загрузка кончилась, а отчета нет)
  if (!report || !report.overall_assessment) {
    return (
      <div className="frp-overlay">
        <div className="frp-container" style={{ maxWidth: '500px' }}>
          <h2 className="frp-title" style={{ color: '#f87171' }}>
            ⚠️ Данные отчета недоступны
          </h2>
          <p className="frp-reason-text" style={{ marginTop: '15px' }}>
            Не удалось загрузить полный отчет. Возможно, произошла ошибка на сервере при генерации.
          </p>
          <p className="frp-finish-type" style={{ marginTop: '10px' }}>
            Причина: {completionReason || 'Неизвестно'}
          </p>
          <div className="frp-footer" style={{ marginTop: '25px' }}>
            <Button onClick={onClose}>Закрыть</Button>
          </div>
        </div>
      </div>
    )
  }

  const {
    overall_assessment,
    technical_skills,
    behavioral_analysis,
    interview_analytics,
    detailed_feedback,
    next_steps
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
          <div className="flex items-center justify-between w-full">
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
          </div>
        </div>

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
                <ul className="frp-list">
                  {overall_assessment.improvements?.map((improvement: string, index: number) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Технические навыки */}
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
                  <div className="frp-badges-row">
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
          <div className="frp-section-box">
            <h3 className="frp-section-title">📝 Детальный фидбек</h3>
            <p className="frp-detailed-text">
              {detailed_feedback}
            </p>
          </div>

          {/* Следующие шаги */}
          <div className="frp-section-box">
            <h3 className="frp-section-title">🎯 Следующие шаги</h3>
            <ul className="frp-list">
              {next_steps?.map((step: string, index: number) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
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