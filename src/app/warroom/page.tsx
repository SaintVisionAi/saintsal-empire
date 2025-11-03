'use client';
import { useEffect } from 'react';
import { AgoraRTCProvider, useRTCClient } from 'agora-rtc-sdk-ng';

export default function WarRoom() {
  const client = useRTCClient();

  useEffect(() => {
    client.join('your-channel', 'token', null, null);
    // Screen share logic
  }, [client]);

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-4">WarRoom – Screen Share</h1>
      <button className="bg-yellow-500 text-black px-4 py-2 rounded">Start Share</button>
    </div>
  );
}
