import React from 'react'
import { useInterviewStore } from '../../store'
import { interviewService } from '../../service/interview/interviewService'
import * as styles from './NotesPanel.module.css'

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