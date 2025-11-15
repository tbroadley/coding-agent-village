'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './AgentOutput.module.css'

interface AgentOutputProps {
  agentId: string
}

export default function AgentOutput({ agentId }: AgentOutputProps) {
  const [output, setOutput] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // TODO: Connect to agent output stream
    // For now, just show placeholder
    setLoading(false)
    setOutput('Agent output will appear here...\n\nThis will show the responses from Claude Code or Codex.')
  }, [agentId])

  useEffect(() => {
    // Auto-scroll to bottom
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [output])

  return (
    <div className={styles.container} ref={containerRef}>
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <pre className={styles.output}>{output}</pre>
      )}
    </div>
  )
}

