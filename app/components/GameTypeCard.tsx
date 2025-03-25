import Image from 'next/image';
import { PlusCircleIcon, PencilIcon } from '@heroicons/react/24/outline';

// Define a placeholder icon for custom games
const CustomGameIcon = () => (
  <PlusCircleIcon className="h-8 w-8" />
);

type GameType = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  bgClass: string;
  isCustom?: boolean;
};

interface GameTypeCardProps {
  gameType: GameType;
  selected: boolean;
  onClick: () => void;
  onEdit?: () => void;
}

export const gameTypes: GameType[] = [
  {
    id: 'custom',
    name: 'Custom Game',
    description: 'Create your own game type',
    icon: <CustomGameIcon />,
    bgClass: 'bg-white',
    isCustom: true
  }
];

export default function GameTypeCard({ gameType, selected, onClick, onEdit }: GameTypeCardProps) {
  return (
    <div 
      className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 ${
        selected 
          ? 'ring-2 ring-navy scale-105 shadow-md' 
          : 'border border-gray-200 hover:shadow-md hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className={`${gameType.bgClass} p-6 h-full`}>
        <div className="flex flex-col items-center text-gray-800">
          <div className="mb-3 text-navy">
            {gameType.icon}
          </div>
          <h3 className="text-xl font-medium mb-1">{gameType.name}</h3>
          <p className="text-sm text-gray-600 text-center">{gameType.description}</p>
        </div>
      </div>
      
      {selected && gameType.isCustom && onEdit && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-2 right-2 bg-gray-100 p-1 rounded-full text-navy hover:bg-gray-200 transition-all"
        >
          <PencilIcon className="h-5 w-5" />
        </button>
      )}
      
      {selected && (
        <div className="absolute inset-0 bg-navy bg-opacity-5 flex items-center justify-center">
          <div className="bg-navy text-white font-medium px-4 py-1 rounded-full text-sm shadow-sm">
            Selected
          </div>
        </div>
      )}
    </div>
  );
} 