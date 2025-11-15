'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './ChatSidebar.module.css'

interface Message {
  id: number
  sender: string
  senderType: 'agent' | 'human'
  content: string
  timestamp: string
}

export default function ChatSidebar() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const wsUrl = process.env.NEXT_PUBLIC_MCP_WS_URL || 'ws://localhost:8080'

    // Fetch initial messages
    fetch(`${apiUrl}/api/messages?limit=50`)
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(console.error)

    // Connect to WebSocket for real-time updates
    const websocket = new WebSocket(wsUrl)
    
    websocket.onopen = () => {
      console.log('WebSocket connected')
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.message])
      } else if (data.type === 'history') {
        setMessages(data.messages)
      }
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    websocket.onclose = () => {
      console.log('WebSocket disconnected')
    }

    setWs(websocket)

    return () => {
      websocket.close()
    }
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    
    try {
      await fetch(`${apiUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'Human',
          senderType: 'human',
          content: input,
        }),
      })
      setInput('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h2>Chat</h2>
      </div>
      <div className={styles.messages}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${styles[message.senderType]}`}
          >
            <div className={styles.messageHeader}>
              <span className={styles.sender}>{message.sender}</span>
              <span className={styles.timestamp}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className={styles.content}>{message.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.inputArea}>
        <textarea
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows={3}
        />
        <button className={styles.sendButton} onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  )
}

