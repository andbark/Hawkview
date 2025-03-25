'use client';

import { useState } from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { Transaction, Player, Game } from '@/types';
import TransactionsList from '@/components/transactions/TransactionsList';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import TransactionStats from '@/components/transactions/TransactionStats';

export default function TransactionsPage() {
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    playerId: '',
    gameId: '',
    type: '',
  });

  const { data: transactions } = useRealtimeData<Record<string, Transaction>>('transactions');
  const { data: players } = useRealtimeData<Record<string, Player>>('players');
  const { data: games } = useRealtimeData<Record<string, Game>>('games');

  const filteredTransactions = Object.values(transactions || {}).filter(transaction => {
    if (filters.startDate && transaction.timestamp < filters.startDate) return false;
    if (filters.endDate && transaction.timestamp > filters.endDate) return false;
    if (filters.playerId && transaction.playerId !== filters.playerId) return false;
    if (filters.gameId && transaction.gameId !== filters.gameId) return false;
    if (filters.type && transaction.type !== filters.type) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Transaction History</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TransactionFilters 
            filters={filters}
            onFiltersChange={setFilters}
            players={players || {}}
            games={games || {}}
          />
          <TransactionsList 
            transactions={filteredTransactions}
            players={players || {}}
            games={games || {}}
          />
        </div>
        <div>
          <TransactionStats transactions={filteredTransactions} />
        </div>
      </div>
    </div>
  );
} 