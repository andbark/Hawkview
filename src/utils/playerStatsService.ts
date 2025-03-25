import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Player, Transaction, Game } from '@/types';

export const playerStatsService = {
  async getPlayerStats(playerId: string) {
    const [transactions, games] = await Promise.all([
      get(ref(db, 'transactions')),
      get(ref(db, 'games'))
    ]);

    const playerTransactions = Object.values(transactions.val() || {})
      .filter((t: Transaction) => t.playerId === playerId);
    
    const playerGames = Object.values(games.val() || {})
      .filter((g: Game) => g.players[playerId]);

    return {
      overall: this.calculateOverallStats(playerTransactions),
      byGameType: this.calculateGameTypeStats(playerTransactions, playerGames),
      recentActivity: this.getRecentActivity(playerTransactions, playerGames),
      winRate: this.calculateWinRate(playerGames, playerId)
    };
  },

  calculateOverallStats(transactions: Transaction[]) {
    return transactions.reduce((stats, t) => {
      if (t.type === 'win') {
        stats.totalWinnings += t.amount;
        stats.wins++;
      } else if (t.type === 'bet') {
        stats.totalBets += Math.abs(t.amount);
        stats.gamesPlayed++;
      }
      return stats;
    }, {
      totalWinnings: 0,
      totalBets: 0,
      gamesPlayed: 0,
      wins: 0
    });
  },

  calculateGameTypeStats(transactions: Transaction[], games: Game[]) {
    return games.reduce((stats, game) => {
      const gameType = game.type;
      if (!stats[gameType]) {
        stats[gameType] = {
          gamesPlayed: 0,
          wins: 0,
          totalBets: 0,
          totalWinnings: 0
        };
      }
      // Add game stats logic
      return stats;
    }, {} as Record<string, any>);
  },

  getRecentActivity(transactions: Transaction[], games: Game[]) {
    return transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }
}; 