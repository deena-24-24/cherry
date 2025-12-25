import React, { useRef, useEffect, useState } from 'react'
import { useAiChatStore } from '../../store'
import { ChatMessage } from '../../components/chatPage/ChatMessage'
import { MessageInput } from '../../components/chatPage/MessageInput'
import * as styles from './AiChatPage.module.css'
import { Loader } from '../../components/ui/Loader/Loader'

export const AiChatPage: React.FC = () => {
  const { messages, isLoading, fetchHistory, sendMessage } = useAiChatStore()
  const chatListRef = useRef<HTMLDivElement>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchHistory()
      } finally {
        setIsPageLoading(false)
      }
    }

    loadData()
  }, [fetchHistory])

  useEffect(() => {
    if (chatListRef.current) {
      const { scrollHeight, clientHeight } = chatListRef.current
      chatListRef.current.scrollTo({
        top: scrollHeight - clientHeight + 100,
        behavior: 'smooth'
      })
    }
  }, [messages, isLoading])

  const handleSendMessage = async (messageText: string) => {
    await sendMessage(messageText)
  }

  if (isPageLoading) return <Loader />
  return (
    <div className={styles["page"]}>
      <div className={styles["chat-container"]}>
        <header className={styles["chat-header"]}>
          <h1 className="text-center" style={{ color: 'white' }}>Помощник CareerUp AI</h1>
          <p className="text-center" style={{ fontSize: '0.9rem', opacity: 0.8, color: 'white' }}>
            Ваш персональный консультант по подготовке к собеседованиям
          </p>
        </header>

        <div
          className={styles["messages-list"]}
          ref={chatListRef}
        >
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg} />
          ))}

          {isLoading && (
            <div className={`${styles["message-row"]} ${styles['ai']}`}>
              <ChatMessage message={{ id: 'typing', sender: 'ai', text: 'печатает...' }}/>
            </div>
          )}
        </div>

        <footer className={styles["chat-footer"]}>
          <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </footer>
      </div>
    </div>
  )
}