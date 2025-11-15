import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Coding Agent Village',
  description: 'Multi-agent coding collaboration system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

