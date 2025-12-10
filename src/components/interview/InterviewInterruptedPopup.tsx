// src/components/interview/InterviewInterruptedPopup.tsx
import React from 'react'
import { Button } from '../ui/Button/Button'

interface InterviewInterruptedPopupProps {
  reason: string
  onClose: () => void
}

export const InterviewInterruptedPopup: React.FC<InterviewInterruptedPopupProps> = ({
  reason,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-md w-full">
        {/* Хедер */}
        <div className="bg-gray-900 px-6 py-4 rounded-t-2xl border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Собеседование прервано</h2>
            <Button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Контент */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏸️</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Собеседование было прервано
            </h3>
            <p className="text-gray-300">
              {reason}
            </p>
          </div>

          <div className="bg-yellow-500/20 rounded-lg p-4 mb-6 border border-yellow-500/30">
            <h4 className="text-yellow-400 font-medium mb-2">Что это значит?</h4>
            <ul className="text-sm text-yellow-300 space-y-1">
              <li>• Вы можете вернуться к собеседованию позже</li>
              <li>• Прогресс будет сохранен</li>
              <li>• Для получения полной оценки нужно завершить собеседование</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onClose}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              Понятно, вернуться на главную
            </Button>

            <div className="text-center">
              <Button
                onClick={onClose}
                className="text-sm text-gray-400 hover:text-gray-300 underline"
              >
                или продолжить позже
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}