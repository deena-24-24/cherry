import React from 'react'
import { useParams } from 'react-router-dom'
import { useInterviewStore } from '../../store'
import { interviewService } from '../../service/api/interviewService'
import * as styles from './NotesPanel.module.css'

export const NotesPanel: React.FC = () => {
  const { notes, updateNotes, currentSession } = useInterviewStore()
  const { sessionId } = useParams<{ sessionId: string }>()

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value
    updateNotes(newNotes)

    // Автосохранение заметок - используем sessionId из URL или из currentSession
    const targetSessionId = sessionId || currentSession?.id
    if (targetSessionId) {
      interviewService.saveNotes(newNotes, targetSessionId).catch(err => {
        // Тихая обработка ошибок - не засоряем консоль
        console.warn('⚠️ Failed to auto-save notes:', err)
      })
    } else {
      console.warn('⚠️ Cannot save notes: no session ID available', { 
        sessionId,
        currentSessionId: currentSession?.id 
      })
    }
  }

  return (
    <div className={styles.notesPanel}>
      <div className={styles.notesHeader}>
        <h3 className={styles.notesTitle}>
          <span className={styles.notesIcon}>📝</span>
          Заметки
        </h3>
        <span className={styles.autosaveBadge}>
          Автосохранение
        </span>
      </div>
      <textarea
        value={notes}
        onChange={handleNotesChange}
        className={styles.notesTextarea}
        placeholder="Записывайте важные моменты, вопросы и оценки кандидата…"
      />
    </div>
  )
}