export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-6">Bachelor Party Dashboard</h1>
      <p className="text-xl mb-8">Track games, bets, and player performance</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 border rounded-lg hover:bg-gray-100">
          <h2 className="text-2xl font-bold mb-2">Games</h2>
          <p>Manage poker, blackjack, and other games</p>
        </div>
        <div className="p-6 border rounded-lg hover:bg-gray-100">
          <h2 className="text-2xl font-bold mb-2">Players</h2>
          <p>Track player balances and statistics</p>
        </div>
        <div className="p-6 border rounded-lg hover:bg-gray-100">
          <h2 className="text-2xl font-bold mb-2">Leaderboard</h2>
          <p>See who's winning and losing the most</p>
        </div>
        <div className="p-6 border rounded-lg hover:bg-gray-100">
          <h2 className="text-2xl font-bold mb-2">History</h2>
          <p>View past games and transactions</p>
        </div>
      </div>
    </main>
  );
} 