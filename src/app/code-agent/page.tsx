'use client';
import { useState } from 'react';
import { Code, Zap } from 'lucide-react';

export default function CodeAgent() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCode('');

    try {
      const token = localStorage.getItem('token');
      const enhancedPrompt = `You are a code generation agent. Generate clean, production-ready code for: ${prompt}. Include comments and best practices.`;
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ prompt: enhancedPrompt, taskType: 'code' })
      });
      const data = await res.json();
      setCode(data.response || data.error || 'No code generated');
    } catch (error) {
      setCode('Error: Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex items-center space-x-3 mb-8">
        <Zap className="text-gold" size={32} />
        <h1 className="text-4xl font-bold text-gold">Code Agent</h1>
      </div>
      <p className="text-gray-400 mb-6">AI-powered code generation and assistance</p>
      
      <form onSubmit={handleGenerate} className="space-y-4 mb-8">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Create a React component for a user profile card"
          className="w-full p-4 bg-gray-800 rounded text-white"
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="flex items-center space-x-2 bg-gold text-black py-2 px-6 rounded font-bold hover:bg-yellow-400 disabled:opacity-50"
        >
          <Code />
          <span>{loading ? 'Generating...' : 'Generate Code'}</span>
        </button>
      </form>

      {code && (
        <div className="bg-gray-900 rounded p-6">
          <h2 className="text-xl font-bold mb-4 text-gold">Generated Code:</h2>
          <pre className="bg-gray-800 p-4 rounded overflow-x-auto">
            <code className="text-green-400">{code}</code>
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="mt-4 bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            Copy Code
          </button>
        </div>
      )}
    </div>
  );
}

