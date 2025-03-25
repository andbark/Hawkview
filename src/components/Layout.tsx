import { Fragment } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Players', href: '/players' },
    { name: 'Games', href: '/games' },
    { name: 'Leaderboard', href: '/leaderboard' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Disclosure as="nav" className="bg-white shadow">
        {/* Navigation implementation */}
      </Disclosure>

      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
} 