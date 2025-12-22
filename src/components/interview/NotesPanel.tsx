import React from 'react'
import { useInterviewStore } from '../../store'
import { interviewService } from '../../service/api/interviewService'

export const NotesPanel: React.FC = () => {
  const { notes, updateNotes, currentSession } = useInterviewStore()

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value
    updateNotes(newNotes)

    // Автосохранение заметок
    if (currentSession) {
      interviewService.saveNotes(newNotes).then()
    }
  }

  return (
    <div className="notes-panel bg-gray-900 rounded-xl h-full flex flex-col border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between bg-gray-900/60 border-b border-gray-800">
        <h3 className="font-medium text-base">Заметки</h3>
        <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-1 rounded">Автосохранение</span>
      </div>
      <textarea
        value={notes}
        onChange={handleNotesChange}
        className="flex-1 w-full bg-transparent p-4 text-white resize-none focus:outline-none placeholder:text-gray-500"
        placeholder="Записывайте важные моменты, вопросы и оценки кандидата…"
      />
    </div>
  )
}