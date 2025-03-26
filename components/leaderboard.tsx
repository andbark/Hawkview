"use client"

import { Crown } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data for leaderboard with the 16 specific guests
const leaderboardData = [
  { id: 1, name: "Freebs", gamesWon: 0, totalWinnings: 0 },
  { id: 2, name: "Mike Ambrogi", gamesWon: 0, totalWinnings: 0 },
  { id: 3, name: "Mike Stevens", gamesWon: 0, totalWinnings: 0 },
  { id: 4, name: "Matt M", gamesWon: 0, totalWinnings: 0 },
  { id: 5, name: "Chris Ambrogi", gamesWon: 0, totalWinnings: 0 },
  { id: 6, name: "Adam Barks", gamesWon: 0, totalWinnings: 0 },
  { id: 7, name: "Donnie", gamesWon: 0, totalWinnings: 0 },
  { id: 8, name: "Steve Irons", gamesWon: 0, totalWinnings: 0 },
  { id: 9, name: "Sam Golub", gamesWon: 0, totalWinnings: 0 },
  { id: 10, name: "Skibicki", gamesWon: 0, totalWinnings: 0 },
  { id: 11, name: "MDavis", gamesWon: 0, totalWinnings: 0 },
  { id: 12, name: "Avas", gamesWon: 0, totalWinnings: 0 },
  { id: 13, name: "Luke", gamesWon: 0, totalWinnings: 0 },
  { id: 14, name: "Chris Barks", gamesWon: 0, totalWinnings: 0 },
  { id: 15, name: "Geno", gamesWon: 0, totalWinnings: 0 },
  { id: 16, name: "Dorey", gamesWon: 0, totalWinnings: 0 },
]

export function Leaderboard() {
  // Sort by total winnings
  const sortedLeaderboard = [...leaderboardData].sort((a, b) => b.totalWinnings - a.totalWinnings)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Leaderboard
        </CardTitle>
        <CardDescription>Top winners by games and money</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedLeaderboard.slice(0, 5).map((player, index) => (
            <div key={player.id} className="flex items-center gap-4">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
                ${
                  index === 0
                    ? "bg-yellow-500 text-primary-foreground"
                    : index === 1
                      ? "bg-gray-300 text-primary-foreground"
                      : index === 2
                        ? "bg-amber-700 text-primary-foreground"
                        : "bg-muted"
                }`}
              >
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium">{player.name}</p>
                <p className="text-xs text-muted-foreground">
                  {player.gamesWon} game{player.gamesWon !== 1 ? "s" : ""} won
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">${player.totalWinnings}</p>
                <p className="text-xs text-muted-foreground">total winnings</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

