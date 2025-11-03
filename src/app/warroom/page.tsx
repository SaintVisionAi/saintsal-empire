'use client';
import { useEffect } from 'react';

export default function WarRoom() {
  useEffect(() => {
    // Agora init (add your app ID)
    console.log('WarRoom screen share ready');
  }, []);

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-yellow-500">WarRoom – Live Screen Share</h1>
      <p>Share your screen with SaintSal™ for real-time deal execution.</p>
      <button className="mt-4 bg-yellow-500 text-black px-6 py-2 rounded font-bold">
        Start Screen Share
      </button>
    </div>
  );
}
