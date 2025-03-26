"use client"

import { useState } from "react"
import { Beer, Crown, Menu, Trophy, Users } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"

export function DashboardHeader() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 sm:max-w-xs">
          <nav className="grid gap-2 text-lg font-medium">
            <Button variant="ghost" className="justify-start gap-2" onClick={() => setIsOpen(false)}>
              <Users className="h-5 w-5" />
              Players
            </Button>
            <Button variant="ghost" className="justify-start gap-2" onClick={() => setIsOpen(false)}>
              <Trophy className="h-5 w-5" />
              Games
            </Button>
            <Button variant="ghost" className="justify-start gap-2" onClick={() => setIsOpen(false)}>
              <Crown className="h-5 w-5" />
              Leaderboard
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <Beer className="h-6 w-6" />
        <span className="text-xl font-bold tracking-tight">Bachelor Party Tracker</span>
      </div>
      <nav className="ml-auto hidden gap-4 md:flex">
        <Button variant="ghost" className="gap-2">
          <Users className="h-5 w-5" />
          Players
        </Button>
        <Button variant="ghost" className="gap-2">
          <Trophy className="h-5 w-5" />
          Games
        </Button>
        <Button variant="ghost" className="gap-2">
          <Crown className="h-5 w-5" />
          Leaderboard
        </Button>
      </nav>
      <div className="ml-auto md:ml-0">
        <ThemeToggle />
      </div>
    </header>
  )
}
