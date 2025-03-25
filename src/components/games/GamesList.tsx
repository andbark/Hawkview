import { Game, Player } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface GamesListProps {
  games: Game[];
  players: Record<string, Player>;
  onGameSelect: (gameId: string) => void;
}

export default function GamesList({ games, players, onGameSelect }: GamesListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {games.map((game) => (
        <div
          key={game.id}
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onGameSelect(game.id)}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium">{game.name}</h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(game.startTime, { addSuffix: true })}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs ${
              game.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {game.status}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Pot</span>
              <span className="font-medium">${game.totalPot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Players</span>
              <span className="font-medium">
                {Object.keys(game.players).length}
              </span>
            </div>
            {game.winner && (
              <div className="flex justify-between">
                <span className="text-gray-600">Winner</span>
                <span className="font-medium text-green-600">
                  {players[game.winner]?.name}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 