import './globals.css';
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bachelor Party Tracker',
  description: 'Track your bachelor party activities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
