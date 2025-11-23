'use client';
import { GitBranch, Link2, CheckCircle } from 'lucide-react';

export default function Integrations() {
  const integrations = [
    { name: 'GitHub', connected: false, description: 'Connect your GitHub repositories' },
    { name: 'Slack', connected: false, description: 'Get notifications in Slack' },
    { name: 'Discord', connected: false, description: 'Integrate with Discord servers' },
    { name: 'Zapier', connected: false, description: 'Automate workflows with Zapier' },
    { name: 'Webhook', connected: false, description: 'Custom webhook integrations' },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex items-center space-x-3 mb-8">
        <GitBranch className="text-gold" size={32} />
        <h1 className="text-4xl font-bold text-gold">Integrations</h1>
      </div>
      <p className="text-gray-400 mb-8">Connect SaintSal™ with your favorite tools</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <div key={integration.name} className="bg-gray-900 p-6 rounded border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{integration.name}</h3>
              {integration.connected ? (
                <CheckCircle className="text-green-500" size={24} />
              ) : (
                <div className="w-6 h-6 border-2 border-gray-600 rounded-full"></div>
              )}
            </div>
            <p className="text-gray-400 mb-4">{integration.description}</p>
            <button
              className={`w-full py-2 px-4 rounded font-bold ${
                integration.connected
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gold text-black hover:bg-yellow-400'
              }`}
            >
              {integration.connected ? 'Connected' : 'Connect'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-900 p-6 rounded">
        <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
          <Link2 />
          <span>Custom Webhook</span>
        </h3>
        <p className="text-gray-400 mb-4">Set up a custom webhook endpoint for your integrations</p>
        <div className="bg-gray-800 p-4 rounded font-mono text-sm">
          <code className="text-green-400">POST https://api.saintsal.com/webhook/{'{your-id}'}</code>
        </div>
      </div>
    </div>
  );
}

