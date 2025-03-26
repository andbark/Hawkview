"use client"

import { useState } from "react"
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data for money transactions
const initialTransactions = [
  { id: 1, player: "Mike", game: "Poker", amount: 120, type: "win", timestamp: new Date().getTime() - 1800000 },
  { id: 2, player: "John", game: "Blackjack", amount: 75, type: "win", timestamp: new Date().getTime() - 3600000 },
  { id: 3, player: "Dave", game: "Roulette", amount: 50, type: "loss", timestamp: new Date().getTime() - 5400000 },
  { id: 4, player: "Chris", game: "Poker", amount: 200, type: "win", timestamp: new Date().getTime() - 7200000 },
  { id: 5, player: "Alex", game: "Blackjack", amount: 100, type: "loss", timestamp: new Date().getTime() - 9000000 },
  { id: 6, player: "Steve", game: "Craps", amount: 150, type: "loss", timestamp: new Date().getTime() - 10800000 },
  { id: 7, player: "Tom", game: "Slots", amount: 80, type: "win", timestamp: new Date().getTime() - 12600000 },
]

// Mock data for player balances
const initialBalances = [
  { player: "Mike", balance: 120 },
  { player: "John", balance: 75 },
  { player: "Dave", balance: -50 },
  { player: "Chris", balance: 200 },
  { player: "Alex", balance: -100 },
  { player: "Steve", balance: -150 },
  { player: "Tom", balance: 80 },
]

export function MoneyTracker() {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [balances, setBalances] = useState(initialBalances)
  const [open, setOpen] = useState(false)
  const [newTransaction, setNewTransaction] = useState({
    player: "",
    game: "",
    amount: "",
    type: "win",
  })

  const totalWinnings = balances.reduce((sum, player) => (player.balance > 0 ? sum + player.balance : sum), 0)

  const totalLosses = balances.reduce((sum, player) => (player.balance < 0 ? sum + Math.abs(player.balance) : sum), 0)

  const handleAddTransaction = () => {
    if (newTransaction.player && newTransaction.game && newTransaction.amount) {
      const amount = Number.parseInt(newTransaction.amount)
      if (isNaN(amount) || amount <= 0) return

      // Add new transaction
      const transaction = {
        id: transactions.length + 1,
        player: newTransaction.player,
        game: newTransaction.game,
        amount: amount,
        type: newTransaction.type,
        timestamp: new Date().getTime(),
      }

      setTransactions([transaction, ...transactions])

      // Update player balance
      const multiplier = newTransaction.type === "win" ? 1 : -1
      setBalances((prev) => {
        const playerIndex = prev.findIndex((p) => p.player === newTransaction.player)
        if (playerIndex >= 0) {
          const updated = [...prev]
          updated[playerIndex] = {
            ...updated[playerIndex],
            balance: updated[playerIndex].balance + amount * multiplier,
          }
          return updated.sort((a, b) => b.balance - a.balance)
        } else {
          return [...prev, { player: newTransaction.player, balance: amount * multiplier }].sort(
            (a, b) => b.balance - a.balance,
          )
        }
      })

      // Reset form
      setNewTransaction({
        player: "",
        game: "",
        amount: "",
        type: "win",
      })
      setOpen(false)
    }
  }

  // List of players and games for the form
  const players = ["Mike", "John", "Dave", "Chris", "Alex", "Steve", "Tom"]
  const games = ["Poker", "Blackjack", "Roulette", "Craps", "Slots"]

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Money Tracker
          </CardTitle>
          <CardDescription>Track winnings and losses for all players</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8">
              <DollarSign className="mr-2 h-4 w-4" />
              Record Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Money Transaction</DialogTitle>
              <DialogDescription>Add a new win or loss for a player.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="player">Player</Label>
                <Select
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, player: value })}
                  value={newTransaction.player}
                >
                  <SelectTrigger id="player">
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player) => (
                      <SelectItem key={player} value={player}>
                        {player}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="game">Game</Label>
                <Select
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, game: value })}
                  value={newTransaction.game}
                >
                  <SelectTrigger id="game">
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((game) => (
                      <SelectItem key={game} value={game}>
                        {game}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value })}
                  value={newTransaction.type}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTransaction}>Record Transaction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="balances">
          <TabsList className="mb-4">
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="balances" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                    Total Winnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">${totalWinnings}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <TrendingDown className="h-4 w-4 mr-2 text-red-500" />
                    Total Losses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">${totalLosses}</div>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-md border">
              <div className="grid grid-cols-12 border-b px-4 py-3 font-medium">
                <div className="col-span-5">Player</div>
                <div className="col-span-7 text-right">Balance</div>
              </div>
              {balances.map((player) => (
                <div key={player.player} className="grid grid-cols-12 px-4 py-3 border-b last:border-0">
                  <div className="col-span-5 font-medium">{player.player}</div>
                  <div
                    className={`col-span-7 text-right font-medium ${
                      player.balance > 0 ? "text-green-500" : player.balance < 0 ? "text-red-500" : ""
                    }`}
                  >
                    ${player.balance > 0 ? "+" : ""}
                    {player.balance}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-12 border-b px-4 py-3 font-medium">
                <div className="col-span-3">Player</div>
                <div className="col-span-3">Game</div>
                <div className="col-span-3">Amount</div>
                <div className="col-span-3 text-right">Time</div>
              </div>
              {transactions.map((transaction) => (
                <div key={transaction.id} className="grid grid-cols-12 px-4 py-3 border-b last:border-0">
                  <div className="col-span-3 font-medium">{transaction.player}</div>
                  <div className="col-span-3">{transaction.game}</div>
                  <div
                    className={`col-span-3 font-medium ${
                      transaction.type === "win" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {transaction.type === "win" ? "+" : "-"}${transaction.amount}
                  </div>
                  <div className="col-span-3 text-right text-muted-foreground text-sm">
                    {formatTimeAgo(transaction.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Game Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {games.map((game) => {
                    const gameTransactions = transactions.filter((t) => t.game === game)
                    const wins = gameTransactions.filter((t) => t.type === "win").reduce((sum, t) => sum + t.amount, 0)
                    const losses = gameTransactions
                      .filter((t) => t.type === "loss")
                      .reduce((sum, t) => sum + t.amount, 0)

                    return (
                      <div key={game} className="mb-4 last:mb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{game}</span>
                          <span className="text-sm">
                            {wins > losses ? (
                              <span className="text-green-500">+${wins - losses}</span>
                            ) : (
                              <span className="text-red-500">-${losses - wins}</span>
                            )}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          {wins + losses > 0 && (
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${(wins / (wins + losses)) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Top Winners & Losers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                        Top Winners
                      </h4>
                      {balances
                        .filter((p) => p.balance > 0)
                        .slice(0, 3)
                        .map((player) => (
                          <div key={player.player} className="flex justify-between items-center mb-1">
                            <span>{player.player}</span>
                            <span className="font-medium text-green-500">+${player.balance}</span>
                          </div>
                        ))}
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                        Top Losers
                      </h4>
                      {balances
                        .filter((p) => p.balance < 0)
                        .slice(-3)
                        .reverse()
                        .map((player) => (
                          <div key={player.player} className="flex justify-between items-center mb-1">
                            <span>{player.player}</span>
                            <span className="font-medium text-red-500">${player.balance}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

