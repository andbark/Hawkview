"use client"

import { useState } from "react"
import { Beer } from 'lucide-react'

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Beer className="h-6 w-6" />
        <span className="text-xl font-bold tracking-tight">Bachelor Party Tracker</span>
      </div>
      <nav className="ml-auto flex gap-4">
        <a href="/players" className="px-4 py-2 hover:bg-gray-100 rounded">Players</a>
        <a href="/games" className="px-4 py-2 hover:bg-gray-100 rounded">Games</a>
        <a href="/leaderboard" className="px-4 py-2 hover:bg-gray-100 rounded">Leaderboard</a>
      </nav>
    </header>
  )
}
