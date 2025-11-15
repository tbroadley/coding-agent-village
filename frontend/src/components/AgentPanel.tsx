'use client'

import { useState, useEffect } from 'react'
import AgentOutput from './AgentOutput'
import TerminalViewer from './TerminalViewer'
import styles from './AgentPanel.module.css'

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

interface AgentPanelProps {
  agent: Agent
}

export default function AgentPanel({ agent }: AgentPanelProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    agent.terminalSessions.length > 0 ? agent.terminalSessions[0].id : null
  )

  useEffect(() => {
    if (agent.terminalSessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(agent.terminalSessions[0].id)
    }
  }, [agent.terminalSessions, selectedSessionId])

  const selectedSession = agent.terminalSessions.find(s => s.id === selectedSessionId)

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.agentName}>
          {agent.name} ({agent.type})
        </h3>
        <span className={`${styles.status} ${styles[agent.status]}`}>
          {agent.status}
        </span>
      </div>
      <div className={styles.grid}>
        <div className={styles.outputSection}>
          <div className={styles.sectionHeader}>Agent Output</div>
          <AgentOutput agentId={agent.id} />
        </div>
        <div className={styles.terminalSection}>
          <div className={styles.sectionHeader}>
            Terminal Sessions
            {agent.terminalSessions.length > 1 && (
              <select
                className={styles.sessionSelector}
                value={selectedSessionId || ''}
                onChange={(e) => setSelectedSessionId(e.target.value)}
              >
                {agent.terminalSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name || session.id}
                  </option>
                ))}
              </select>
            )}
          </div>
          {selectedSession ? (
            <TerminalViewer
              sessionId={selectedSession.id}
              asciinemaId={selectedSession.asciinemaId}
            />
          ) : (
            <div className={styles.noSession}>No active terminal session</div>
          )}
        </div>
      </div>
    </div>
  )
}

