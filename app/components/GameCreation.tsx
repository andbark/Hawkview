import { useState } from 'react';
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

export default function GameCreation({ onGameCreate }: { onGameCreate: (game: Game) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [participant, setParticipant] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);

  const addParticipant = () => {
    if (participant.trim() && !participants.includes(participant.trim())) {
      setParticipants([...participants, participant.trim()]);
      setParticipant('');
    } else if (participants.includes(participant.trim())) {
      toast.error('Participant already added');
    }
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Game name is required');
      return;
    }
    
    if (participants.length < 2) {
      toast.error('At least two participants are required');
      return;
    }

    const newGame: Game = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      date: new Date(),
      participants,
      winner: '',
      scores: Object.fromEntries(participants.map(p => [p, 0])),
    };

    onGameCreate(newGame);
    
    // Reset form
    setName('');
    setDescription('');
    setParticipants([]);
    
    toast.success('Game created successfully!');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Create New Game</h2>
      
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Participants *
          </label>
          <div className="flex">
            <input
              type="text"
              value={participant}
              onChange={(e) => setParticipant(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter participant name"
            />
            <button
              type="button"
              onClick={addParticipant}
              className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
          
          {participants.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-sm font-medium text-gray-700">Added participants:</p>
              <ul className="mt-1">
                {participants.map((p, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded mb-1">
                    <span>{p}</span>
                    <button
                      type="button"
                      onClick={() => removeParticipant(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Create Game
          </button>
        </div>
      </form>
    </div>
  );
} 