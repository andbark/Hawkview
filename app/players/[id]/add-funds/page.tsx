'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import AppNavigation from '../../../components/AppNavigation';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  BanknotesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Player {
  id: string;
  name: string;
  balance: number;
}

export default function AddFundsPage() {
  const params = useParams();
  const playerId = params.id as string;
  const router = useRouter();
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load player data
  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setIsLoading(true);
        
        if (!playerId) {
          setError('No player ID provided');
          return;
        }
        
        // Get player details
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('id, name, balance')
          .eq('id', playerId)
          .single();
          
        if (playerError) throw playerError;
        
        if (!playerData) {
          setError('Player not found');
          return;
        }
        
        setPlayer(playerData);
      } catch (error) {
        console.error('Error loading player data:', error);
        setError('Failed to load player data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayerData();
  }, [playerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setIsSubmitting(true);
      
      // Validate amount
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      
      // Create a transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          playerId,
          amount: amountValue,
          type: 'adjustment',
          timestamp: new Date().toISOString(),
          description: description || 'Funds added'
        });
        
      if (transactionError) throw transactionError;
      
      // Update player balance
      const { error: playerUpdateError } = await supabase
        .from('players')
        .update({ 
          balance: supabase.rpc('increment', { x: amountValue })
        })
        .eq('id', playerId);
        
      if (playerUpdateError) throw playerUpdateError;
      
      // Success
      setSuccess(true);
      
      // Reset form
      setAmount('');
      setDescription('');
      
      // After 2 seconds, redirect back to player profile
      setTimeout(() => {
        router.push(`/players/${playerId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error adding funds:', error);
      setError('Failed to add funds. Please try again.');
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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <AppNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        </div>
      </main>
    );
  }

  if (error && !player) {
    return (
      <main className="min-h-screen bg-gray-50">
        <AppNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 p-6 rounded-lg text-center text-red-600">
            <p className="text-lg mb-4">{error}</p>
            <Link 
              href="/players" 
              className="inline-flex items-center text-navy hover:text-blue-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Players
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50">
        <AppNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-green-800 mb-2">Funds Added Successfully</h2>
            <p className="text-green-700 mb-4">
              {formatCurrency(parseFloat(amount))} has been added to {player?.name}'s account.
            </p>
            <p className="text-sm text-green-600">
              Redirecting back to player profile...
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
            href={`/players/${playerId}`}
            className="inline-flex items-center text-navy hover:text-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Player Profile
          </Link>
        </div>
        
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-12 w-12 bg-navy rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-bold text-gray-900">Add Funds</h1>
              <p className="text-sm text-gray-500">
                {player?.name} - Current Balance: {formatCurrency(player?.balance || 0)}
              </p>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount ($)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  className="focus:ring-navy focus:border-navy block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">USD</span>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                name="description"
                id="description"
                className="focus:ring-navy focus:border-navy block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Reason for adding funds"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center items-center bg-navy text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                <>
                  <BanknotesIcon className="h-5 w-5 mr-2" />
                  Add Funds
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
} 