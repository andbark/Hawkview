import { useState } from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';

export default function GameSettings() {
  const [settings, setSettings] = useState({
    defaultStartingBalance: 300,
    allowNegativeBalance: false,
    maxBetLimit: 1000,
    gameTypes: {
      poker: {
        enabled: true,
        minPlayers: 2,
        maxPlayers: 10,
        defaultBlinds: {
          small: 5,
          big: 10
        }
      },
      blackjack: {
        enabled: true,
        minBet: 10,
        maxBet: 500
      },
      // Add more game types
    }
  });

  const handleSaveSettings = async () => {
    // Save settings to Firebase
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Game Settings</h2>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default Starting Balance
            </label>
            <input
              type="number"
              value={settings.defaultStartingBalance}
              onChange={(e) => setSettings({
                ...settings,
                defaultStartingBalance: Number(e.target.value)
              })}
              className="mt-1 block w-full rounded-md border-gray-300"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.allowNegativeBalance}
                onChange={(e) => setSettings({
                  ...settings,
                  allowNegativeBalance: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2">Allow Negative Balance</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Maximum Bet Limit
            </label>
            <input
              type="number"
              value={settings.maxBetLimit}
              onChange={(e) => setSettings({
                ...settings,
                maxBetLimit: Number(e.target.value)
              })}
              className="mt-1 block w-full rounded-md border-gray-300"
            />
          </div>

          {/* Game-specific settings */}
          <div className="space-y-4">
            <h3 className="text-md font-medium">Game Type Settings</h3>
            
            {Object.entries(settings.gameTypes).map(([gameType, config]) => (
              <div key={gameType} className="border rounded-lg p-4">
                <h4 className="font-medium capitalize mb-2">{gameType}</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        gameTypes: {
                          ...settings.gameTypes,
                          [gameType]: {
                            ...config,
                            enabled: e.target.checked
                          }
                        }
                      })}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="ml-2">Enabled</span>
                  </label>
                  
                  {/* Add game-specific settings */}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 