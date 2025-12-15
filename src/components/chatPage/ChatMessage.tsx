import React from 'react'
import Markdown from 'react-markdown'
import { Message } from '../../types'
import { FaRobot } from 'react-icons/fa'
import { FaUser } from 'react-icons/fa'
import * as styles from './ChatMessage.module.css'

interface ChatMessageProps {
  message: Message;
  senderDisplayName?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, senderDisplayName }) => {
  const isUser = message.sender === 'user'

  const cleanMessageContent = (text: string) => {
    if (!text) return ''
    // 1. Убираем отступы (4+ пробела) в начале строк, которые НЕ являются элементами списка
    // Regex: Найти 4+ пробела в начале строки, за которыми НЕ следует маркер списка (-, *, + или цифра с точкой)
    let cleaned = text.replace(/^( {4,})(?![-*+] |\d+\.)/gm, '')

    // 2. Дополнительно: можно убрать отступы в пустых строках
    cleaned = cleaned.replace(/^\s+$/gm, '')

    return cleaned
  }

  return (
    <div className={`${styles['message-container']} ${styles[`${isUser ? 'user' : 'ai'}`]}`}>
      <div className={styles["avatar"]}>
        {isUser ? <FaUser size={20} /> : (senderDisplayName ? <FaUser size={20} /> : <FaRobot size={20} />)}
      </div>
      <div className={styles["message-content"]}>
        <p className={styles["sender-name"]}>{isUser ? 'Вы' : (senderDisplayName || 'ИИ-Ассистент') }</p>
        <div className={styles["bubble"]}>
          <Markdown>{cleanMessageContent(message.text)}</Markdown>
        </div>
      </div>
    </div>
  )
}