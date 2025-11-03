'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Decode token to get username (simple implementation)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsername(payload.username || 'User');
    } catch (error) {
      console.error('Token decode error:', error);
    }
  }, [router]);

  const handleCreateRoom = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/room/${data.roomId}`);
      } else {
        alert(data.error || 'Failed to create room');
      }
    } catch (error) {
      alert('Server error');
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rooms/join/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/room/${roomId}`);
      } else {
        alert(data.error || 'Failed to join room');
      }
    } catch (error) {
      alert('Server error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Zetra</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Start Your Video Call
          </h2>
          <p className="text-gray-600">
            Create a new room or join an existing one
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-center mb-4">Create Room</h3>
            <p className="text-gray-600 text-center mb-6">
              Start a new video call and invite others
            </p>
            <button
              onClick={handleCreateRoom}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Create New Room
            </button>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-center mb-4">Join Room</h3>
            <p className="text-gray-600 text-center mb-6">
              Enter a room ID to join an existing call
            </p>
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleJoinRoom}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
