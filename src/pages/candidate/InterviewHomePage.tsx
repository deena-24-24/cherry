import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { ROUTES } from '../../router/routes'

export const InterviewHomePage: React.FC = () => {
  const navigate = useNavigate()

  const handleStartInterview = () => {
    const sessionId = `session_${Date.now()}`
    // Переходим на страницу звонка
    navigate(ROUTES.INTERVIEW_CALL.replace(':sessionId', sessionId))
  }

  const handleViewResults = () => {
    navigate(ROUTES.RESULTS)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-6 py-16">
        {/* Хедер */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            AI Interview Assistant
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Подготовьтесь к собеседованию с искусственным интеллектом
          </p>
        </header>

        {/* Карточки фич */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* ... существующие карточки ... */}
        </div>

        {/* Кнопки действий */}
        <div className="text-center space-y-4 max-w-md mx-auto">
          {/* ЭТА КНОПКА ПЕРЕВОДИТ НА СТРАНИЦУ ЗВОНКА */}
          <Button
            onClick={handleStartInterview}
            className="w-full py-4 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            🎤 Начать новое собеседование
          </Button>

          <Button
            onClick={handleViewResults}
            variant="secondary"
            className="w-full py-4 text-lg"
          >
            📊 Посмотреть результаты
          </Button>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-16 text-center text-gray-300">
          <p>После нажатия кнопки вы попадете в виртуальную комнату собеседования</p>
        </div>
      </div>
    </div>
  )
}