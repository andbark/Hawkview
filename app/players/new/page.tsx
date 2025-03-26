'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AppNavigation from '../../components/AppNavigation';
import LoadingSpinner from '../../components/LoadingSpinner';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  UserPlusIcon,
  CheckCircleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface PlayerFormData {
  name: string;
  initialBalance: string;
}

export default function NewPlayerPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<PlayerFormData>({
    name: '',
    initialBalance: '100'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdPlayerId, setCreatedPlayerId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setIsSubmitting(true);
      
      // Basic validation
      if (!formData.name.trim()) {
        setError('Please enter a player name');
        return;
      }
      
      const initialBalanceValue = parseFloat(formData.initialBalance);
      if (isNaN(initialBalanceValue) || initialBalanceValue < 0) {
        setError('Please enter a valid initial balance');
        return;
      }
      
      // Create the player
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          name: formData.name.trim(),
          balance: initialBalanceValue,
          createdAt: new Date().toISOString()
        })
        .select();
        
      if (playerError) throw playerError;
      
      if (!playerData || playerData.length === 0) {
        throw new Error('Failed to create player');
      }
      
      const playerId = playerData[0].id;
      setCreatedPlayerId(playerId);
      
      // If initial balance is greater than 0, create a transaction for it
      if (initialBalanceValue > 0) {
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            playerId,
            amount: initialBalanceValue,
            type: 'adjustment',
            timestamp: new Date().toISOString(),
            description: 'Initial balance'
          });
          
        if (transactionError) throw transactionError;
      }
      
      // Success!
      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        initialBalance: '100'
      });
      
      // After 1.5 seconds, redirect to the player page
      setTimeout(() => {
        router.push(`/players/${playerId}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error creating player:', error);
      setError('Failed to create player. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: string) => {
    const value = parseFloat(amount);
    if (isNaN(value)) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50">
        <AppNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-green-800 mb-2">Player Created Successfully!</h2>
            <p className="text-green-700 mb-4">
              {formData.name} has been added with an initial balance of {formatCurrency(formData.initialBalance)}.
            </p>
            <p className="text-sm text-green-600">
              Redirecting to player profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link 
            href="/players" 
            className="inline-flex items-center text-navy hover:text-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Players
          </Link>
        </div>
        
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <UserPlusIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gray-900">Add New Player</h1>
                <p className="text-sm text-gray-500">
                  Register a player for games
                </p>
              </div>
            </div>
            
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Player Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="focus:ring-navy focus:border-navy block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter player name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Balance ($)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="initialBalance"
                      name="initialBalance"
                      value={formData.initialBalance}
                      onChange={handleInputChange}
                      className="focus:ring-navy focus:border-navy block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                      disabled={isSubmitting}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">USD</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    The starting amount of money the player will have available for games.
                  </p>
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center bg-navy text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span className="ml-2">Creating Player...</span>
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-5 w-5 mr-2" />
                      Add Player
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-4 flex items-center justify-center space-x-2">
                <BanknotesIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-500">
                  Initial balance: {formatCurrency(formData.initialBalance)}
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
} 