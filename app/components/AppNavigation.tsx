'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon,
  UserGroupIcon,
  TrophyIcon,
  ClockIcon,
  ChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function AppNavigation() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  
  const routes = [
    {
      name: 'Home',
      href: '/',
      icon: <HomeIcon className="w-5 h-5" />,
      current: pathname === '/'
    },
    {
      name: 'Games',
      href: '/games',
      icon: <TrophyIcon className="w-5 h-5" />,
      current: pathname === '/games' || pathname.startsWith('/games/')
    },
    {
      name: 'Players',
      href: '/players',
      icon: <UserGroupIcon className="w-5 h-5" />,
      current: pathname === '/players'
    },
    {
      name: 'Game History',
      href: '/game-history',
      icon: <ClockIcon className="w-5 h-5" />,
      current: pathname === '/game-history'
    },
    {
      name: 'Leaderboard',
      href: '/leaderboard',
      icon: <ChartBarIcon className="w-5 h-5" />,
      current: pathname === '/leaderboard'
    },
  ];
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-navy">Bachelor Party Casino</h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {routes.map((route) => (
                  <Link
                    key={route.name}
                    href={route.href}
                    className={`${
                      route.current
                        ? 'bg-gray-100 text-navy font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-navy'
                    } px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200`}
                  >
                    <span className="mr-2">{route.icon}</span>
                    {route.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobile && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="flex justify-around px-2 py-3">
            {routes.map((route) => (
              <Link
                key={route.name}
                href={route.href}
                className={`${
                  route.current
                    ? 'text-navy font-medium'
                    : 'text-gray-500 hover:text-navy'
                } flex flex-col items-center text-xs transition-colors duration-200`}
              >
                <span className="text-center">{route.icon}</span>
                <span className="mt-1">{route.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
} 