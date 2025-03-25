'use client';

import { useState } from 'react';

export default function TestPage() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6 text-center">UI Test Page</h1>
      
      <div className="flex flex-col items-center space-y-4">
        <p className="text-xl text-white">Counter: {count}</p>
        
        <div className="flex space-x-4">
          <button 
            onClick={() => setCount(count - 1)}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Decrease
          </button>
          
          <button 
            onClick={() => setCount(count + 1)}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Increase
          </button>
        </div>
        
        <div className="mt-6 w-full bg-gray-700 p-4 rounded-md">
          <h2 className="text-lg font-semibold text-white mb-2">Tailwind Test</h2>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-blue-500 text-white p-2 rounded text-center">Blue</div>
            <div className="bg-green-500 text-white p-2 rounded text-center">Green</div>
            <div className="bg-red-500 text-white p-2 rounded text-center">Red</div>
            <div className="bg-purple-500 text-white p-2 rounded text-center">Purple</div>
          </div>
        </div>
      </div>
    </div>
  );
} 