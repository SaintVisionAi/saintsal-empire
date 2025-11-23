'use client';
import { useState, useEffect } from 'react';
import { Settings, Users, BarChart3, Shield } from 'lucide-react';

export default function Admin() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch (e) {
        console.error('Failed to decode token');
      }
    }
  }, []);

  if (!user || (user.role !== 'enterprise' && user.role !== 'pro')) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto mb-4 text-red-500" size={48} />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">Admin dashboard requires Pro or Enterprise account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex items-center space-x-3 mb-8">
        <Settings className="text-gold" size={32} />
        <h1 className="text-4xl font-bold text-gold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 p-6 rounded">
          <Users className="text-gold mb-2" size={24} />
          <h3 className="text-xl font-bold mb-2">Users</h3>
          <p className="text-3xl font-bold">-</p>
          <p className="text-gray-400 text-sm">Total registered</p>
        </div>
        <div className="bg-gray-900 p-6 rounded">
          <BarChart3 className="text-gold mb-2" size={24} />
          <h3 className="text-xl font-bold mb-2">Queries</h3>
          <p className="text-3xl font-bold">-</p>
          <p className="text-gray-400 text-sm">Today</p>
        </div>
        <div className="bg-gray-900 p-6 rounded">
          <Shield className="text-gold mb-2" size={24} />
          <h3 className="text-xl font-bold mb-2">HACP™ Score</h3>
          <p className="text-3xl font-bold">-</p>
          <p className="text-gray-400 text-sm">Average compliance</p>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded">
        <h2 className="text-2xl font-bold mb-4">System Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">API Rate Limit (Free Tier)</label>
            <input
              type="number"
              defaultValue={10}
              className="w-full p-3 bg-gray-800 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">HACP™ Sensitivity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              defaultValue={0.7}
              className="w-full"
            />
          </div>
          <button className="bg-gold text-black py-2 px-6 rounded font-bold hover:bg-yellow-400">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

