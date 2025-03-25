import { ref, query, orderByChild, get, startAt, endAt } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Transaction } from '@/types';

export const transactionService = {
  async getTransactions(options?: {
    startDate?: number;
    endDate?: number;
    playerId?: string;
    gameId?: string;
  }): Promise<Transaction[]> {
    let transactionsRef = ref(db, 'transactions');
    
    if (options?.startDate && options?.endDate) {
      transactionsRef = query(
        transactionsRef,
        orderByChild('timestamp'),
        startAt(options.startDate),
        endAt(options.endDate)
      );
    }

    const snapshot = await get(transactionsRef);
    const transactions = snapshot.val() || {};

    return Object.values(transactions)
      .filter((transaction: Transaction) => {
        if (options?.playerId && transaction.playerId !== options.playerId) return false;
        if (options?.gameId && transaction.gameId !== options.gameId) return false;
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  async getPlayerStats(playerId: string) {
    const transactions = await this.getTransactions({ playerId });
    
    return transactions.reduce((stats, transaction) => {
      if (transaction.type === 'win') {
        stats.totalWinnings += transaction.amount;
        stats.gamesWon++;
      } else if (transaction.type === 'bet') {
        stats.totalBets += Math.abs(transaction.amount);
        stats.gamesPlayed++;
      }
      return stats;
    }, {
      totalWinnings: 0,
      totalBets: 0,
      gamesPlayed: 0,
      gamesWon: 0,
    });
  }
}; 