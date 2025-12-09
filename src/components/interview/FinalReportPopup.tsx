// src/components/interview/FinalReportPopup.tsx
import React from 'react'
import { Button } from '../ui/Button'
import { FinalReport } from '../../types'

interface FinalReportPopupProps {
  report: FinalReport | null
  completionReason: string
  wasAutomatic: boolean
  onClose: () => void
}

export const FinalReportPopup: React.FC<FinalReportPopupProps> = ({
  report,
  completionReason,
  wasAutomatic,
  onClose
}) => {
  console.log('🎪 FinalReportPopup rendering with:', {
    report,
    hasReport: !!report,
    reportKeys: report ? Object.keys(report) : 'none',
    hasOverallAssessment: report?.overall_assessment
  })
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

  // Вспомогательная функция для рендеринга сильных сторон
  const renderStrength = (strength: string | { strength: string; frequency: number; confidence: number }) => {
    if (typeof strength === 'string') {
      return strength
    }
    return strength.strength
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Хедер */}
        <div className="bg-gray-900 px-6 py-4 rounded-t-2xl border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">🎯 Финальный отчет по собеседованию</h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${recommendation.color} bg-opacity-20`}>
                  {recommendation.text}
                </span>
                <span className="text-sm text-gray-400">
                  {wasAutomatic ? '🤖 Автоматическое завершение' : '👤 Ручное завершение'}
                </span>
              </div>
            </div>
            <Button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
          <p className="text-gray-400 mt-2">
            {completionReason}
          </p>
        </div>

        {/* Контент */}
        <div className="p-6 space-y-6">
          {/* Общая оценка */}
          <div className="bg-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">📊 Общая оценка</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {overall_assessment.final_score}/10
                </div>
                <div className="text-gray-400">Общий балл</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {overall_assessment.level}
                </div>
                <div className="text-gray-400">Уровень</div>
              </div>
            </div>

            {/* Сильные стороны и улучшения */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="text-green-400 font-medium mb-2">✅ Сильные стороны:</h4>
                <ul className="list-disc list-inside text-gray-300 text-sm">
                  {overall_assessment.strengths?.map((strength, index: number) => (
                    <li key={index}>{ renderStrength(strength) }</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-yellow-400 font-medium mb-2">📈 Улучшения:</h4>
                <ul className="list-disc list-inside text-gray-300 text-sm">
                  {overall_assessment.improvements?.map((improvement: string, index: number) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Технические навыки */}
          <div className="bg-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">💻 Технические навыки</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-green-400 font-medium">Освоенные темы:</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {technical_skills.topics_covered?.map((topic: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {technical_skills.strong_areas && technical_skills.strong_areas.length > 0 && (
                <div>
                  <h4 className="text-blue-400 font-medium">Сильные области:</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {technical_skills.strong_areas.map((area: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {technical_skills.weak_areas && technical_skills.weak_areas.length > 0 && (
                <div>
                  <h4 className="text-yellow-400 font-medium">Зоны роста:</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {technical_skills.weak_areas.map((area: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">
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
            <div className="bg-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">🧠 Поведенческий анализ</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {behavioral_analysis.communication_skills?.score}/10
                  </div>
                  <div className="text-gray-400 text-sm">Коммуникация</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {behavioral_analysis.communication_skills?.feedback}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {behavioral_analysis.problem_solving?.score}/10
                  </div>
                  <div className="text-gray-400 text-sm">Решение проблем</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {behavioral_analysis.problem_solving?.feedback}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Аналитика интервью */}
          {interview_analytics && (
            <div className="bg-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">📈 Аналитика интервью</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {interview_analytics.total_questions}
                  </div>
                  <div className="text-gray-400 text-sm">Всего вопросов</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {interview_analytics.topics_covered_count}
                  </div>
                  <div className="text-gray-400 text-sm">Тем покрыто</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {interview_analytics.average_response_quality}/10
                  </div>
                  <div className="text-gray-400 text-sm">Средняя оценка</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {interview_analytics.total_duration}
                  </div>
                  <div className="text-gray-400 text-sm">Продолжительность</div>
                </div>
              </div>
            </div>
          )}

          {/* Детальный фидбек */}
          <div className="bg-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">📝 Детальный фидбек</h3>
            <p className="text-gray-300 leading-relaxed">
              {detailed_feedback}
            </p>
          </div>

          {/* Следующие шаги */}
          <div className="bg-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">🎯 Следующие шаги</h3>
            <ul className="space-y-2">
              {next_steps?.map((step: string, index: number) => (
                <li key={index} className="flex items-start text-gray-300">
                  <span className="text-blue-400 mr-2">•</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Футер */}
        <div className="bg-gray-900 px-6 py-4 rounded-b-2xl border-t border-gray-700">
          <div className="flex justify-end">
            <Button onClick={onClose} className="bg-blue-500 hover:bg-blue-600">
              Завершить просмотр
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}