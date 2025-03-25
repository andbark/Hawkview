import { useState } from 'react';
import { toast } from 'react-hot-toast';
import GameTypeCard, { gameTypes } from './GameTypeCard';
import CustomGameForm from './CustomGameForm';
import { PencilIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

interface Player {
  id: string;
  name: string;
  balance: number;
  colorScheme: string;
}

interface GamePlayer {
  id: string;
  name: string;
  bet: number;
}

interface CustomGameData {
  name: string;
  wagerAmount: number;
}

interface EnhancedGameCreationProps {
  players: Player[];
  onCreateGame: (gameData: {
    name: string;
    type: string;
    players: GamePlayer[];
    totalPot: number;
    customData?: CustomGameData;
  }) => void;
  onCancel: () => void;
}

export default function EnhancedGameCreation({
  players,
  onCreateGame,
  onCancel
}: EnhancedGameCreationProps) {
  // State for game creation form
  const [step, setStep] = useState<1 | 2>(1);
  const [gameName, setGameName] = useState('');
  const [selectedGameType, setSelectedGameType] = useState('custom');
  const [selectedPlayers, setSelectedPlayers] = useState<GamePlayer[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customGameData, setCustomGameData] = useState<CustomGameData | null>(null);
  
  // Continue to next step
  const continueToNext = () => {
    if (step === 1) {
      if (!customGameData) {
        setShowCustomForm(true);
        return;
      }
      
      setStep(2);
    }
  };
  
  // Go back to previous step
  const goBack = () => {
    if (step === 2) setStep(1);
  };
  
  // Handle custom game form submission
  const handleCustomGameSave = (data: CustomGameData) => {
    setCustomGameData(data);
    setGameName(data.name);
    setShowCustomForm(false);
    // Proceed to the next step after creating custom game
    setStep(2);
  };
  
  // Handle custom game edit
  const handleEditCustomGame = () => {
    setShowCustomForm(true);
  };
  
  // Add player to game
  const addPlayerToGame = () => {
    if (!currentPlayerId) {
      toast.error('Please select a player');
      return;
    }
    
    if (!customGameData || !customGameData.wagerAmount) {
      toast.error('Game wager amount is not set');
      return;
    }
    
    const bet = customGameData.wagerAmount;
    
    const player = players.find(p => p.id === currentPlayerId);
    if (!player) {
      toast.error('Player not found');
      return;
    }
    
    if (bet > player.balance) {
      toast.error(`${player.name} doesn't have enough balance for this bet`);
      return;
    }
    
    const alreadyAdded = selectedPlayers.some(p => p.id === currentPlayerId);
    if (alreadyAdded) {
      toast.error(`${player.name} is already in the game`);
      return;
    }
    
    const newGamePlayer: GamePlayer = {
      id: currentPlayerId,
      name: player.name,
      bet
    };
    
    setSelectedPlayers([...selectedPlayers, newGamePlayer]);
    setCurrentPlayerId('');
  };
  
  // Remove player from game
  const removePlayerFromGame = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter(player => player.id !== playerId));
  };
  
  // Calculate total pot
  const totalPot = selectedPlayers.reduce((sum, p) => sum + p.bet, 0);
  
  // Handle form submission
  const handleSubmit = () => {
    if (selectedPlayers.length < 2) {
      toast.error('A game needs at least 2 players');
      return;
    }
    
    if (!gameName.trim()) {
      toast.error('Please provide a game name');
      return;
    }
    
    if (!customGameData) {
      toast.error('Please define game name');
      return;
    }
    
    try {
      // Create the game data object
      const gameData = {
        name: gameName.trim(),
        type: 'custom',
        players: selectedPlayers,
        totalPot,
        customData: customGameData
      };
      
      console.log('Submitting game data:', gameData);
      
      // Call the onCreateGame callback
      onCreateGame(gameData);
    } catch (error) {
      console.error("Error preparing game data:", error);
      toast.error('Failed to create game');
    }
  };
  
  // Export game data as JSON
  const exportGameData = () => {
    if (selectedPlayers.length < 2) {
      toast.error('A game needs at least 2 players');
      return;
    }
    
    if (!gameName.trim()) {
      toast.error('Please provide a game name');
      return;
    }
    
    if (!customGameData) {
      toast.error('Please define game name');
      return;
    }
    
    try {
      // Create the game data object
      const gameData = {
        name: gameName.trim(),
        type: 'custom',
        players: selectedPlayers,
        totalPot,
        customData: customGameData,
        createdAt: new Date().toISOString(),
      };
      
      // Create a data URL for the JSON
      const jsonString = JSON.stringify(gameData, null, 2);
      const dataUrl = `data:text/json;charset=utf-8,${encodeURIComponent(jsonString)}`;
      
      // Create a download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `game-${gameName.trim().replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Game data exported successfully!');
    } catch (error) {
      console.error("Error exporting game data:", error);
      toast.error('Failed to export game data');
    }
  };
  
  if (showCustomForm) {
    return (
      <CustomGameForm 
        onSave={handleCustomGameSave} 
        onCancel={() => setShowCustomForm(false)}
        initialData={customGameData || undefined}
      />
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-gray-800 border border-gray-200">
      {/* Step indicator */}
      <div className="flex items-center mb-6">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
          step >= 1 ? 'bg-navy text-white' : 'bg-gray-200 text-gray-500'
        }`}>
          1
        </div>
        <div className={`h-1 flex-1 mx-2 ${step >= 2 ? 'bg-navy' : 'bg-gray-200'}`}></div>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
          step >= 2 ? 'bg-navy text-white' : 'bg-gray-200 text-gray-500'
        }`}>
          2
        </div>
      </div>
      
      {/* Step 1: Custom Game Creation */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Create Custom Game</h2>
          <p className="text-gray-600 mb-6">Enter a name and bet amount for your game</p>
          
          {customGameData ? (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold">{customGameData.name}</h3>
                <button
                  onClick={handleEditCustomGame}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
              <div className="mt-2 text-green-400 font-medium">
                Entry wager: ${customGameData.wagerAmount.toFixed(2)} per player
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomForm(true)}
              className="w-full bg-gray-50 p-6 rounded-lg mb-6 flex flex-col items-center justify-center hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <PlusCircleIcon className="h-10 w-10 mb-2 text-navy" />
              <span className="text-lg font-medium text-gray-800">Create New Game</span>
              <p className="text-gray-500 text-sm mt-1">Enter a name and wager amount</p>
            </button>
          )}
        </div>
      )}
      
      {/* Step 2: Player Selection */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Add Players</h2>
          <p className="text-gray-600 mb-6">Select who's playing</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Player
              </label>
              <select
                value={currentPlayerId}
                onChange={(e) => setCurrentPlayerId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-800 rounded-md"
              >
                <option value="">Choose a player</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} (${player.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={addPlayerToGame}
                className="w-full px-4 py-2 bg-navy text-white rounded-md hover:bg-blue-900 transition-colors"
              >
                Add Player
              </button>
            </div>
          </div>
          
          {customGameData && (
            <div className="bg-gray-50 px-4 py-3 rounded-md mb-6 flex items-center justify-between border border-gray-200">
              <div>
                <span className="text-gray-700">Entry wager: </span>
                <span className="text-green-600 font-medium">${customGameData.wagerAmount.toFixed(2)} per player</span>
              </div>
              <button
                onClick={handleEditCustomGame}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
            </div>
          )}
          
          {selectedPlayers.length > 0 ? (
            <div className="bg-white p-4 rounded-lg mb-6 border border-gray-200">
              <h3 className="text-lg font-medium mb-3 text-gray-800">Players in Game</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedPlayers.map(player => (
                  <div key={player.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                    <span className="font-medium text-gray-800">{player.name}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-green-600">${player.bet.toFixed(2)}</span>
                      <button
                        onClick={() => removePlayerFromGame(player.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <span className="font-medium text-gray-800">Total Pot:</span>
                <span className="text-xl font-bold text-green-600">
                  ${totalPot.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg mb-6 text-center text-gray-500 border border-gray-200">
              No players added yet. Add at least two players to continue.
            </div>
          )}
        </div>
      )}
      
      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          onClick={step === 1 ? onCancel : goBack}
          className="px-6 py-2 bg-white text-navy rounded-md hover:bg-gray-50 transition-colors border border-navy"
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        
        <div className="flex space-x-2">
          {step === 2 && selectedPlayers.length >= 2 && (
            <button
              onClick={exportGameData}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Export as JSON file in case saving to database fails"
            >
              Backup Game Data
            </button>
          )}
          
          <button
            onClick={step === 1 ? continueToNext : handleSubmit}
            disabled={step === 1 && !customGameData || step === 2 && selectedPlayers.length < 2}
            className={`px-6 py-2 ${
              (step === 1 && !customGameData) || (step === 2 && selectedPlayers.length < 2)
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-navy hover:bg-blue-900'
            } text-white rounded-md transition-colors`}
          >
            {step === 2 ? 'Create Game' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
} 