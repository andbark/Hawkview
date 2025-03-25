export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  balance: number;
  gamesPlayed: number;
  gamesWon: number;
  totalWinnings: number;
  totalLosses: number;
  createdAt: number;
}

export interface Game {
  id: string;
  name: string;
  type: string;
  status: GameStatus;
  startTime: number;
  endTime?: number;
  players: Record<string, {
    initialBet: number;
    finalAmount?: number;
  }>;
  winner?: string;
  totalPot: number;
  createdBy: string;
}

export interface Transaction {
  id: string;
  gameId: string;
  playerId: string;
  amount: number;
  type: 'bet' | 'win' | 'refund';
  timestamp: number;
  description: string;
}

export type GameType = 'poker' | 'blackjack' | 'roulette' | 'custom';
export type GameStatus = 'active' | 'completed' | 'cancelled';
export type TransactionType = 'bet' | 'win' | 'loss' | 'adjustment'; 