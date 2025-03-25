import { format } from 'date-fns';

interface Game {
  id: string;
  name: string;
  description: string;
  date: Date;
  participants: string[];
  winner: string;
  scores: { [participant: string]: number };
}

interface GameListProps {
  games: Game[];
  onGameSelect: (game: Game) => void;
  onGameDelete: (id: string) => void;
}

export default function GameList({ games, onGameSelect, onGameDelete }: GameListProps) {
  if (games.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
        <p className="text-gray-500">No games added yet. Create your first game!</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-medium text-gray-800 mb-4">Games</h2>
      
      <div className="space-y-4">
        {games.map((game) => (
          <div key={game.id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-lg text-gray-800">{game.name}</h3>
                <p className="text-sm text-gray-500">
                  {format(new Date(game.date), 'MMM d, yyyy')}
                </p>
                {game.description && (
                  <p className="text-sm text-gray-600 mt-1">{game.description}</p>
                )}
                
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Participants:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {game.participants.map((participant) => (
                      <span 
                        key={participant} 
                        className={`text-xs px-2 py-1 rounded ${
                          participant === game.winner 
                            ? 'bg-blue-50 text-navy' 
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {participant} 
                        {participant === game.winner && ' (Winner)'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onGameSelect(game)}
                  className="text-navy hover:text-blue-700 transition-colors duration-200 px-3 py-1 text-sm rounded-md hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => onGameDelete(game.id)}
                  className="text-gray-600 hover:text-red-600 transition-colors duration-200 px-3 py-1 text-sm rounded-md hover:bg-gray-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 