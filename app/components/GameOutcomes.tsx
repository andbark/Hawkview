import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

interface Player {
  id: string;
  name: string;
  balance: number;
  colorScheme: string;
}

interface GameOutcomeProps {
  gameType: string;
  players: {
    id: string;
    name: string;
    bet: number;
  }[];
  totalPot: number;
  onWinnerSelected: (winnerId: string, method: string) => void;
  allPlayers: Player[];
  customGameName?: string;
}

export default function GameOutcomes({ 
  gameType, 
  players, 
  totalPot, 
  onWinnerSelected,
  allPlayers,
  customGameName
}: GameOutcomeProps) {
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [showRandomizer, setShowRandomizer] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [randomWinner, setRandomWinner] = useState<string | null>(null);
  const [outcomeSummary, setOutcomeSummary] = useState<string>('');

  // Function to trigger confetti animation
  const triggerWinnerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Handle manual winner selection
  const handleSelectWinner = () => {
    if (!selectedWinner) return;
    onWinnerSelected(selectedWinner, 'manual');
    
    // Get winner name for summary
    const winner = allPlayers.find(p => p.id === selectedWinner);
    if (winner) {
      setOutcomeSummary(`${winner.name} wins $${totalPot.toFixed(2)}!`);
      triggerWinnerConfetti();
    }
  };

  // Handle random winner selection
  const spinRandomWinner = () => {
    if (players.length < 2) return;
    
    setIsSpinning(true);
    setRandomWinner(null);
    
    // Animation interval to create spinning effect
    const spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * players.length);
      setRandomWinner(players[randomIndex].id);
    }, 100);
    
    // Stop spinning after random time (2-4 seconds)
    const spinTime = 2000 + Math.random() * 2000;
    setTimeout(() => {
      clearInterval(spinInterval);
      setIsSpinning(false);
      
      // Final winner selection
      const finalIndex = Math.floor(Math.random() * players.length);
      const finalWinnerId = players[finalIndex].id;
      setRandomWinner(finalWinnerId);
      
      // Get winner name for summary
      const winner = allPlayers.find(p => p.id === finalWinnerId);
      if (winner) {
        setOutcomeSummary(`${winner.name} wins $${totalPot.toFixed(2)}!`);
        triggerWinnerConfetti();
      }
      
      // Call the callback with the winner
      setTimeout(() => {
        onWinnerSelected(finalWinnerId, 'random');
      }, 2000); // Wait 2s before finalizing to see the animation
    }, spinTime);
  };

  // Get display name for the game
  const getGameTypeName = () => {
    if (customGameName) {
      return customGameName;
    }
    return 'Custom Game';
  };

  return (
    <div className="mt-6 bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">Game Outcome</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Manual winner selection */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-3">Choose Winner</h4>
          <div className="space-y-2">
            <select
              value={selectedWinner}
              onChange={(e) => setSelectedWinner(e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md"
            >
              <option value="">Select a winner</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name} (Bet: ${player.bet.toFixed(2)})
                </option>
              ))}
            </select>
            <button
              onClick={handleSelectWinner}
              disabled={!selectedWinner}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              Declare Winner
            </button>
          </div>
        </div>
        
        {/* Random winner selection button */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-3">Random Outcome</h4>
          <p className="text-gray-300 text-sm mb-3">
            Leave it to chance! Randomly select a winner for {getGameTypeName()}.
          </p>
          
          <button
            onClick={() => setShowRandomizer(true)}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Random Winner
          </button>
        </div>
      </div>
      
      {/* Random winner selector */}
      {showRandomizer && (
        <div className="bg-gray-700 p-6 rounded-lg mb-6 text-center">
          <h4 className="text-white font-bold mb-4">Random Winner Selector</h4>
          
          {/* Spinning animation */}
          <div className="bg-gray-800 py-8 rounded-lg mb-4 relative overflow-hidden">
            <div className="h-16 flex items-center justify-center">
              {randomWinner ? (
                <div className="text-2xl font-bold text-white animate-pulse">
                  {allPlayers.find(p => p.id === randomWinner)?.name || 'Winner'}
                </div>
              ) : (
                <div className="text-gray-400">Click spin to select a winner</div>
              )}
            </div>
            
            {/* Highlight effects */}
            {randomWinner && !isSpinning && (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20" />
            )}
          </div>
          
          <div className="flex space-x-4 justify-center">
            <button
              onClick={spinRandomWinner}
              disabled={isSpinning}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isSpinning ? 'Spinning...' : 'Spin'}
            </button>
            <button
              onClick={() => setShowRandomizer(false)}
              disabled={isSpinning}
              className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Outcome summary */}
      {outcomeSummary && (
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-6 rounded-lg text-center animate-fade-in">
          <h3 className="text-2xl font-bold text-white mb-2">Winner!</h3>
          <div className="text-xl text-white">{outcomeSummary}</div>
        </div>
      )}
    </div>
  );
} 