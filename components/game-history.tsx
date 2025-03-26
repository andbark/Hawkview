"use client"

import { useEffect, useState } from "react"
import { History, Trophy, Handshake } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Initial empty game history
const initialGameHistory = []

export function GameHistory() {
  const [history, setHistory] = useState(initialGameHistory)

  // Listen for side bet events
  useEffect(() => {
    const handleSideBet = (event: any) => {
      const { from, to, amount, reason, timestamp } = event.detail
      const newSideBet = {
        id: history.length + 1,
        type: "sideBet",
        from,
        to,
        amount,
        reason,
        timestamp,
      }
      setHistory((prev) => [newSideBet, ...prev])
    }

    window.addEventListener("side-bet", handleSideBet)
    return () => window.removeEventListener("side-bet", handleSideBet)
  }, [history])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Activity History
        </CardTitle>
        <CardDescription>Record of all games and side bets</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Activity</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="sideBets">Side Bets</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {history.length > 0 ? (
              history
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((item) =>
                  item.type === "game" ? (
                    <GameHistoryItem key={item.id} game={item} />
                  ) : (
                    <SideBetHistoryItem key={item.id} sideBet={item} />
                  ),
                )
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">No activity recorded yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="games" className="space-y-4">
            {history.filter((item) => item.type === "game").length > 0 ? (
              history
                .filter((item) => item.type === "game")
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((game) => <GameHistoryItem key={game.id} game={game} />)
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">No games recorded yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sideBets" className="space-y-4">
            {history.filter((item) => item.type === "sideBet").length > 0 ? (
              history
                .filter((item) => item.type === "sideBet")
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((sideBet) => <SideBetHistoryItem key={sideBet.id} sideBet={sideBet} />)
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">No side bets recorded yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function GameHistoryItem({ game }: { game: any }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <h3 className="font-medium">{game.game}</h3>
        </div>
        <span className="text-sm text-muted-foreground">{formatTimeAgo(game.timestamp)}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-green-500">
          {game.winner} won ${game.pot}
        </span>
      </div>
      <div className="text-sm text-muted-foreground">Players: {game.players.join(", ")}</div>
    </div>
  )
}

function SideBetHistoryItem({ sideBet }: { sideBet: any }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Handshake className="h-4 w-4 text-blue-500" />
          <h3 className="font-medium">Side Bet</h3>
        </div>
        <span className="text-sm text-muted-foreground">{formatTimeAgo(sideBet.timestamp)}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-red-500">{sideBet.from}</span>
        <span className="text-sm">paid</span>
        <span className="font-medium text-green-500">{sideBet.to}</span>
        <span className="font-medium">${sideBet.amount}</span>
      </div>
      <div className="text-sm text-muted-foreground">{sideBet.reason}</div>
    </div>
  )
}

function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor((new Date().getTime() - timestamp) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

