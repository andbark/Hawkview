import { v4 as uuidv4 } from 'uuid';

// Initial sample players for seeding database
export const initialPlayers = [
  {
    id: uuidv4(),
    name: 'Player 1',
    balance: 1000,
    gamesPlayed: 0,
    created: Date.now()
  },
  {
    id: uuidv4(),
    name: 'Player 2',
    balance: 1000,
    gamesPlayed: 0,
    created: Date.now()
  },
  {
    id: uuidv4(),
    name: 'Player 3',
    balance: 1000,
    gamesPlayed: 0,
    created: Date.now()
  },
  {
    id: uuidv4(),
    name: 'Player 4',
    balance: 300,
    gamesPlayed: 0,
    gamesWon: 0,
    colorScheme: 'red'
  }
];

// Sample game data for testing
export const sampleGames = [
  {
    id: 'test-game-1',
    name: 'Test Poker Game',
    type: 'custom',
    date: new Date().toISOString(),
    startTime: Date.now() - 3600000, // 1 hour ago
    players: [
      { id: 'player-1', name: 'Player 1', bet: 50 },
      { id: 'player-2', name: 'Player 2', bet: 50 },
      { id: 'player-3', name: 'Player 3', bet: 50 },
      { id: 'player-4', name: 'Player 4', bet: 50 }
    ],
    totalPot: 200,
    status: 'active',
    customData: {
      name: 'Test Poker Game',
      wagerAmount: 50
    }
  }
];

export const gameTypes = [
  { id: 'poker', name: 'Poker', description: 'Texas Hold\'em, Omaha, and other poker variants' },
  { id: 'blackjack', name: 'Blackjack', description: '21 card game against the dealer' },
  { id: 'roulette', name: 'Roulette', description: 'Bet on where the ball lands' },
  { id: 'craps', name: 'Craps', description: 'Dice game with multiple betting options' },
  { id: 'slots', name: 'Slots', description: 'Digital slot machine' },
  { id: 'custom', name: 'Custom Game', description: 'Create your own game rules' }
];

export const gameSettings = {
  defaultBuyIn: 100,
  minimumPlayers: 2,
  defaultGameDuration: 120, // in minutes
  allowNegativeBalances: true,
  trackStatistics: true,
  defaultGameType: 'poker'
}; 