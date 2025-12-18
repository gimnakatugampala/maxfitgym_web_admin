'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit, Trash2, Search, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SchedulesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // useEffect(() => {
  //   const currentUser = supabaseApi.getUser();
  //   if (!currentUser) {
  //     router.push('/login');
  //   } else {
  //     setUser(currentUser);
  //     fetchSchedules();
  //   }
  // }, [router]);

  const fetchSchedules = async () => {
    try {
      const data = await supabaseApi.getSchedules();
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      try {
        await supabaseApi.updateSchedule(id, { is_deleted: true });
        fetchSchedules();
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Failed to delete schedule');
      }
    }
  };

  const filteredSchedules = schedules.filter(schedule =>
    schedule.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Workout Schedules</h1>
              <p className="text-gray-600 mt-1">Manage workout schedules</p>
            </div>
            <Link
              href="/schedules/add"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Schedule</span>
            </Link>
          </div>

          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search schedules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchedules.map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="text-indigo-600" size={32} />
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                      Schedule
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{schedule.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {schedule.description || 'No description available'}
                  </p>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    Created: {formatDate(schedule.created_date)}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/schedules/edit/${schedule.id}`}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-center flex items-center justify-center space-x-1"
                    >
                      <Edit size={16} />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center space-x-1"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSchedules.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No schedules found</p>
              <Link
                href="/schedules/add"
                className="inline-block mt-4 text-blue-600 hover:text-blue-800"
              >
                Create your first schedule
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}