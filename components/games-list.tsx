"use client"

import { useState } from "react"
import { Dices, Plus, Pencil, Trash2, Trophy, Users } from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

// Initial games data
const initialGames = [
  { id: 1, name: "Poker", buyIn: 50, active: false, players: [], winner: null },
  { id: 2, name: "Blackjack", buyIn: 50, active: false, players: [], winner: null },
  { id: 3, name: "Roulette", buyIn: 50, active: false, players: [], winner: null },
  { id: 4, name: "Craps", buyIn: 50, active: false, players: [], winner: null },
  { id: 5, name: "Slots", buyIn: 50, active: false, players: [], winner: null },
]

// Player data with the 16 specific guests
const availablePlayers = [
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

export function GamesList() {
  const [games, setGames] = useState(initialGames)
  const [newGameName, setNewGameName] = useState("")
  const [openAddGame, setOpenAddGame] = useState(false)
  const [openJoinGame, setOpenJoinGame] = useState(false)
  const [openEndGame, setOpenEndGame] = useState(false)
  const [openEditGame, setOpenEditGame] = useState(false)
  const [selectedGame, setSelectedGame] = useState<any>(null)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [selectedWinner, setSelectedWinner] = useState("")
  const [editingGame, setEditingGame] = useState<any>(null)
  const { toast } = useToast()

  const handleAddGame = () => {
    if (newGameName) {
      const newGame = {
        id: games.length + 1,
        name: newGameName,
        buyIn: 50,
        active: false,
        players: [],
        winner: null,
      }

      setGames([...games, newGame])
      setNewGameName("")
      setOpenAddGame(false)

      toast({
        title: "Game Added",
        description: `${newGameName} has been added to the available games.`,
      })
    }
  }

  const handleEditGame = () => {
    if (editingGame && editingGame.name) {
      setGames(
        games.map((game) =>
          game.id === editingGame.id ? { ...editingGame } : game,
        ),
      )
      setOpenEditGame(false)
      setEditingGame(null)

      toast({
        title: "Game Updated",
        description: editingGame.winner 
          ? `Game winner updated to ${editingGame.winner}`
          : `${editingGame.name} has been updated.`,
      })
    }
  }

  const handleDeleteGame = (gameId: number) => {
    setGames(games.filter((game) => game.id !== gameId))
    toast({
      title: "Game Deleted",
      description: "The game has been removed from the available games.",
    })
  }

  const handleJoinGame = () => {
    if (selectedGame && selectedPlayers.length > 0) {
      const playersToAdd = selectedPlayers
        .map(id => availablePlayers.find(p => p.id.toString() === id))
        .filter(player => player && player.balance >= 50)
        .map(player => player!.name)

      if (playersToAdd.length === selectedPlayers.length) {
        setGames(
          games.map((game) =>
            game.id === selectedGame.id
              ? {
                  ...game,
                  players: [...game.players, ...playersToAdd],
                  active: true,
                }
              : game,
          ),
        )

        setOpenJoinGame(false)
        setSelectedPlayers([])

        toast({
          title: "Players Joined",
          description: `${playersToAdd.length} player(s) have joined ${selectedGame.name} and paid the $50 buy-in.`,
        })
      } else {
        toast({
          title: "Insufficient Balance",
          description: "Some players don't have enough money for the buy-in.",
          variant: "destructive",
        })
      }
    }
  }

  const handleEndGame = () => {
    if (selectedGame && selectedWinner) {
      const winningAmount = selectedGame.players.length * 50

      setGames(
        games.map((game) =>
          game.id === selectedGame.id
            ? {
                ...game,
                active: false,
                winner: selectedWinner,
              }
            : game,
        ),
      )

      setOpenEndGame(false)

      toast({
        title: "Game Ended",
        description: `${selectedWinner} won ${selectedGame.name} and received $${winningAmount}!`,
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Dices className="h-5 w-5" />
            Available Games
          </CardTitle>
          <CardDescription>Each game has a $50 buy-in</CardDescription>
        </div>
        <Dialog open={openAddGame} onOpenChange={setOpenAddGame}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8">
              <Plus className="mr-2 h-4 w-4" />
              Add Game
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Game</DialogTitle>
              <DialogDescription>Add a new game with a $50 buy-in.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="game-name">Game Name</Label>
                <Input
                  id="game-name"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  placeholder="e.g. Poker, Blackjack"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddGame}>Add Game</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {games.map((game) => (
            <div key={game.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div className={`h-2.5 w-2.5 rounded-full ${game.active ? "bg-green-500" : "bg-amber-500"}`} />
                <div>
                  <h3 className="font-medium">{game.name}</h3>
                  {game.players.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {game.players.length} player{game.players.length !== 1 ? "s" : ""} - Pot: $
                        {game.players.length * 50}
                      </span>
                    </div>
                  )}
                  {game.winner && (
                    <div className="flex items-center gap-1 mt-1">
                      <Trophy className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs font-medium">
                        {game.winner} won ${game.players.length * 50}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!game.active && !game.winner && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedGame(game)
                        setOpenJoinGame(true)
                      }}
                    >
                      Join Game
                    </Button>
                    <Dialog open={openEditGame} onOpenChange={setOpenEditGame}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingGame({ ...game })
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Game</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {game.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteGame(game.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                {game.active && game.players.length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedGame(game)
                      setSelectedWinner("")
                      setOpenEndGame(true)
                    }}
                  >
                    End Game
                  </Button>
                )}
                {game.winner && (
                  <Dialog open={openEditGame} onOpenChange={setOpenEditGame}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingGame({ ...game })
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Join Game Dialog */}
        <Dialog open={openJoinGame} onOpenChange={setOpenJoinGame}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Game</DialogTitle>
              <DialogDescription>Add players to {selectedGame?.name}. Each player pays a $50 buy-in.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Select Players</Label>
                <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                  {availablePlayers
                    .filter(player => !selectedGame?.players.includes(player.name))
                    .map(player => (
                      <div key={player.id} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`player-${player.id}`}
                          checked={selectedPlayers.includes(player.id.toString())}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPlayers([...selectedPlayers, player.id.toString()])
                            } else {
                              setSelectedPlayers(selectedPlayers.filter(id => id !== player.id.toString()))
                            }
                          }}
                        />
                        <Label htmlFor={`player-${player.id}`} className="flex-1">
                          {player.name} (${player.balance})
                        </Label>
                      </div>
                    ))}
                </div>
              </div>
              {selectedPlayers.length > 0 && (
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-sm font-medium">Total Buy-in Required</p>
                  <p className="text-2xl font-bold">${selectedPlayers.length * 50}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                onClick={handleJoinGame}
                disabled={selectedPlayers.length === 0}
              >
                Pay Buy-in for {selectedPlayers.length} Player{selectedPlayers.length !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Game Dialog */}
        <Dialog open={openEditGame} onOpenChange={setOpenEditGame}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Game</DialogTitle>
              <DialogDescription>Update game details and manage players.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-game-name">Game Name</Label>
                <Input
                  id="edit-game-name"
                  value={editingGame?.name || ""}
                  onChange={(e) => setEditingGame({ ...editingGame, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Current Players</Label>
                <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto">
                  {editingGame?.players?.length > 0 ? (
                    <div className="space-y-2">
                      {editingGame.players.map((player, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span>{player}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updatedPlayers = [...editingGame.players];
                              updatedPlayers.splice(index, 1);
                              setEditingGame({ ...editingGame, players: updatedPlayers });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">No players in this game yet</p>
                  )}
                </div>
              </div>
              {editingGame?.winner && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-winner">Winner</Label>
                  <Select
                    value={editingGame.winner}
                    onValueChange={(value) => setEditingGame({ ...editingGame, winner: value })}
                  >
                    <SelectTrigger id="edit-winner">
                      <SelectValue placeholder="Select winner" />
                    </SelectTrigger>
                    <SelectContent>
                      {editingGame.players.map((player) => (
                        <SelectItem key={player} value={player}>
                          {player}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleEditGame}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* End Game Dialog */}
        <Dialog open={openEndGame} onOpenChange={setOpenEndGame}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>End Game</DialogTitle>
              <DialogDescription>Select the winner of {selectedGame?.name}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="winner">Select Winner</Label>
                <Select onValueChange={setSelectedWinner} value={selectedWinner}>
                  <SelectTrigger id="winner">
                    <SelectValue placeholder="Select winner" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedGame?.players.map((player) => (
                      <SelectItem key={player} value={player}>
                        {player}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedGame && (
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-sm font-medium">Total Pot</p>
                  <p className="text-2xl font-bold">${selectedGame.players.length * 50}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleEndGame}>End Game & Award Winner</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
