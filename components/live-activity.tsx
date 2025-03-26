"use client"

import { useEffect, useState } from "react"
import { Dices, TrendingUp } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for live activity
const mockActivities = [
  { id: 1, player: "Mike", game: "Poker", amount: 50, timestamp: new Date().getTime() - 120000 },
  { id: 2, player: "John", game: "Blackjack", amount: -25, timestamp: new Date().getTime() - 240000 },
  { id: 3, player: "Dave", game: "Roulette", amount: 100, timestamp: new Date().getTime() - 360000 },
  { id: 4, player: "Chris", game: "Poker", amount: -75, timestamp: new Date().getTime() - 480000 },
  { id: 5, player: "Alex", game: "Blackjack", amount: 30, timestamp: new Date().getTime() - 600000 },
]

export function LiveActivity() {
  const [activities, setActivities] = useState(mockActivities)

  // Simulate new activities coming in
  useEffect(() => {
    const interval = setInterval(() => {
      const games = ["Poker", "Blackjack", "Roulette", "Craps", "Slots"]
      const players = ["Mike", "John", "Dave", "Chris", "Alex", "Steve", "Tom"]
      const amounts = [25, 50, 75, 100, -25, -50, -75]

      const newActivity = {
        id: activities.length + 1,
        player: players[Math.floor(Math.random() * players.length)],
        game: games[Math.floor(Math.random() * games.length)],
        amount: amounts[Math.floor(Math.random() * amounts.length)],
        timestamp: new Date().getTime(),
      }

      setActivities((prev) => [newActivity, ...prev.slice(0, 9)])
    }, 5000)

    return () => clearInterval(interval)
  }, [activities])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Live Activity
        </CardTitle>
        <CardDescription>Real-time updates from all games</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Games</TabsTrigger>
            <TabsTrigger value="poker">Poker</TabsTrigger>
            <TabsTrigger value="blackjack">Blackjack</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <div className="space-y-2">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Dices className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{activity.player}</p>
                      <p className="text-sm text-muted-foreground">{activity.game}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${activity.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                      {activity.amount > 0 ? "+" : ""}
                      {activity.amount}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="poker" className="space-y-4">
            <div className="space-y-2">
              {activities
                .filter((a) => a.game === "Poker")
                .map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Dices className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{activity.player}</p>
                        <p className="text-sm text-muted-foreground">{activity.game}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${activity.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                        {activity.amount > 0 ? "+" : ""}
                        {activity.amount}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="blackjack" className="space-y-4">
            <div className="space-y-2">
              {activities
                .filter((a) => a.game === "Blackjack")
                .map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Dices className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{activity.player}</p>
                        <p className="text-sm text-muted-foreground">{activity.game}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${activity.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                        {activity.amount > 0 ? "+" : ""}
                        {activity.amount}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="other" className="space-y-4">
            <div className="space-y-2">
              {activities
                .filter((a) => a.game !== "Poker" && a.game !== "Blackjack")
                .map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Dices className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{activity.player}</p>
                        <p className="text-sm text-muted-foreground">{activity.game}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${activity.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                        {activity.amount > 0 ? "+" : ""}
                        {activity.amount}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor((new Date().getTime() - timestamp) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

