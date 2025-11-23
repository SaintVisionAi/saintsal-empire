'use client';
import { useState } from 'react';

export default function Playground() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ prompt, taskType: 'playground' })
      });
      const data = await res.json();
      setResponse(data.response || data.error || 'No response');
    } catch (error) {
      setResponse('Error: Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-gold">Playground</h1>
      <p className="text-gray-400 mb-6">Test prompts and experiment with SaintSal™ AI</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          className="w-full p-4 bg-gray-800 rounded text-white min-h-[200px]"
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-gold text-black py-2 px-6 rounded font-bold hover:bg-yellow-400 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Run Prompt'}
        </button>
      </form>

      {response && (
        <div className="mt-8 p-6 bg-gray-900 rounded">
          <h2 className="text-xl font-bold mb-4 text-gold">Response:</h2>
          <pre className="whitespace-pre-wrap text-gray-300">{response}</pre>
        </div>
      )}
    </div>
  );
}

