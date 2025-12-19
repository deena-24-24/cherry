import React, { useEffect, useRef, useState } from 'react'
import { ChatList } from '../../components/chatPage/ChatList'
import { ChatMessage } from '../../components/chatPage/ChatMessage'
import { MessageInput } from '../../components/chatPage/MessageInput'
import { useChatStore } from '../../store/useChatStore'
import { useAuthStore } from '../../store'
import * as styles from './ChatPage.module.css'

export const ChatPage: React.FC = () => {
  const [isChatListOpen, setIsChatListOpen] = useState(false)

  const { user } = useAuthStore()
  const {
    chats,
    activeChat,
    isLoadingList,
    isLoadingChat,
    isSending,
    fetchChats,
    fetchChatById,
    sendMessage
  } = useChatStore()

  const messagesEndRef = useRef<null | HTMLDivElement>(null)

  // 1. Загружаем список чатов при входе
  useEffect(() => {
    fetchChats().then()
  }, [fetchChats])

  const handleSelectChat = (id: string) => {
    fetchChatById(id).then()
  }

  const handleSendMessage = async (text: string) => {
    if (activeChat) {
      await sendMessage(activeChat.id, text)
    }
  }

  // Адаптер данных для компонента списка
  const conversationPreviews = chats.map(c => ({
    id: c.id,
    partnerName: c.partnerName,
    partnerCompany: c.partnerCompany,
    lastMessage: c.lastMessage,
    timestamp: new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    avatarUrl: c.partnerAvatar || ''
  }))

  if (isLoadingList && chats.length === 0) {
    return <div className={styles['centered-status']}>Загрузка чатов...</div>
  }

  return (
    <div className={styles['hr-chat-layout']}>
      <ChatList
        conversations={conversationPreviews}
        activeChatId={
          isChatListOpen
            ? null
            : activeChat?.id || null
        }
        onSelectChat={(id) => {
          handleSelectChat(id)
          setIsChatListOpen(false)
        }}
      />
      <main className={styles['chat-view-container']}>
        {isLoadingChat && !activeChat ? (
          <div className={styles['centered-status']}>Загрузка сообщений...</div>
        ) : activeChat ? (
          <>
            <header className={styles['chat-header']}>
              <button
                className={styles['chat-list-toggle']}
                onClick={() => setIsChatListOpen(true)}
              >
                ☰
              </button>
              <h1>{activeChat.partner.name}</h1>
              <p className={styles['status']}>
                {activeChat.partner.company || 'Личная переписка'}
              </p>
            </header>
            <div className={styles['messages-list']}>
              {activeChat.messages.map((msg) => {
                // В HR чате: если senderId == myId -> 'user' (справа), иначе -> 'ai' (слева, как собеседник)
                const userId = user?._id
                const isMe = msg.senderId === userId
                const displaySender = isMe ? 'user' : 'ai'

                return (
                  <ChatMessage
                    key={msg.id}
                    message={{
                      id: msg.id,
                      sender: displaySender,
                      text: msg.text
                    }}
                    senderDisplayName={isMe ? undefined : activeChat.partner.name}
                  />
                )
              })}
              <div ref={messagesEndRef} />
            </div>
            <footer className={styles['chat-footer']}>
              <MessageInput
                onSendMessage={handleSendMessage}
                isLoading={isSending}
              />
            </footer>
          </>
        ) : (
          <div className={styles['no-chat-selected']}>
            <div>
              <h2>Выберите чат</h2>
              <p>Чтобы начать общение с представителем компании или кандидатом</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}