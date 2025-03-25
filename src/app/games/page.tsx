'use client';

import { useState } from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { Game, Player } from '@/types';
import GamesList from '@/components/games/GamesList';
import CreateGameModal from '@/components/games/CreateGameModal';
import ActiveGame from '@/components/games/ActiveGame';

export default function GamesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const { data: games, loading: gamesLoading } = useRealtimeData<Game[]>('games');
  const { data: players, loading: playersLoading } = useRealtimeData<Player[]>('players');

  if (gamesLoading || playersLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!games || !players) return null;

  const activeGames = games.filter(game => game.status === 'active');
  const completedGames = games.filter(game => game.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Games</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Create Game
        </button>
      </div>

      {selectedGameId ? (
        <ActiveGame 
          gameId={selectedGameId} 
          onClose={() => setSelectedGameId(null)} 
        />
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-medium mb-4">Active Games</h2>
            {activeGames.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                No active games. Create a new game to get started!
              </div>
            ) : (
              <GamesList 
                games={activeGames}
                players={players}
                onGameSelect={setSelectedGameId}
              />
            )}
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">Completed Games</h2>
            {completedGames.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                No completed games yet.
              </div>
            ) : (
              <GamesList 
                games={completedGames}
                players={players}
                onGameSelect={setSelectedGameId}
              />
            )}
          </section>
        </div>
      )}

      <CreateGameModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        players={players}
      />
    </div>
  );
} 