import React, { useState } from 'react'
import { FaPaperclip, FaPaperPlane } from 'react-icons/fa'
import * as styles from './MessageInput.module.css'

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('')

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim() && !isLoading) {
      onSendMessage(text.trim())
      setText('')
    }
  }

  const handleAttachClick = () => {
    alert('Функционал прикрепления файлов в разработке!')
  }

  return (
    <form className={styles['message-input-form']} onSubmit={handleSendMessage}>
      <button
        type="button"
        className={styles['icon-button']}
        onClick={handleAttachClick}
        aria-label="Прикрепить файл"
        disabled={isLoading}
      >
        <FaPaperclip size={20} />
      </button>
      <input
        type="text"
        // Используем правильный класс из CSS модуля
        className={styles['message-input-field']}
        placeholder="Введите ваше сообщение..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
        autoComplete="off"
      />
      <button
        type="submit"
        // Комбинируем классы для кнопки отправки
        className={`${styles['icon-button']} ${styles['send-button']}`}
        disabled={isLoading || !text.trim()}
        aria-label="Отправить сообщение"
      >
        <FaPaperPlane size={20} />
      </button>
    </form>
  )
}