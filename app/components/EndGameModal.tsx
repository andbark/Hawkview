import { useState, useEffect } from 'react';
import { TrophyIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

interface Player {
  id: string;
  name: string;
  bet: number;
}

interface EndGameModalProps {
  players: Player[];
  onClose: () => void;
  onEndGame: (winnerId: string, method?: string) => Promise<void>;
  totalPot?: number;
}

export default function EndGameModal({ players, onClose, onEndGame, totalPot = 0 }: EndGameModalProps) {
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Make sure we have valid players
  useEffect(() => {
    console.log('Players in EndGameModal:', players);
    // If there's only one player, auto-select them
    if (players && players.length === 1 && players[0].id) {
      setSelectedWinner(players[0].id);
    }
  }, [players]);

  const handleEndGame = async () => {
    if (!selectedWinner) {
      setError('Please select a winner');
      return;
    }

    try {
      setLoading(true);
      await onEndGame(selectedWinner);
    } catch (error) {
      console.error('Error ending game:', error);
      setError('Failed to end game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 p-4">
      <div className="relative bg-white rounded-lg shadow-lg max-w-lg w-full overflow-hidden">
        <div className="bg-navy p-4">
          <h2 className="text-xl font-bold text-white">End Game</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            Select the player who won this game:
          </p>
          
          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="mb-8">
            <div className="relative">
              <select
                value={selectedWinner}
                onChange={(e) => setSelectedWinner(e.target.value)}
                className="w-full bg-white text-gray-800 rounded-lg p-4 border border-gray-300 focus:border-navy focus:ring-2 focus:ring-blue-200 appearance-none cursor-pointer text-lg shadow-sm"
              >
                <option value="" disabled>Select Winner</option>
                {players && players.length > 0 ? (
                  players.map((player) => (
                    <option key={player.id} value={player.id} className="py-2">
                      {player.name} (Bet: ${player.bet.toFixed(2)})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No players available</option>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {selectedWinner && (
              <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-navy text-white w-10 h-10 rounded-full flex items-center justify-center mr-3">
                    {players.find(p => p.id === selectedWinner)?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-navy">
                      {players.find(p => p.id === selectedWinner)?.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Will win the entire pot
                    </div>
                  </div>
                </div>
                <div className="text-xl font-bold text-green-600">
                  ${totalPot.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-lg transition-colors duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleEndGame}
              className="px-5 py-3 bg-navy text-white rounded-lg hover:bg-blue-800 flex items-center justify-center font-medium text-lg min-w-32 transition-colors duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                <>End Game</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 