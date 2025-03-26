"use client"

import React from "react"
import { History } from "lucide-react"

export function GameHistory() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Game History</h3>
        <p className="text-sm text-muted-foreground">Recent games and transactions</p>
      </div>
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <History className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">No game history yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Game history will appear here once games are played
          </p>
        </div>
      </div>
    </div>
  )
}

