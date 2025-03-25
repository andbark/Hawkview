import { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { playerStatsService } from '@/utils/playerStatsService';
import { Player, Transaction } from '@/types';

interface PlayerAnalyticsProps {
  player: Player;
}

export default function PlayerAnalytics({ player }: PlayerAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const playerStats = await playerStatsService.getPlayerStats(player.id);
      setStats(playerStats);
      setLoading(false);
    };
    loadStats();
  }, [player.id]);

  if (loading) return <div>Loading stats...</div>;

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Games"
          value={stats.overall.gamesPlayed}
          trend={calculateTrend(stats.overall.gamesPlayed)}
        />
        <StatCard
          title="Win Rate"
          value={`${((stats.overall.wins / stats.overall.gamesPlayed) * 100).toFixed(1)}%`}
          trend={calculateTrend(stats.winRate)}
        />
        <StatCard
          title="Total Winnings"
          value={`$${stats.overall.totalWinnings}`}
          trend={calculateTrend(stats.overall.totalWinnings)}
        />
        <StatCard
          title="Net Profit"
          value={`$${stats.overall.totalWinnings - stats.overall.totalBets}`}
          trend={calculateTrend(stats.overall.totalWinnings - stats.overall.totalBets)}
        />
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Winnings Over Time</h3>
          <Line data={prepareWinningsData(stats)} options={chartOptions} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Performance by Game Type</h3>
          <Bar data={prepareGameTypeData(stats)} options={chartOptions} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
        <RecentActivityList activities={stats.recentActivity} />
      </div>
    </div>
  );
} 