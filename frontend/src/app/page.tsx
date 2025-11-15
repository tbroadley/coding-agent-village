'use client'

import { useEffect, useState } from 'react'
import AgentGrid from '@/components/AgentGrid'
import ChatSidebar from '@/components/ChatSidebar'
import styles from './page.module.css'

interface Agent {
  id: string
  name: string
  type: 'claude' | 'codex'
  status: 'running' | 'stopped' | 'starting' | 'error'
  terminalSessions: Array<{
    id: string
    name?: string
    asciinemaId?: string
    status: 'active' | 'completed'
  }>
}

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchAgents = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/agents`)
      const data = await response.json()
      setAgents(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching agents:', error)
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.gridSection}>
          {loading ? (
            <div className={styles.loading}>Loading agents...</div>
          ) : agents.length === 0 ? (
            <div className={styles.empty}>No agents running</div>
          ) : (
            <AgentGrid agents={agents} />
          )}
        </div>
        <div className={styles.sidebarSection}>
          <ChatSidebar />
        </div>
      </div>
    </main>
  )
}

