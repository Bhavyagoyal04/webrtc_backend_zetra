'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  const createRoom = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/room/${data.roomId}`);
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Failed to create room');
    }
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      router.push(`/room/${roomId}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <button
          onClick={createRoom}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 mb-4"
        >
          Create New Room
        </button>
        <div className="border-t pt-4">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg mb-2"
          />
          <button
            onClick={joinRoom}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
