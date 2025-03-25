import { useState } from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { Game, Player } from '@/types';
import { gameService } from '@/utils/gameService';
import { toast } from 'react-hot-toast';

interface ActiveGameProps {
  gameId: string;
  onClose: () => void;
}

export default function ActiveGame({ gameId, onClose }: ActiveGameProps) {
  const { data: game, loading: gameLoading } = useRealtimeData<Game>('games', gameId);
  const { data: players, loading: playersLoading } = useRealtimeData<Player[]>('players');
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerBet, setNewPlayerBet] = useState('');
  const [selectedNewPlayer, setSelectedNewPlayer] = useState('');

  if (gameLoading || playersLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!game || !players) return null;

  const playersMap = players.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {} as Record<string, Player>);
  
  const availablePlayers = players.filter(
    player => !game.players[player.id]
  );

  const handleEndGame = async () => {
    if (!selectedWinner) {
      toast.error('Please select a winner');
      return;
    }

    setIsSubmitting(true);
    try {
      await gameService.endGame(gameId, selectedWinner);
      toast.success('Game ended successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to end game');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!selectedNewPlayer || !newPlayerBet) {
      toast.error('Please select a player and enter a bet amount');
      return;
    }

    const bet = parseFloat(newPlayerBet);
    if (isNaN(bet) || bet <= 0) {
      toast.error('Please enter a valid bet amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await gameService.addPlayerToGame(gameId, selectedNewPlayer, bet);
      toast.success('Player added successfully');
      setShowAddPlayer(false);
      setSelectedNewPlayer('');
      setNewPlayerBet('');
    } catch (error) {
      toast.error('Failed to add player');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{game.name}</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-2"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Game Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium">{game.type}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-600">Total Pot:</span>
              <span className="ml-2 font-medium">${game.totalPot}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Players</h3>
            {game.status === 'active' && availablePlayers.length > 0 && (
              <button
                onClick={() => setShowAddPlayer(!showAddPlayer)}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                + Add Player
              </button>
            )}
          </div>

          {showAddPlayer && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <div className="space-y-3">
                <select
                  value={selectedNewPlayer}
                  onChange={(e) => setSelectedNewPlayer(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Player</option>
                  {availablePlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={newPlayerBet}
                  onChange={(e) => setNewPlayerBet(e.target.value)}
                  placeholder="Enter bet amount"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddPlayer}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md disabled:opacity-50"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Player'}
                  </button>
                  <button
                    onClick={() => setShowAddPlayer(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(game.players).map(([playerId, playerData]) => (
              <div key={playerId} className="p-3 border rounded-lg hover:shadow-sm transition-shadow">
                <div className="font-medium">{playersMap[playerId]?.name}</div>
                <div className="text-gray-600">
                  Bet: ${playerData.initialBet}
                </div>
              </div>
            ))}
          </div>
        </div>

        {game.status === 'active' && (
          <div>
            <h3 className="text-lg font-medium mb-2">End Game</h3>
            <div className="space-y-4">
              <select
                value={selectedWinner}
                onChange={(e) => setSelectedWinner(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Winner</option>
                {Object.entries(game.players).map(([playerId, _]) => (
                  <option key={playerId} value={playerId}>
                    {playersMap[playerId]?.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleEndGame}
                disabled={isSubmitting || !selectedWinner}
                className="w-full px-4 py-2 text-white bg-green-500 hover:bg-green-600 rounded-md disabled:opacity-50"
              >
                {isSubmitting ? 'Ending Game...' : 'End Game'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 