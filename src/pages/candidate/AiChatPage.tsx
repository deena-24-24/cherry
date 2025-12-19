import React, { useRef } from 'react'
import { useChatStore } from '../../store'
import { ChatMessage } from '../../components/chatPage/ChatMessage'
import { MessageInput } from '../../components/chatPage/MessageInput'
import * as styles from './AiChatPage.module.css'

export const AiChatPage: React.FC = () => {
  const { messages, isLoading, sendMessage } = useChatStore()
  const messagesEndRef = useRef<null | HTMLDivElement>(null)

  const handleSendMessage = async (messageText: string) => {
    await sendMessage(messageText)
  }

  return (
    <div className="container pd-lg">
      <div className={styles["chat-container"]}>
        <header className={styles["chat-header"]}>
          <h1 className="text-center">Чат с ИИ-ассистентом</h1>
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