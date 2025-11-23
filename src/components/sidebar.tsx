'use client';
import { MessageCircle, Mic, Code, Zap, GitBranch, Settings, Home } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNewChat = () => {
    router.push('/dashboard');
  };

  const navItems = [
    { icon: <Home />, label: 'Home', path: '/' },
    { icon: <MessageCircle />, label: 'Chat', path: '/dashboard' },
    { icon: <Code />, label: 'Playground', path: '/playground' },
    { icon: <Mic />, label: 'Walkie Talkie', path: '/walkie-talkie' },
    { icon: <Zap />, label: 'Code Agent', path: '/code-agent' },
    { icon: <GitBranch />, label: 'Integrations', path: '/integrations' },
    { icon: <Settings />, label: 'Admin Dashboard', path: '/admin' },
  ];

  return (
    <div className="w-64 bg-gray-900 h-screen p-4 text-white border-r border-gray-700 flex flex-col">
      <button 
        onClick={handleNewChat}
        className="w-full bg-yellow-500 text-black font-bold py-2 rounded mb-4 hover:bg-yellow-400 transition"
      >
        + New Chat
      </button>
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <SidebarItem 
            key={item.path}
            icon={item.icon} 
            label={item.label} 
            path={item.path}
            active={pathname === item.path}
            onClick={() => router.push(item.path)}
          />
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 text-center">HACP™ Protected</p>
        <p className="text-xs text-gray-500 text-center">Patent 10,290,222</p>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, path, active, onClick }: { icon: React.ReactNode; label: string; path: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center space-x-2 px-3 py-2 rounded transition ${
        active ? 'bg-gray-700 text-yellow-400' : 'hover:bg-gray-800 text-gray-300'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
