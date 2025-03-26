'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlusIcon } from '@heroicons/react/24/outline';

const colorOptions = [
  { name: 'Purple', value: 'purple' },
  { name: 'Blue', value: 'blue' },
  { name: 'Green', value: 'green' },
  { name: 'Red', value: 'red' },
  { name: 'Amber', value: 'amber' },
  { name: 'Teal', value: 'teal' },
  { name: 'Slate', value: 'slate' },
  { name: 'Gray', value: 'gray' },
  { name: 'Zinc', value: 'zinc' },
  { name: 'Stone', value: 'stone' },
];

interface CreatePlayerFormProps {
  onSuccess?: () => void;
}

export default function CreatePlayerForm({ onSuccess }: CreatePlayerFormProps) {
  const [name, setName] = useState('');
  const [colorScheme, setColorScheme] = useState('blue');
  const [initialBalance, setInitialBalance] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Player name is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Insert new player
      const { data, error: insertError } = await supabase
        .from('players')
        .insert([
          {
            name: name.trim(),
            colorScheme,
            balance: initialBalance,
            createdAt: new Date().toISOString(),
          }
        ])
        .select();
        
      if (insertError) throw insertError;
      
      // Reset form
      setName('');
      setColorScheme('blue');
      setInitialBalance(0);
      setSuccess(true);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (error: any) {
      console.error('Error creating player:', error);
      setError(error.message || 'Failed to create player. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-medium text-gray-800 mb-4">Add New Player</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md border border-red-100">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md border border-green-100">
          Player created successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Player Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-navy focus:border-navy"
            placeholder="Enter player name"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="colorScheme" className="block text-sm font-medium text-gray-700 mb-1">
            Color Scheme
          </label>
          <div className="grid grid-cols-5 gap-2">
            {colorOptions.map((color) => (
              <div
                key={color.value}
                onClick={() => setColorScheme(color.value)}
                className={`h-10 cursor-pointer flex items-center justify-center rounded-md ${
                  colorScheme === color.value
                    ? 'ring-2 ring-navy ring-offset-2'
                    : 'border border-gray-200'
                }`}
              >
                <div 
                  className={`w-6 h-6 rounded-full bg-${color.value}-500`}
                  title={color.name}
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700 mb-1">
            Initial Balance ($)
          </label>
          <input
            type="number"
            id="initialBalance"
            value={initialBalance}
            onChange={(e) => setInitialBalance(Number(e.target.value))}
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
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Create Player
            </>
          )}
        </button>
      </form>
    </div>
  );
} 