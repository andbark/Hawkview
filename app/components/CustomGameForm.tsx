import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface CustomGameData {
  name: string;
  wagerAmount: number;
}

interface CustomGameFormProps {
  onSave: (data: CustomGameData) => void;
  onCancel: () => void;
  initialData?: CustomGameData;
}

export default function CustomGameForm({
  onSave,
  onCancel,
  initialData
}: CustomGameFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [wagerAmount, setWagerAmount] = useState(initialData?.wagerAmount || 10);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return; // Don't submit if name is empty
    }
    
    onSave({
      name: name.trim(),
      wagerAmount: wagerAmount
    });
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-gray-800 border border-gray-200">
      <h2 className="text-xl font-medium mb-6 text-gray-800">Create New Game</h2>
      <p className="text-gray-600 mb-6">Enter a name and wager amount</p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="gameName" className="block text-sm font-medium text-gray-700 mb-2">
            Game Name
          </label>
          <input
            type="text"
            id="gameName"
            className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-navy"
            placeholder="e.g., Poker Night"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-8">
          <label htmlFor="wagerAmount" className="block text-sm font-medium text-gray-700 mb-2">
            Entry Fee ($ per player)
          </label>
          <div className="flex items-center">
            <span className="text-gray-700 mr-2 text-lg">$</span>
            <input
              type="number"
              id="wagerAmount"
              className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-navy"
              min="1"
              step="1"
              value={wagerAmount}
              onChange={(e) => setWagerAmount(Number(e.target.value))}
              required
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white text-navy rounded-md hover:bg-gray-50 transition-colors border border-navy"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-navy text-white rounded-md hover:bg-blue-900 transition-colors"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
} 