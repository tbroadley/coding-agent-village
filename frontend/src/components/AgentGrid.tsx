'use client'

import { useState, useEffect } from 'react'
import AgentPanel from './AgentPanel'
import styles from './AgentGrid.module.css'

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

interface AgentGridProps {
  agents: Agent[]
}

export default function AgentGrid({ agents }: AgentGridProps) {
  return (
    <div className={styles.grid}>
      {agents.map((agent) => (
        <AgentPanel key={agent.id} agent={agent} />
      ))}
    </div>
  )
}

