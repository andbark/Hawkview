"use client"

import { useState } from "react"
import { ArrowRight, Banknote } from "lucide-react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// Player data with the 16 specific guests
const players = [
  { id: 1, name: "Freebs", balance: 300 },
  { id: 2, name: "Mike Ambrogi", balance: 300 },
  { id: 3, name: "Mike Stevens", balance: 300 },
  { id: 4, name: "Matt M", balance: 300 },
  { id: 5, name: "Chris Ambrogi", balance: 300 },
  { id: 6, name: "Adam Barks", balance: 300 },
  { id: 7, name: "Donnie", balance: 300 },
  { id: 8, name: "Steve Irons", balance: 300 },
  { id: 9, name: "Sam Golub", balance: 300 },
  { id: 10, name: "Skibicki", balance: 300 },
  { id: 11, name: "MDavis", balance: 300 },
  { id: 12, name: "Avas", balance: 300 },
  { id: 13, name: "Luke", balance: 300 },
  { id: 14, name: "Chris Barks", balance: 300 },
  { id: 15, name: "Geno", balance: 300 },
  { id: 16, name: "Dorey", balance: 300 },
]

// Initial transfer history (empty for now)
const initialTransfers = []

export function MoneyTransfer() {
  const [transfers, setTransfers] = useState(initialTransfers)
  const [open, setOpen] = useState(false)
  const [fromPlayer, setFromPlayer] = useState("")
  const [toPlayer, setToPlayer] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const { toast } = useToast()

  const handleTransfer = () => {
    if (fromPlayer && toPlayer && amount && reason) {
      // Validate amount
      const transferAmount = Number(amount)
      if (isNaN(transferAmount) || transferAmount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid positive amount.",
          variant: "destructive",
        })
        return
      }

      // Validate different players
      if (fromPlayer === toPlayer) {
        toast({
          title: "Invalid Transfer",
          description: "Cannot transfer money to the same player.",
          variant: "destructive",
        })
        return
      }

      // Create new transfer
      const newTransfer = {
        id: transfers.length + 1,
        from: players.find((p) => p.id.toString() === fromPlayer)?.name || "",
        to: players.find((p) => p.id.toString() === toPlayer)?.name || "",
        amount: transferAmount,
        reason,
        timestamp: new Date().getTime(),
      }

      setTransfers([newTransfer, ...transfers])

      // Reset form
      setFromPlayer("")
      setToPlayer("")
      setAmount("")
      setReason("")
      setOpen(false)

      // Dispatch event to update player balances
      const transferEvent = new CustomEvent("money-transfer", {
        detail: {
          from: newTransfer.from,
          to: newTransfer.to,
          amount: transferAmount,
        },
      })
      window.dispatchEvent(transferEvent)

      // Also dispatch event to update game history
      const historyEvent = new CustomEvent("side-bet", {
        detail: {
          from: newTransfer.from,
          to: newTransfer.to,
          amount: transferAmount,
          reason: newTransfer.reason,
          timestamp: newTransfer.timestamp,
        },
      })
      window.dispatchEvent(historyEvent)

      toast({
        title: "Money Transferred",
        description: `$${transferAmount} transferred from ${newTransfer.from} to ${newTransfer.to}.`,
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Side Bets
          </CardTitle>
          <CardDescription>Track 1v1 bets and challenges</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8">
              Record Side Bet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Side Bet</DialogTitle>
              <DialogDescription>Track money transfers for side bets and challenges</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="from-player">Loser (Pays)</Label>
                  <Select onValueChange={setFromPlayer} value={fromPlayer}>
                    <SelectTrigger id="from-player">
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={`from-${player.id}`} value={player.id.toString()}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="to-player">Winner (Receives)</Label>
                  <Select onValueChange={setToPlayer} value={toPlayer}>
                    <SelectTrigger id="to-player">
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={`to-${player.id}`} value={player.id.toString()}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">What was the bet?</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Beer pong, dart game"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleTransfer}>Record Bet Result</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transfers.length > 0 ? (
            transfers.slice(0, 5).map((transfer) => (
              <div key={transfer.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <span className="font-medium text-red-500">{transfer.from}</span>
                      <ArrowRight className="h-4 w-4 mx-1" />
                      <span className="font-medium text-green-500">{transfer.to}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{transfer.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold">${transfer.amount}</span>
                  <div className="text-xs text-muted-foreground">{formatTimeAgo(transfer.timestamp)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">No side bets recorded yet</p>
            </div>
          )}

          {transfers.length > 5 && (
            <div className="text-center mt-2">
              <Button variant="link" size="sm">
                View all {transfers.length} side bets
              </Button>
            </div>
          )}
        </div>
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

