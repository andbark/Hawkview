'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPanel() {
  const router = useRouter();
  
  // Redirect to home page immediately
  useEffect(() => {
    router.push('/');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="text-center text-white">
        <p>Redirecting...</p>
      </div>
    </div>
  );
} 