'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PlusIcon } from '@heroicons/react/24/outline';

const gameTypes = [
  { label: 'Poker', value: 'poker' },
  { label: 'Blackjack', value: 'blackjack' },
  { label: 'Roulette', value: 'roulette' },
  { label: 'Craps', value: 'craps' },
  { label: 'Other', value: 'other' }
];

interface CreateGameFormProps {
  onSuccess?: () => void;
}

export default function CreateGameForm({ onSuccess }: CreateGameFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('poker');
  const [initialPot, setInitialPot] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Game name is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Insert new game
      const { data, error: insertError } = await supabase
        .from('games')
        .insert([
          {
            name: name.trim(),
            type,
            status: 'active',
            potAmount: initialPot,
            createdAt: new Date().toISOString(),
          }
        ])
        .select();
        
      if (insertError) throw insertError;
      
      // Reset form
      setName('');
      setType('poker');
      setInitialPot(0);
      setSuccess(true);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (error: any) {
      console.error('Error creating game:', error);
      setError(error.message || 'Failed to create game. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-medium text-gray-800 mb-4">Create New Game</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md border border-red-100">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md border border-green-100">
          Game created successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Game Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-navy focus:border-navy"
            placeholder="Enter game name"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Game Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-navy focus:border-navy"
          >
            {gameTypes.map((gameType) => (
              <option key={gameType.value} value={gameType.value}>
                {gameType.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-6">
          <label htmlFor="initialPot" className="block text-sm font-medium text-gray-700 mb-1">
            Initial Pot Amount ($)
          </label>
          <input
            type="number"
            id="initialPot"
            value={initialPot}
            onChange={(e) => setInitialPot(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-navy focus:border-navy"
            step="0.01"
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-navy text-white py-2 px-4 rounded-md flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Creating...</span>
          ) : (
            <>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Game
            </>
          )}
        </button>
      </form>
    </div>
  );
} 