import React, { useState, useEffect, useCallback } from 'react'
import { ChatList } from '../../components/chatPage/ChatList'
import { ChatMessage } from '../../components/chatPage/ChatMessage'
import { MessageInput } from '../../components/chatPage/MessageInput'
import { useAuthStore } from '../../store'
import * as styles from './HrChatPage.module.css'
import { API_URL } from '../../config'

interface ConversationPreview {
  id: string;
  partnerName: string;
  partnerCompany: string;
  lastMessage: string;
  timestamp: string;
  avatarUrl: string;
}

interface Message {
  id: string;
  sender: 'user' | 'hr';
  text: string;
}

interface FullConversation {
  id: string;
  messages: Message[];
  hrInfo: {
    name: string;
    company: string;
  };
}

export const HrChatPage: React.FC = () => {
  const { token } = useAuthStore()

  const [conversations, setConversations] = useState<ConversationPreview[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [activeConversation, setActiveConversation] = useState<FullConversation | null>(null)

  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConversations = async () => {
      if (!token) {
        setError('Пожалуйста, войдите в систему для просмотра чатов.')
        setIsLoadingList(false)
        return
      }

      const apiHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }

      try {
        setIsLoadingList(true)
        setError(null)
        const response = await fetch(`${API_URL}/api/hr/chats`, { headers: apiHeaders })

        if (!response.ok) {
          throw new Error('Не удалось загрузить список чатов')
        }
        const data: ConversationPreview[] = await response.json()
        setConversations(data)

        // Автоматически выбираем первый чат, если он есть
        if (data.length > 0) {
          setActiveChatId(data[0].id)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoadingList(false)
      }
    }

    fetchConversations().then()
  }, [])

  const fetchActiveChat = useCallback(async (chatId: string) => {
    if (!token) return

    const apiHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }

    try {
      setIsLoadingChat(true)
      setError(null)
      const response = await fetch(`${API_URL}/api/hr/chats/${chatId}`, { headers: apiHeaders })
      if (!response.ok) {
        throw new Error('Не удалось загрузить сообщения чата')
      }
      const data: FullConversation = await response.json()
      setActiveConversation(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingChat(false)
    }
  }, [token])

  useEffect(() => {
    if (activeChatId) {
      fetchActiveChat(activeChatId).then()
    }
  }, [activeChatId, fetchActiveChat])

  const handleSelectChat = (id: string) => {
    setActiveChatId(id)
  }

  const handleSendMessage = async (messageText: string) => {
    if (!activeChatId || !token) return

    const apiHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }

    try {
      setIsSending(true)
      const response = await fetch(`${API_URL}/api/hr/chats/${activeChatId}/message`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ text: messageText }),
      })

      if (!response.ok) {
        throw new Error('Не удалось отправить сообщение')
      }

      await fetchActiveChat(activeChatId)

    } catch (err) {
      setError(err.message)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoadingList) {
    return <div className={styles['centered-status']}>Загрузка чатов...</div>
  }

  if (error && !conversations.length) {
    return <div className={styles['centered-status-error']}>Ошибка: {error}</div>
  }

  return (
    <div className={styles['hr-chat-layout']}>
      <ChatList
        conversations={conversations}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
      />
      <main className={styles['chat-view-container']}>
        {isLoadingChat ? (
          <div className={styles['centered-status']}>Загрузка сообщений...</div>
        ) : activeConversation ? (
          <>
            <header className={styles['chat-header']}>
              <h1>{activeConversation.hrInfo.name}</h1>
              <p className={styles['status']}>{activeConversation.hrInfo.company}</p>
            </header>
            <div className={styles['messages-list']}>
              {activeConversation.messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={{ ...msg, sender: msg.sender === 'hr' ? 'ai' : 'user' }}
                />
              ))}
            </div>
            <footer className={styles['chat-footer']}>
              <MessageInput onSendMessage={handleSendMessage} isLoading={isSending} />
            </footer>
          </>
        ) : (
          <div className={styles['no-chat-selected']}>
            <h2>Выберите чат, чтобы начать общение</h2>
          </div>
        )}
      </main>
    </div>
  )
}