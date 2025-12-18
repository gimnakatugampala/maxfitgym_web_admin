'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, Dumbbell, Calendar, TrendingUp, UserCheck, UserX } from 'lucide-react';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    totalWorkouts: 0,
    totalSchedules: 0,
    todayAttendance: 0,
  });
  const router = useRouter();

  useEffect(() => {
    const currentUser = supabaseApi.getUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      fetchDashboardData();
    }
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const dashboardStats = await supabaseApi.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1">
          <TopNav toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} />
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      link: '/members',
    },
    {
      title: 'Active Members',
      value: stats.activeMembers,
      icon: UserCheck,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      link: '/members',
    },
    {
      title: 'Pending Members',
      value: stats.pendingMembers,
      icon: UserX,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      link: '/members/pending',
    },
    {
      title: 'Total Workouts',
      value: stats.totalWorkouts,
      icon: Dumbbell,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      link: '/workouts',
    },
    {
      title: 'Total Schedules',
      value: stats.totalSchedules,
      icon: Calendar,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      link: '/schedules',
    },
    {
      title: "Today's Attendance",
      value: stats.todayAttendance,
      icon: TrendingUp,
      color: 'bg-pink-500',
      textColor: 'text-pink-600',
      link: '/members/attendance',
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div 
                  key={index} 
                  onClick={() => router.push(card.link)}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                    </div>
                    <div className={`${card.color} p-4 rounded-lg`}>
                      <Icon className="text-white" size={32} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-sm">
                      <TrendingUp size={16} className={card.textColor} />
                      <span className="ml-1 text-gray-600">View Details</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/admin/add')}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
              >
                <Users className="text-blue-600 mb-3" size={32} />
                <h3 className="font-semibold text-gray-900">Add Admin</h3>
                <p className="text-sm text-gray-600 mt-1">Create new admin user</p>
              </button>
              
              <button
                onClick={() => router.push('/workouts/add')}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
              >
                <Dumbbell className="text-purple-600 mb-3" size={32} />
                <h3 className="font-semibold text-gray-900">Add Workout</h3>
                <p className="text-sm text-gray-600 mt-1">Create new workout</p>
              </button>
              
              <button
                onClick={() => router.push('/schedules/add')}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
              >
                <Calendar className="text-indigo-600 mb-3" size={32} />
                <h3 className="font-semibold text-gray-900">Add Schedule</h3>
                <p className="text-sm text-gray-600 mt-1">Create workout schedule</p>
              </button>
              
              <button
                onClick={() => router.push('/members/pending')}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
              >
                <UserCheck className="text-green-600 mb-3" size={32} />
                <h3 className="font-semibold text-gray-900">Pending Members</h3>
                <p className="text-sm text-gray-600 mt-1">Review applications</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-center py-8">No recent activity to display</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}