"use client"

import React from "react"
import { DollarSign } from "lucide-react"

export function MoneyTracker() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Money Tracker</h3>
        <p className="text-sm text-muted-foreground">Track player balances and transactions</p>
      </div>
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">No transactions yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Financial transactions will appear here as games are played
          </p>
        </div>
      </div>
    </div>
  )
}

