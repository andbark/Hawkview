'use client';

import { useState } from 'react';
// Import will be added back once the module path issue is resolved
// import { useRealtimeData } from '@/hooks/useRealtimeData';
// import AdminStats from '@/components/admin/AdminStats';
// import UserManagement from '@/components/admin/UserManagement';
// import GameSettings from '@/components/admin/GameSettings';
// import SystemLogs from '@/components/admin/SystemLogs';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="bg-white shadow">
        <nav className="flex space-x-4 p-4">
          <button
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeTab === 'overview' ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeTab === 'users' ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeTab === 'settings' ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeTab === 'logs' ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('logs')}
          >
            System Logs
          </button>
        </nav>
      </div>

      <div className="p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p className="font-bold">Admin Dashboard Under Construction</p>
          <p>This feature is currently being implemented.</p>
        </div>
        
        {activeTab === 'overview' && <div>Admin Stats Overview</div>}
        {activeTab === 'users' && <div>User Management</div>}
        {activeTab === 'settings' && <div>Game Settings</div>}
        {activeTab === 'logs' && <div>System Logs</div>}
      </div>
    </div>
  );
} 