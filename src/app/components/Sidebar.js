'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ClipboardList ,
  Users, 
  Dumbbell, 
  Calendar, 
  Settings,
  ChevronDown,
  ChevronRight,
  Menu, 
  X,
  Trophy,
  UserPlus,
  List,
  Clock
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [isMinimized, setIsMinimized] = useState(false);
  
  const [expandedMenus, setExpandedMenus] = useState({
    admin: true,
    workout: false,
    schedule: false,
    members: true, // Keep members expanded by default
    levels: false,
  });

  const toggleMenu = (menuId) => {
    if (isMinimized) setIsMinimized(false);
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

// In your Sidebar.js, update the menuStructure array to include:

const menuStructure = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard 
  },
  {
    id: 'admin',
    label: 'Admin Management',
    icon: Settings,
    subItems: [
      { label: 'Admin List', href: '/admin', icon: List },
      { label: 'Add Admin', href: '/admin/add', icon: UserPlus },
    ]
  },
  {
    id: 'members',
    label: 'Members',
    icon: Users,
    subItems: [
      { label: 'All Members', href: '/members', icon: List },
      { label: 'Pending Approvals', href: '/members/pending', icon: UserPlus },
      { label: 'Attendance', href: '/members/attendance', icon: Clock },
    ]
  },
  {
    id: 'workout',
    label: 'Workouts',
    icon: Dumbbell,
    subItems: [
      { label: 'Workout List', href: '/workouts', icon: List },
      { label: 'Add Workout', href: '/workouts/add', icon: UserPlus },
    ]
  },
  {
    id: 'schedule',
    label: 'Schedules',
    icon: Calendar,
    subItems: [
      { label: 'Schedule List', href: '/schedules', icon: List },
      { label: 'Add Schedule', href: '/schedules/add', icon: UserPlus },
      { label: 'Assign Schedule', href: '/schedules/assign', icon: ClipboardList }, // NEW ITEM
    ]
  }
];
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        bg-gray-900 text-white
        transition-all duration-300 ease-in-out
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isMinimized ? 'lg:w-20' : 'lg:w-72'}
        w-64
      `}>
        
        {/* Header */}
        <div className={`flex items-center h-16 border-b border-gray-800 ${isMinimized ? 'justify-center' : 'px-4'}`}>
          
          {/* Desktop Toggle Button */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hidden lg:flex p-1 mr-3 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="bg-blue-600 p-2 rounded-lg shrink-0">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            {!isMinimized && (
              <span className="font-bold text-lg whitespace-nowrap transition-opacity duration-300">
                Maxfit VIP
              </span>
            )}
          </div>

          {/* Mobile Close Button */}
          <button onClick={onClose} className="lg:hidden ml-auto text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {menuStructure.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenus[item.id];
            const isActiveParent = hasSubItems && item.subItems.some(sub => pathname === sub.href);
            const isExactActive = pathname === item.href;

            return (
              <div key={item.id} className="mb-2">
                {!hasSubItems ? (
                  <Link
                    href={item.href}
                    onClick={() => { onClose(); }}
                    title={isMinimized ? item.label : ''}
                    className={`
                      flex items-center rounded-lg px-3 py-3 transition-colors duration-200
                      ${isExactActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                      ${isMinimized ? 'justify-center' : ''}
                    `}
                  >
                    <Icon size={20} className="shrink-0" />
                    {!isMinimized && <span className="ml-3 font-medium">{item.label}</span>}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleMenu(item.id)}
                      title={isMinimized ? item.label : ''}
                      className={`
                        w-full flex items-center justify-between rounded-lg px-3 py-3 transition-colors duration-200
                        ${isActiveParent ? 'text-blue-400 bg-gray-800/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                        ${isMinimized ? 'justify-center' : ''}
                      `}
                    >
                      <div className="flex items-center">
                        <Icon size={20} className="shrink-0" />
                        {!isMinimized && <span className="ml-3 font-medium">{item.label}</span>}
                      </div>
                      {!isMinimized && (
                        <div className="ml-auto">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      )}
                    </button>

                    <div className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${(isExpanded && !isMinimized) ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}
                    `}>
                      {item.subItems.map((subItem) => {
                         const isSubActive = pathname === subItem.href;
                         return (
                          <Link
                            // FIX: Use label as unique key instead of href
                            key={subItem.label} 
                            href={subItem.href}
                            onClick={onClose}
                            className={`
                              flex items-center pl-10 pr-3 py-2 my-1 rounded-lg text-sm transition-colors
                              ${isSubActive ? 'bg-gray-800 text-blue-400' : 'text-gray-500 hover:text-gray-300'}
                            `}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-50"></span>
                            <span>{subItem.label}</span>
                          </Link>
                         );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
}