"use client"

import { useState } from "react"
import { BarChart3, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Mock data for player stats
const initialStats = {
  totalPlayers: 7,
  activePlayers: 5,
  totalGames: 5,
  activeGames: 2,
  totalWinnings: 675,
  totalLosses: 100,
  netTotal: 575,
}

export function PlayerStats() {
  const [stats, setStats] = useState(initialStats)
  const [newPlayerName, setNewPlayerName] = useState("")
  const [open, setOpen] = useState(false)

  const handleAddPlayer = () => {
    if (newPlayerName) {
      setStats({
        ...stats,
        totalPlayers: stats.totalPlayers + 1,
        activePlayers: stats.activePlayers + 1,
      })
      setNewPlayerName("")
      setOpen(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Stats
          </CardTitle>
          <CardDescription>Overview of party stats</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8">
              <Users className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Player</DialogTitle>
              <DialogDescription>Add a new player to the party.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="player-name">Player Name</Label>
                <Input
                  id="player-name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Enter player name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPlayer}>Add Player</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Players</p>
            <p className="text-2xl font-bold">{stats.totalPlayers}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Active Players</p>
            <p className="text-2xl font-bold">{stats.activePlayers}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Games</p>
            <p className="text-2xl font-bold">{stats.totalGames}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Active Games</p>
            <p className="text-2xl font-bold">{stats.activeGames}</p>
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Winnings</p>
            <p className="text-sm font-medium text-green-500">{stats.totalWinnings}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Losses</p>
            <p className="text-sm font-medium text-red-500">{stats.totalLosses}</p>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <p className="text-sm font-medium">Net Total</p>
            <p className={`text-sm font-bold ${stats.netTotal >= 0 ? "text-green-500" : "text-red-500"}`}>
              {stats.netTotal}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

