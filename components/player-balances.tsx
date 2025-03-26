"use client"

import { useState, useEffect } from "react"
import { DollarSign, Plus, User, Wallet } from 'lucide-react'
import { supabase } from "@/lib/supabase"

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
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

export function PlayerBalances() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPlayerName, setNewPlayerName] = useState("")
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPlayers()
    
    const channel = supabase
      .channel('players-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'players' },
        (payload) => {
          console.log('Change received!', payload)
          fetchPlayers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchPlayers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name')

      if (error) {
        throw error
      }

      setPlayers(data || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch players",
        variant: "destructive"
      })
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPlayer = async () => {
    if (newPlayerName.trim()) {
      try {
        const { data, error } = await supabase
          .from('players')
          .insert([
            { 
              name: newPlayerName.trim(),
              balance: 300,
              games_played: 0,
              games_won: 0
            }
          ])
          .select()

        if (error) throw error

        setNewPlayerName("")
        setOpen(false)
        
        toast({
          title: "Player Added",
          description: `${newPlayerName} has been added with $300 starting balance.`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add player",
          variant: "destructive"
        })
        console.error('Error:', error)
      }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading player balances...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Player Balances
          </CardTitle>
          <CardDescription>Everyone starts with $300</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8">
              <Plus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Player</DialogTitle>
              <DialogDescription>Add a new player with $300 starting balance.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Player Name</Label>
                <Input
                  id="name"
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {players.map((player) => (
            <Card key={player.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center text-base gap-2">
                  <User className="h-4 w-4" />
                  {player.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Balance</span>
                  </div>
                  <span className="text-xl font-bold">${player.balance}</span>
                </div>
                <Progress
                  value={(player.balance / 300) * 100}
                  className={`h-2 mb-2 ${
                    player.balance > 300 
                      ? "[&>div]:bg-green-500" 
                      : player.balance < 100 
                        ? "[&>div]:bg-red-500" 
                        : ""
                  }`}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-3">
                  <div>Games Played: {player.games_played}</div>
                  <div>Games Won: {player.games_won}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
