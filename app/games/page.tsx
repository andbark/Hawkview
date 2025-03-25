'use client';

import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

// Use dynamic import to handle potential errors
const Games = dynamic(() => import('./games'), {
  loading: () => (
    <div className="flex justify-center items-center h-screen bg-white">
      <LoadingSpinner />
    </div>
  ),
  ssr: false
});

export default function GamesPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen bg-white">
        <LoadingSpinner />
      </div>
    }>
      <Games />
    </Suspense>
  );
} 