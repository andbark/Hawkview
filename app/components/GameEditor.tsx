import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Game {
  id: string;
  name: string;
  description: string;
  date: Date;
  participants: string[];
  winner: string;
  scores: { [participant: string]: number };
}

interface GameEditorProps {
  game: Game | null;
  onUpdate: (updatedGame: Game) => void;
  onCancel: () => void;
}

export default function GameEditor({ game, onUpdate, onCancel }: GameEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scores, setScores] = useState<{ [participant: string]: number }>({});
  const [winner, setWinner] = useState('');

  useEffect(() => {
    if (game) {
      setName(game.name);
      setDescription(game.description);
      setScores(game.scores);
      setWinner(game.winner);
    }
  }, [game]);

  if (!game) {
    return null;
  }

  const handleScoreChange = (participant: string, score: number) => {
    setScores({
      ...scores,
      [participant]: score,
    });
  };

  const handleWinnerChange = (participant: string) => {
    setWinner(winner === participant ? '' : participant);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Game name is required');
      return;
    }

    const updatedGame: Game = {
      ...game,
      name: name.trim(),
      description: description.trim(),
      scores,
      winner,
    };

    onUpdate(updatedGame);
    toast.success('Game updated successfully!');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Edit Game</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Game Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter game name"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter game description"
            rows={3}
          />
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Participants & Scores</h3>
          
          <div className="space-y-3">
            {game.participants.map((participant) => (
              <div key={participant} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-md">
                <div className="flex-1">
                  <p className="font-medium">{participant}</p>
                </div>
                
                <div className="flex items-center">
                  <label htmlFor={`score-${participant}`} className="block text-sm font-medium text-gray-700 mr-2">
                    Score:
                  </label>
                  <input
                    type="number"
                    id={`score-${participant}`}
                    value={scores[participant] || 0}
                    onChange={(e) => handleScoreChange(participant, parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                
                <div className="flex items-center">
                  <label htmlFor={`winner-${participant}`} className="block text-sm font-medium text-gray-700 mr-2">
                    Winner:
                  </label>
                  <input
                    type="checkbox"
                    id={`winner-${participant}`}
                    checked={winner === participant}
                    onChange={() => handleWinnerChange(participant)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
} 