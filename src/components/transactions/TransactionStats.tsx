import { Transaction } from '@/types';

interface TransactionStatsProps {
  transactions: Transaction[];
}

export default function TransactionStats({ transactions }: TransactionStatsProps) {
  const stats = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'win') {
      acc.totalWinnings += transaction.amount;
      acc.totalGamesWon++;
    } else if (transaction.type === 'bet') {
      acc.totalBets += Math.abs(transaction.amount);
      acc.totalGamesPlayed++;
    }
    return acc;
  }, {
    totalWinnings: 0,
    totalBets: 0,
    totalGamesPlayed: 0,
    totalGamesWon: 0,
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium mb-4">Summary</h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-500">Total Games Played</label>
          <p className="text-2xl font-bold">{stats.totalGamesPlayed}</p>
        </div>

        <div>
          <label className="text-sm text-gray-500">Total Games Won</label>
          <p className="text-2xl font-bold">{stats.totalGamesWon}</p>
        </div>

        <div>
          <label className="text-sm text-gray-500">Total Bets</label>
          <p className="text-2xl font-bold text-red-600">
            ${stats.totalBets.toFixed(2)}
          </p>
        </div>

        <div>
          <label className="text-sm text-gray-500">Total Winnings</label>
          <p className="text-2xl font-bold text-green-600">
            ${stats.totalWinnings.toFixed(2)}
          </p>
        </div>

        <div>
          <label className="text-sm text-gray-500">Net Profit/Loss</label>
          <p className={`text-2xl font-bold ${
            stats.totalWinnings - stats.totalBets > 0 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            ${(stats.totalWinnings - stats.totalBets).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
} 