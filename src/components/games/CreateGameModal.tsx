import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Player } from '@/types';
import { gameService } from '@/utils/gameService';
import { toast } from 'react-hot-toast';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Record<string, Player>;
}

export default function CreateGameModal({ 
  isOpen, 
  onClose, 
  players 
}: CreateGameModalProps) {
  const [name, setName] = useState('');
  const [gameType, setGameType] = useState<GameType>('poker');
  const [selectedPlayers, setSelectedPlayers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const gameData = {
        name,
        type: gameType,
        players: Object.entries(selectedPlayers).reduce((acc, [playerId, bet]) => {
          if (bet > 0) {
            acc[playerId] = { initialBet: bet };
          }
          return acc;
        }, {} as Record<string, { initialBet: number }>),
        createdBy: 'current-user-id', // Replace with actual user ID
      };

      await gameService.createGame(gameData);
      toast.success('Game created successfully');
      onClose();
      resetForm();
    } catch (error) {
      toast.error('Failed to create game');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setGameType('poker');
    setSelectedPlayers({});
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full">
          <Dialog.Title className="text-lg font-medium mb-4">
            Create New Game
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Game Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Game Type
              </label>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value as GameType)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="poker">Poker</option>
                <option value="blackjack">Blackjack</option>
                <option value="roulette">Roulette</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Players and Bets
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.values(players).map((player) => (
                  <div key={player.id} className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      value={selectedPlayers[player.id] || ''}
                      onChange={(e) => setSelectedPlayers(prev => ({
                        ...prev,
                        [player.id]: Number(e.target.value)
                      }))}
                      placeholder="Bet amount"
                      className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span>{player.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 