'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, Dumbbell, Calendar, TrendingUp, UserCheck, UserX, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [chartData, setChartData] = useState([]);
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
      const [dashboardStats, sessions] = await Promise.all([
        supabaseApi.getDashboardStats(),
        supabaseApi.getRecentSessions() // Fetch recent usage logs
      ]);
      
      setStats(dashboardStats);
      processChartData(sessions || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  const processChartData = (sessions) => {
    // 1. Create buckets for the last 24 hours
    const hours = {};
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(d.getHours() - i);
      const hourKey = d.toLocaleTimeString([], { hour: '2-digit', hour12: true }); // e.g., "10 AM"
      hours[hourKey] = 0; // Initialize with 0
    }

    // 2. Fill buckets with data
    sessions.forEach(session => {
      if (!session.date) return;
      const date = new Date(session.date);
      const hourKey = date.toLocaleTimeString([], { hour: '2-digit', hour12: true });
      if (hours[hourKey] !== undefined) {
        hours[hourKey]++;
      }
    });

    // 3. Convert to Array for Recharts
    const data = Object.entries(hours).map(([time, count]) => ({
      time,
      users: count
    }));

    setChartData(data);
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

          {/* Real-time Activity Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Activity className="mr-2 text-blue-600" />
                  Real-time App Usage
                </h2>
                <p className="text-sm text-gray-500">Members using the app in the last 24 hours</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="font-medium">Live Updates</span>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    interval={3} // Show every 3rd label to avoid crowding
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#2563EB" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
        </main>
      </div>
    </div>
  );
}