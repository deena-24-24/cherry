import React from 'react'
import { useInterviewStore } from '../../store/useInterviewStore'
import { useVoiceCall } from '../../pages/hooks/useVoiceCall'

export const VoiceCallPanel: React.FC = () => {
  const { isCallActive, startCall, endCall } = useInterviewStore()
  const { isRecording, startRecording, stopRecording } = useVoiceCall('session-1')

  const handleToggleCall = async () => {
    if (isCallActive) {
      endCall()
      stopRecording()
    } else {
      startCall()
      await startRecording()
    }
  }

  return (
    <div className="voice-call-panel bg-gray-800 rounded-lg p-6 h-full flex flex-col">
      <div className="video-placeholder bg-gray-700 rounded-lg flex-1 flex items-center justify-center mb-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
            <span className="text-white text-2xl">AI</span>
          </div>
          <p className="text-lg">AI Интервьюер</p>
          {isCallActive && (
            <div className="mt-2 text-green-400 text-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              В эфире
            </div>
          )}
        </div>
      </div>

      <div className="controls flex justify-center">
        <button
          onClick={handleToggleCall}
          className={`px-8 py-4 rounded-full text-lg font-medium transition-colors ${
            isCallActive
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isCallActive ? 'Завершить звонок' : 'Начать собеседование'}
        </button>
      </div>

      {isRecording && (
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-red-400">Идёт запись аудио...</p>
          </div>
        </div>
      )}
    </div>
  )
}