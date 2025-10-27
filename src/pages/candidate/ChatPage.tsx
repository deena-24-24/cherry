import React, { useEffect, useRef } from 'react'
import { useChatStore } from '../../store'
import { ChatMessage } from '../../components/ChatMessage'
import { MessageInput } from '../../components/MessageInput'
import * as styles from './ChatPage.module.css'

export const ChatPage: React.FC = () => {
  const { messages, isLoading, sendMessage } = useChatStore()
  const messagesEndRef = useRef<null | HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    // Даем небольшую задержку, чтобы DOM успел обновиться
    setTimeout(scrollToBottom, 100)
  }, [messages])

  const handleSendMessage = (messageText: string) => {
    sendMessage(messageText)
  }

  return (
    <div className="container pd-lg">
      <div className={styles["chat-container"]}>
        <header className={styles["chat-header"]}>
          <h1 className="text-center">Чат с ИИ-ассистентом</h1>
          <p className={`text-center ${styles["status"]}`}>Онлайн</p>
        </header>

        <div className={styles["messages-list"]}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className={`${styles["message-row"]} ${styles['ai']}`}>
              <ChatMessage message={{ id: 'typing', sender: 'ai', text: 'печатает...' }}/>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <footer className={styles["chat-footer"]}>
          <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </footer>
      </div>
    </div>
  )
}