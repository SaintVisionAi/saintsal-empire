'use client';
import { useEffect } from 'react';
import { createClient } from 'agora-rtc-sdk-ng';

export default function WarRoom() {
  useEffect(() => {
    const client = createClient({ mode: 'rtc', codec: 'vp8' });
    client.init('your-agora-app-id', () => console.log('Screen share ready'));
  }, []);

  return (
    <div className="p-8 bg-black text-white">
      <h1 className="text-3xl mb-4 text-yellow-500">WarRoom – Screen Share</h1>
      <button className="bg-yellow-500 text-black px-4 py-2 rounded">Start Share</button>
    </div>
  );
}
