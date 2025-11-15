'use client'

import { useEffect, useRef } from 'react'
import styles from './TerminalViewer.module.css'

interface TerminalViewerProps {
  sessionId: string
  asciinemaId?: string
}

export default function TerminalViewer({ sessionId, asciinemaId }: TerminalViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const asciinemaUrl = process.env.NEXT_PUBLIC_ASCIINEMA_URL || 'http://localhost:3000'

    // Clean up previous player
    if (playerRef.current && containerRef.current) {
      containerRef.current.innerHTML = ''
      playerRef.current = null
    }

    if (asciinemaId) {
      // Load asciinema recording/stream
      const loadPlayer = async () => {
        try {
          // Dynamically import asciinema-player
          const asciinemaModule = await import('asciinema-player')
          const AsciinemaPlayerClass = asciinemaModule.default || asciinemaModule
          
          // For livestream, use the asciinema API
          const streamUrl = `${asciinemaUrl}/api/asciicasts/${asciinemaId}/stream`
          
          // Initialize asciinema player
          // Note: This is a simplified version - you may need to adjust based on asciinema server API
          if (containerRef.current) {
            const player = AsciinemaPlayerClass.create(streamUrl, containerRef.current, {
              theme: 'asciinema',
              fontSize: 'small',
              fit: 'width',
            })

            playerRef.current = player
          }
        } catch (error) {
          console.error('Error loading asciinema stream:', error)
          if (containerRef.current) {
            containerRef.current.innerHTML = '<div class="error">Failed to load terminal stream</div>'
          }
        }
      }

      loadPlayer()
    } else {
      // No asciinema ID yet, show waiting message
      if (containerRef.current) {
        containerRef.current.innerHTML = '<div class="waiting">Waiting for terminal session to start...</div>'
      }
    }

    return () => {
      if (playerRef.current && containerRef.current) {
        containerRef.current.innerHTML = ''
        playerRef.current = null
      }
    }
  }, [sessionId, asciinemaId])

  return <div className={styles.container} ref={containerRef} />
}

