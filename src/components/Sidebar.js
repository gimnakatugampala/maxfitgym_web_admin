'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Dumbbell, 
  Calendar, 
  BarChart3, 
  Plus, 
  X,
  Menu 
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  const menuItems = [
    { id: 'dashboard', href: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'admin-list', href: '/admin', icon: Users, label: 'Admin List', parent: 'admin' },
    { id: 'add-admin', href: '/admin/add', icon: Plus, label: 'Add Admin', parent: 'admin' },
    { id: 'workout-list', href: '/workouts', icon: Dumbbell, label: 'Workout List', parent: 'workout' },
    { id: 'add-workout', href: '/workouts/add', icon: Plus, label: 'Add Workout', parent: 'workout' },
    { id: 'schedule-list', href: '/schedules', icon: Calendar, label: 'Schedules', parent: 'schedule' },
    { id: 'add-schedule', href: '/schedules/add', icon: Plus, label: 'Add Schedule', parent: 'schedule' },
    { id: 'members', href: '/members', icon: Users, label: 'Members' },
    { id: 'pending-members', href: '/members/pending', icon: Users, label: 'Pending Members', parent: 'members' },
    { id: 'attendance', href: '/members/attendance', icon: Calendar, label: 'Attendance', parent: 'members' },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-gray-900 text-white
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <Dumbbell className="w-8 h-8 text-blue-500" />
            <span className="font-bold text-lg">Maxfit VIP</span>
          </div>
          <button onClick={onClose} className="lg:hidden">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-73px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-colors duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                  }
                  ${item.parent ? 'pl-8' : ''}
                `}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}