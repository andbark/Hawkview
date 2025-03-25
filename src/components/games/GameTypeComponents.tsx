interface GameTypeProps {
  game: Game;
  onUpdate: (updates: Partial<Game>) => void;
}

// Poker Game Component
export function PokerGame({ game, onUpdate }: GameTypeProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Blinds
          </label>
          <div className="flex space-x-2 mt-1">
            <input
              type="number"
              placeholder="Small Blind"
              className="w-full rounded-md border-gray-300"
            />
            <input
              type="number"
              placeholder="Big Blind"
              className="w-full rounded-md border-gray-300"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Buy-in
          </label>
          <input
            type="number"
            placeholder="Buy-in Amount"
            className="mt-1 w-full rounded-md border-gray-300"
          />
        </div>
      </div>
      
      {/* Add more poker-specific features */}
    </div>
  );
}

// Blackjack Game Component
export function BlackjackGame({ game, onUpdate }: GameTypeProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Minimum Bet
        </label>
        <input
          type="number"
          placeholder="Minimum Bet"
          className="mt-1 w-full rounded-md border-gray-300"
        />
      </div>
      
      {/* Add more blackjack-specific features */}
    </div>
  );
} 