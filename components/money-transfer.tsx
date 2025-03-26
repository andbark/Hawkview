"use client"

import React from "react"
import { ArrowRight } from "lucide-react"

export function MoneyTransfer() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Money Transfer</h3>
        <p className="text-sm text-muted-foreground">Transfer money between players</p>
      </div>
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <ArrowRight className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">No transfers yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Money transfers will appear here as players make them
          </p>
        </div>
      </div>
    </div>
  )
}

