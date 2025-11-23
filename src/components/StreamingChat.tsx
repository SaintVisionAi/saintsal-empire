'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Mic, StopCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

interface StreamingChatProps {
  userId?: number;
  className?: string;
  mobile?: boolean;
}

export default function StreamingChat({ userId, className = '', mobile = false }: StreamingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [useWebSocket, setUseWebSocket] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const currentMessageRef = useRef<string>('');

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (useWebSocket && typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) return;

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:${window.location.port || 3000}/ws`;
      const ws = new WebSocket(`${wsUrl}?token=${token}`);

      ws.onopen = () => {
        setWsConnected(true);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log('WebSocket authenticated');
          } else if (data.type === 'start') {
            setIsStreaming(true);
            currentMessageRef.current = '';
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                model: data.model,
              },
            ]);
          } else if (data.type === 'chunk') {
            currentMessageRef.current += data.text;
            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.content = currentMessageRef.current;
                lastMsg.model = data.model;
              }
              return updated;
            });
          } else if (data.type === 'done') {
            setIsStreaming(false);
            currentMessageRef.current = '';
          } else if (data.type === 'error') {
            setIsStreaming(false);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Error: ${data.error}`,
                timestamp: new Date(),
              },
            ]);
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
        setUseWebSocket(false); // Fallback to HTTP streaming
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log('WebSocket disconnected');
      };

      wsRef.current = ws;

      return () => {
        ws.close();
      };
    }
  }, [useWebSocket]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    if (useWebSocket && wsRef.current && wsConnected) {
      // Send via WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        prompt: input,
        useRAG: true,
      }));
    } else {
      // Fallback to HTTP streaming
      await sendMessageHTTP(input);
    }
  };

  const sendMessageHTTP = async (prompt: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          userId,
          useRAG: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let currentContent = '';

      // Add assistant message placeholder
      const assistantMessageId = Date.now().toString();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        },
      ]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === 'chunk' && data.text) {
              currentContent += data.text;
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                  lastMsg.content = currentContent;
                  lastMsg.model = data.model;
                }
                return updated;
              });
            } else if (data.type === 'done') {
              setIsStreaming(false);
            } else if (data.type === 'error') {
              setIsStreaming(false);
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                  lastMsg.content = `Error: ${data.error}`;
                }
                return updated;
              });
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error: any) {
      setIsStreaming(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error: ${error.message || 'Failed to get response'}`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Connection Status */}
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-xs text-gray-400">
            {wsConnected ? 'WebSocket Connected' : useWebSocket ? 'Connecting...' : 'HTTP Streaming'}
          </span>
        </div>
        {mobile && (
          <button
            onClick={() => setUseWebSocket(!useWebSocket)}
            className="text-xs text-gold hover:underline"
          >
            {useWebSocket ? 'Use HTTP' : 'Use WebSocket'}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-lg mb-2">Welcome to SaintSal™</p>
            <p className="text-sm">Start a conversation to begin</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-gold text-black'
                  : 'bg-gray-800 text-white'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.model && (
                <p className="text-xs mt-1 opacity-70">{msg.model}</p>
              )}
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-4 bg-gray-900">
        <div className="flex items-end space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask SaintSal™ anything..."
            className="flex-1 p-3 bg-gray-800 rounded text-white resize-none min-h-[60px] max-h-[200px]"
            rows={2}
            disabled={isStreaming}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="bg-gold text-black p-3 rounded font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStreaming ? (
              <StopCircle className="w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

