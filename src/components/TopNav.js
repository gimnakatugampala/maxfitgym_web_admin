'use client';

import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import { Menu, Search, LogOut } from 'lucide-react';

export default function TopNav({ toggleSidebar, user }) {
  const router = useRouter();

  const handleLogout = () => {
    supabaseApi.logout();
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={toggleSidebar}
          className="text-gray-600 hover:text-gray-900 lg:hidden"
        >
          <Menu size={24} />
        </button>

        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-gray-700 hidden sm:inline">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
