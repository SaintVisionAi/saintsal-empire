'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode token for user info (simplified)
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    }
  }, []);

  const sendMessage = async () => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ prompt: message, userId: user?.userId, taskType: 'sal' })
    });
    const data = await res.json();
    setResponse(data.response || 'HACP™ Active | Patent 10,290,222\n\n' + message);
    setMessage('');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-gold">SaintSal™ Dashboard</h1>
      <div className="mb-8">
        <h2 className="text-2xl">Welcome, {user.name}</h2>
        <p>Role: {user.role.toUpperCase()} | Queries Left: {user.queryLimit}</p>
        <p className="text-sm text-gray-400">Upgrade: Starter ($29/mo) | Pro ($97/mo) | Enterprise (Custom)</p>
      </div>
      <div className="space-y-4">
        <input 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          placeholder="Ask SaintSal™: Find me a $10M deal..."
          className="w-full p-3 bg-gray-800 rounded text-white"
        />
        <button onClick={sendMessage} className="bg-gold text-black py-2 px-4 rounded font-bold">
          Send
        </button>
        {response && <div className="bg-gray-900 p-4 rounded">{response}</div>}
      </div>
    </div>
  );
}
