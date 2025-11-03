'use client';
import { MessageCircle, Mic, Code, Zap, GitBranch, Settings } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 h-screen p-4 text-white border-r border-gray-700">
      <button className="w-full bg-yellow-500 text-black font-bold py-2 rounded mb-4">
        + New Chat
      </button>
      <nav className="space-y-2">
        <SidebarItem icon={<MessageCircle />} label="Chat" active />
        <SidebarItem icon={<Code />} label="Playground" />
        <SidebarItem icon={<Mic />} label="Walkie Talkie" />
        <SidebarItem icon={<Zap />} label="Code Agent" />
        <SidebarItem icon={<GitBranch />} label="Integrations" />
        <SidebarItem icon={<Settings />} label="Admin Dashboard" />
      </nav>
    </div>
  );
}

function SidebarItem({ icon, label, active }: any) {
  return (
    <button className={`w-full flex items-center space-x-2 px-3 py-2 rounded ${active ? 'bg-gray-700' : 'hover:bg-gray-800'}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
