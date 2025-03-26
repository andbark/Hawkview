"use client"

import React from "react"
import { Dices } from 'lucide-react'

export function GamesList() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Games</h3>
        <p className="text-sm text-muted-foreground">Recent and upcoming games</p>
      </div>
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Dices className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">No games scheduled</h3>
          <p className="mt-2 text-sm text-gray-500">
            Click the "New Game" button to schedule a game
          </p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  )
}
