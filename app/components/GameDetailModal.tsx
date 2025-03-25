'use client';

import GameDetails from './GameDetails';

interface GameDetailModalProps {
  gameId: string;
  onClose: () => void;
}

export default function GameDetailModal({ gameId, onClose }: GameDetailModalProps) {
  // Handle the case when a game is synced
  const handleGameSynced = () => {
    // Trigger a data refresh event to update UI across components
    window.dispatchEvent(new CustomEvent('dataRefresh', { 
      detail: { 
        timestamp: Date.now(),
        source: 'gameSynced',
        gameId
      } 
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <GameDetails 
          gameId={gameId} 
          onSynced={handleGameSynced}
        />
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-navy hover:bg-gray-200 rounded transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 