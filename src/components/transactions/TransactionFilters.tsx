import { Player, Game } from '@/types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface TransactionFiltersProps {
  filters: {
    startDate: Date | null;
    endDate: Date | null;
    playerId: string;
    gameId: string;
    type: string;
  };
  onFiltersChange: (filters: any) => void;
  players: Record<string, Player>;
  games: Record<string, Game>;
}

export default function TransactionFilters({
  filters,
  onFiltersChange,
  players,
  games,
}: TransactionFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <div className="flex space-x-2">
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => onFiltersChange({ ...filters, startDate: date })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholderText="Start Date"
            />
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => onFiltersChange({ ...filters, endDate: date })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholderText="End Date"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Player
          </label>
          <select
            value={filters.playerId}
            onChange={(e) => onFiltersChange({ ...filters, playerId: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Players</option>
            {Object.values(players).map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Game
          </label>
          <select
            value={filters.gameId}
            onChange={(e) => onFiltersChange({ ...filters, gameId: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Games</option>
            {Object.values(games).map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="bet">Bet</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
          </select>
        </div>
      </div>
    </div>
  );
} 