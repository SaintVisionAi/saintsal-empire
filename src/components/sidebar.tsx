'use client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, MessageCircle, Mic, Code, Zap, GitBranch, Settings } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 h-screen p-4 text-white border-r border-gray-700 overflow-auto">
      <button className="w-full bg-yellow-500 text-black font-bold py-2 rounded mb-4">
        + New Chat
      </button>
      <nav className="space-y-2">
        <a href="/chat" className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-800">
          <MessageCircle /> Chat
        </a>
        <Collapsible>
          <CollapsibleTrigger className="w-full flex justify-between px-3 py-2 rounded hover:bg-gray-800">
            Playground <ChevronDown size=16 />
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 space-y-1">
            <a href="/playground/code" className="block py-1 hover:text-yellow-500">Code Agent</a>
            <a href="/playground/voice" className="block py-1 hover:text-yellow-500">Voice Assistant</a>
          </CollapsibleContent>
        </Collapsible>
        <a href="/walkie" className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-800">
          <Mic /> Walkie Talkie
        </a>
        <a href="/agents" className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-800">
          <Zap /> Agents Hub
        </a>
        <a href="/integrations" className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-800">
          <GitBranch /> Integrations
        </a>
        <a href="/admin" className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-800">
          <Settings /> Admin Dashboard
        </a>
      </nav>
    </div>
  );
}
