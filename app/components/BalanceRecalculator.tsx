'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function BalanceRecalculator() {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [lastRecalculated, setLastRecalculated] = useState<string | null>(
    localStorage.getItem('lastBalanceRecalculation')
  );

  const recalculateBalances = async () => {
    try {
      setIsRecalculating(true);
      console.log('Starting balance recalculation...');
      
      // Get all transactions from localStorage
      const transactionsStr = localStorage.getItem('transactions');
      if (!transactionsStr) {
        toast.error('No transactions found');
        return;
      }
      
      const transactions = JSON.parse(transactionsStr);
      console.log(`Found ${transactions.length} transactions to process`);
      
      // Get all games from localStorage
      const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
      const localGames = localGamesStr ? JSON.parse(localGamesStr) : [];
      console.log(`Found ${localGames.length} games to process`);
      
      // Group transactions by player ID
      const playerTransactions: Record<string, any[]> = {};
      
      // Process each transaction to build a map of player balances
      transactions.forEach((tx: any) => {
        if (!tx.playerId) return;
        
        if (!playerTransactions[tx.playerId]) {
          playerTransactions[tx.playerId] = [];
        }
        
        playerTransactions[tx.playerId].push(tx);
      });
      
      // Calculate balance adjustments for each player
      const balanceAdjustments: Record<string, { 
        balanceChange: number; 
        wins: number;
        gamesPlayed: number;
      }> = {};
      
      // Process each player's transactions
      Object.entries(playerTransactions).forEach(([playerId, playerTxs]) => {
        // Initialize adjustment record for this player
        balanceAdjustments[playerId] = {
          balanceChange: 0,
          wins: 0,
          gamesPlayed: 0
        };
        
        // Get unique games this player participated in
        const gameIds = new Set(playerTxs.map(tx => tx.gameId));
        balanceAdjustments[playerId].gamesPlayed = gameIds.size;
        
        // Calculate win count and balance changes
        playerTxs.forEach(tx => {
          // Add transaction amount to balance
          balanceAdjustments[playerId].balanceChange += Number(tx.amount) || 0;
          
          // Count wins
          if (tx.type === 'win') {
            balanceAdjustments[playerId].wins += 1;
          }
        });
      });
      
      // Update localPlayerStats with the calculated adjustments
      const localPlayerStats: Record<string, any> = {};
      
      Object.entries(balanceAdjustments).forEach(([playerId, adjustments]) => {
        localPlayerStats[playerId] = {
          winsAdded: adjustments.wins,
          balanceAdjustment: adjustments.balanceChange,
          gamesPlayed: adjustments.gamesPlayed
        };
      });
      
      // Save the updated player stats to localStorage
      localStorage.setItem('localPlayerStats', JSON.stringify(localPlayerStats));
      console.log('Updated player statistics:', localPlayerStats);
      
      // Record the time of this recalculation
      const now = new Date().toISOString();
      localStorage.setItem('lastBalanceRecalculation', now);
      setLastRecalculated(now);
      
      // Trigger a refresh event for the UI
      window.dispatchEvent(new CustomEvent('dataRefresh', { 
        detail: { timestamp: Date.now(), source: 'balanceRecalculation' } 
      }));
      
      toast.success('Player balances recalculated successfully');
    } catch (error) {
      console.error('Error recalculating balances:', error);
      toast.error('Failed to recalculate balances');
    } finally {
      setIsRecalculating(false);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Balance Recalculation</h3>
          <p className="text-gray-400 text-sm">
            Recalculate player balances based on all historical games
          </p>
          {lastRecalculated && (
            <div className="flex items-center text-xs text-gray-400 mt-1">
              <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
              Last recalculated: {new Date(lastRecalculated).toLocaleString()}
            </div>
          )}
        </div>
        <button
          onClick={recalculateBalances}
          disabled={isRecalculating}
          className={`px-4 py-2 rounded-md text-white flex items-center ${
            isRecalculating 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {isRecalculating ? (
            <>
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Recalculate
            </>
          )}
        </button>
      </div>
    </div>
  );
} 