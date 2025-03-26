'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AppNavigation from '../../components/AppNavigation';
import LoadingSpinner from '../../components/LoadingSpinner';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  TrophyIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Player {
  id: string;
  name: string;
  balance: number;
}

interface InitialPlayer {
  playerId: string;
  buyIn: number;
}

interface GameFormData {
  name: string;
  initialPlayers: InitialPlayer[];
}

// The main form component that uses useSearchParams
function NewGameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlayerId = searchParams.get('playerId');
  
  const [formData, setFormData] = useState<GameFormData>({
    name: '',
    initialPlayers: []
  });
  
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [buyInAmount, setBuyInAmount] = useState<string>('25');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);

  // Load players data
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setIsLoading(true);
        
        // Check if supabase client is initialized
        if (!supabase) {
          console.error('Supabase client is not initialized');
          setError('Database connection issue. Please refresh the page and try again.');
          return;
        }
        
        const { data: players, error: playersError } = await supabase
          .from('players')
          .select('id, name, balance')
          .order('name');
          
        if (playersError) throw playersError;
        
        setAvailablePlayers(players || []);
        
        // Set first player as selected if available, or use the playerId from URL
        if (players && players.length > 0) {
          if (initialPlayerId) {
            setSelectedPlayerId(initialPlayerId);
            
            // If initialPlayerId is provided, add this player to initialPlayers
            const initialPlayer = players.find(p => p.id === initialPlayerId);
            if (initialPlayer) {
              setFormData(prev => ({
                ...prev,
                initialPlayers: [{
                  playerId: initialPlayerId,
                  buyIn: 25
                }]
              }));
            }
          } else {
            setSelectedPlayerId(players[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading players:', error);
        setError('Failed to load players data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayers();
  }, [initialPlayerId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPlayer = () => {
    // Validate
    if (!selectedPlayerId) {
      setError('Please select a player');
      return;
    }
    
    const buyInValue = parseFloat(buyInAmount);
    if (isNaN(buyInValue) || buyInValue <= 0) {
      setError('Please enter a valid buy-in amount');
      return;
    }
    
    // Find the player to check their balance
    const selectedPlayer = availablePlayers.find(p => p.id === selectedPlayerId);
    if (!selectedPlayer) {
      setError('Selected player not found');
      return;
    }
    
    // Check if player has sufficient balance
    if (selectedPlayer.balance < buyInValue) {
      setError(`${selectedPlayer.name} does not have sufficient funds for this buy-in amount`);
      return;
    }
    
    // Check if player is already added
    if (formData.initialPlayers.some(p => p.playerId === selectedPlayerId)) {
      setError('This player is already added to the game');
      return;
    }
    
    // Add player to the list
    setFormData(prev => ({
      ...prev,
      initialPlayers: [
        ...prev.initialPlayers,
        {
          playerId: selectedPlayerId,
          buyIn: buyInValue
        }
      ]
    }));
    
    // Reset selection fields
    setSelectedPlayerId(availablePlayers[0]?.id || '');
    setBuyInAmount('25');
    setError(null);
  };

  const handleRemovePlayer = (playerId: string) => {
    setFormData(prev => ({
      ...prev,
      initialPlayers: prev.initialPlayers.filter(p => p.playerId !== playerId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setIsSubmitting(true);
      
      // Log environment information to help with debugging
      console.log('Environment:', process.env.NODE_ENV);
      
      // Basic validation
      if (!formData.name.trim()) {
        setError('Please enter a game name');
        return;
      }
      
      if (formData.initialPlayers.length === 0) {
        setError('Please add at least one player to the game');
        return;
      }

      console.log('Creating new game with name:', formData.name);
      console.log('Initial players:', formData.initialPlayers);
      
      // Prepare the request data
      const requestData = {
        name: formData.name,
        type: 'other',
        initialPlayers: formData.initialPlayers,
      };
      
      console.log('Calling API with data:', requestData);
      
      // Try our new direct endpoint first
      try {
        const response = await fetch('/api/create-game-direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
        
        if (!response.ok) {
          let errorMessage = `API error: ${response.status} ${response.statusText}`;
          let errorDetails;
          
          try {
            const errorData = await response.json();
            console.error('API error response:', errorData);
            errorDetails = errorData?.details;
            
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            console.error('Failed to parse error response:', e);
          }
          
          // Try our original endpoint as a fallback if direct fails
          console.log('Direct game creation failed, trying original endpoint as fallback...');
          
          const fallbackResponse = await fetch('/api/create-game', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          });
          
          if (!fallbackResponse.ok) {
            throw new Error(`${errorMessage}${errorDetails ? ` (Details: ${JSON.stringify(errorDetails)})` : ''}`);
          }
          
          const result = await fallbackResponse.json();
          console.log('Game creation fallback API response:', result);
          
          if (!result.success || !result.gameId) {
            throw new Error('Failed to create game: Fallback API returned unsuccessful response');
          }
          
          // Store the game ID
          const gameId = result.gameId;
          setCreatedGameId(gameId);
          
          // Check if all players were added successfully
          const failedPlayers = result.playerResults?.filter((p: any) => !p.success) || [];
          if (failedPlayers.length > 0) {
            console.warn('Some players were not added to the game (via fallback):', failedPlayers);
            setError(`Game created but failed to add ${failedPlayers.length} players. The game may be incomplete.`);
            // We'll still consider this a success but with a warning
          }
          
          // Success with fallback!
          setSuccess(true);
          
          // After 1.5 seconds, redirect to the game page
          setTimeout(() => {
            router.push(`/games/${gameId}`);
          }, 1500);
          
          return; // Exit early if fallback succeeded
        }
        
        const result = await response.json();
        console.log('Game creation direct API response:', result);
        
        if (!result.success || !result.gameId) {
          throw new Error('Failed to create game: API returned unsuccessful response');
        }
        
        // Store the game ID
        const gameId = result.gameId;
        setCreatedGameId(gameId);
        
        // Check if all players were added successfully
        const failedPlayers = result.playerResults.filter((p: any) => !p.success);
        if (failedPlayers.length > 0) {
          console.warn('Some players were not added to the game:', failedPlayers);
          setError(`Game created but failed to add ${failedPlayers.length} players. The game may be incomplete.`);
          // We'll still consider this a success but with a warning
        }
        
        // Success!
        setSuccess(true);
        
        // After 1.5 seconds, redirect to the game page
        setTimeout(() => {
          router.push(`/games/${gameId}`);
        }, 1500);
      } catch (error) {
        console.error('Error creating game via API:', error);
        setError(`Failed to create game: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error in overall game creation process:', error);
      setError('Failed to create game. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getPlayerById = (playerId: string) => {
    return availablePlayers.find(p => p.id === playerId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 p-6 rounded-lg text-center">
        <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-green-800 mb-2">Game Created Successfully!</h2>
        <p className="text-green-700 mb-4">
          Your game "{formData.name}" has been created.
        </p>
        <p className="text-sm text-green-600">
          Redirecting to game page...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <div className="flex-shrink-0 h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <TrophyIcon className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-gray-900">Create New Game</h1>
            <p className="text-sm text-gray-500">
              Set up a new game and add initial players
            </p>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Game Details Section */}
          <div className="mb-10">
            <label htmlFor="name" className="block text-xl font-medium text-gray-800 mb-3">
              Game Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="focus:ring-navy focus:border-navy block w-full text-lg py-3 px-4 border-2 border-gray-300 bg-white rounded-md shadow-sm"
              placeholder="Enter game name here..."
              required
              disabled={isSubmitting}
            />
          </div>
          
          {/* Players Section */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add Players</h2>
            
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-grow">
                <label htmlFor="player" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Player
                </label>
                <select
                  id="player"
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="focus:ring-navy focus:border-navy block w-full sm:text-sm py-2 px-3 border-2 border-gray-300 bg-white rounded-md shadow-sm"
                  disabled={isSubmitting}
                >
                  {availablePlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} (Balance: {formatCurrency(player.balance)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:w-1/4">
                <label htmlFor="buyInAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Buy-in Amount ($)
                </label>
                <input
                  type="number"
                  id="buyInAmount"
                  value={buyInAmount}
                  onChange={(e) => setBuyInAmount(e.target.value)}
                  className="focus:ring-navy focus:border-navy block w-full sm:text-sm py-2 px-3 border-2 border-gray-300 bg-white rounded-md shadow-sm"
                  placeholder="25.00"
                  min="1"
                  step="0.01"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="md:flex-shrink-0 md:self-end">
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  className="w-full md:w-auto flex justify-center items-center bg-navy text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={isSubmitting || availablePlayers.length === 0}
                >
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Add
                </button>
              </div>
            </div>
            
            {/* Player List */}
            <div className="bg-gray-50 rounded-md border border-gray-200">
              {formData.initialPlayers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No players added yet. Add players to start the game.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {formData.initialPlayers.map((player) => {
                    const playerDetails = getPlayerById(player.playerId);
                    return (
                      <li key={player.playerId} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{playerDetails?.name || 'Unknown Player'}</p>
                          <p className="text-sm text-gray-500">Buy-in: {formatCurrency(player.buyIn)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(player.playerId)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isSubmitting}
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            
            {formData.initialPlayers.length > 0 && (
              <div className="mt-3 text-right text-sm font-medium text-gray-700">
                Total Pot: {formatCurrency(formData.initialPlayers.reduce((sum, p) => sum + p.buyIn, 0))}
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center items-center bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-medium"
              disabled={isSubmitting || formData.initialPlayers.length === 0}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Creating Game...</span>
                </>
              ) : (
                <>
                  <TrophyIcon className="h-6 w-6 mr-2" />
                  Create Game
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main page component with suspense boundary for useSearchParams
export default function NewGamePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link 
            href="/games" 
            className="inline-flex items-center text-navy hover:text-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Games
          </Link>
        </div>
        
        <Suspense fallback={
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        }>
          <NewGameForm />
        </Suspense>
      </div>
    </main>
  );
} 