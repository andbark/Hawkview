'use client';

import { useState } from 'react';
import { ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../lib/hooks/useAdmin';
import { toast } from 'react-hot-toast';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export default function AdminLoginModal({ isOpen, onClose, redirectTo = '/admin' }: AdminLoginModalProps) {
  const [password, setPassword] = useState('');
  const { loginAsAdmin } = useAdmin();
  const router = useRouter();
  
  const handleLogin = () => {
    if (loginAsAdmin(password)) {
      toast.success('Admin access granted');
      
      if (redirectTo) {
        router.push(redirectTo);
      }
      
      onClose();
    } else {
      toast.error('Incorrect password');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-6 w-6 text-purple-500 mr-2" />
            <h2 className="text-xl font-bold text-white">Admin Access</h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-white" />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Enter Admin Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Password"
            autoFocus
          />
        </div>
        
        <button
          onClick={handleLogin}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
        >
          Login as Admin
        </button>
      </div>
    </div>
  );
} 