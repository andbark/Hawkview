import { useState } from 'react'
import './App.css'

function App() {
  const [balance, setBalance] = useState(300)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center text-blue-600">
          Bachelor Party Tracker
        </h1>
      </header>

      <div className="max-w-sm mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-medium">Player Name</h3>
          <span className="text-2xl font-bold text-green-600">${balance}</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Games Played:</span>
            <span>0</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Games Won:</span>
            <span>0</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App 