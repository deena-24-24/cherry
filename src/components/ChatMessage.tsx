import React from 'react'
import { Message } from '../types'
import { FaRobot } from 'react-icons/fa'
import { FaUser } from 'react-icons/fa'
import * as styles from './ChatMessage.module.css'

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user'

  return (
    <div className={`${styles['message-container']} ${styles[`${isUser ? 'user' : 'ai'}`]}`}>
      <div className={styles["avatar"]}>
        {isUser ? <FaUser size={20} /> : <FaRobot size={20} />}
      </div>
      <div className={styles["message-content"]}>
        <p className={styles["sender-name"]}>{isUser ? 'Вы' : 'ИИ-Ассистент'}</p>
        <div className={styles["bubble"]}>
          <p>{message.text}</p>
        </div>
      </div>
    </div>
  )
}