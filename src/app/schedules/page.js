'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit, Trash2, Search, Calendar, Clock, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SchedulesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const currentUser = supabaseApi.getUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      fetchSchedules();
    }
  }, [router]);

  const fetchSchedules = async () => {
    try {
      const data = await supabaseApi.getSchedules();
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to load schedules');
    }
    setLoading(false);
  };

  const handleDelete = async (id, name) => {
    toast((t) => (
      <div className="flex flex-col space-y-3">
        <div>
          <p className="font-semibold text-gray-900">Delete Schedule</p>
          <p className="text-sm text-gray-600 mt-1">
            Are you sure you want to delete <span className="font-semibold text-red-600">{name}</span>?
            This action cannot be undone.
          </p>
        </div>
        <div className="flex space-x-3 pt-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const toastId = toast.loading('Deleting schedule...');
              try {
                await supabaseApi.updateSchedule(id, { is_deleted: true });
                toast.success('Schedule deleted successfully', { id: toastId });
                fetchSchedules();
              } catch (error) {
                console.error('Error deleting schedule:', error);
                toast.error('Failed to delete schedule', { id: toastId });
              }
            }}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
      style: {
        background: '#fff',
        minWidth: '340px',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    });
  };

  const filteredSchedules = schedules.filter(schedule =>
    schedule.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1">
          <TopNav toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} />
          <div className="flex items-center justify-center h-[calc(100vh-64px)]">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-50 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Workout Schedules</h1>
                <p className="text-gray-500 mt-2 text-lg">Manage weekly training plans and routines</p>
              </div>
              <Link
                href="/schedules/add"
                className="group inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white transition-all duration-200 bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Create New Schedule
              </Link>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-lg mb-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={20} />
              </div>
              <input
                type="text"
                placeholder="Search schedules by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
              />
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSchedules.map((schedule) => (
                <div 
                  key={schedule.id} 
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Card Header Decoration */}
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 w-full" />
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
                        <Calendar className="text-blue-600" size={24} />
                      </div>
                      <div className="flex items-center text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                        <Clock size={12} className="mr-1" />
                        {formatDate(schedule.created_date)}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {schedule.name}
                    </h3>
                    
                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10 leading-relaxed">
                      {schedule.description || 'No description provided for this schedule.'}
                    </p>
                    
                    <div className="pt-4 border-t border-gray-50 flex items-center gap-3">
                      <Link
                        href={`/schedules/edit/${schedule.id}`}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm font-medium"
                      >
                        <Edit size={16} className="mr-2" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(schedule.id, schedule.name)}
                        className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-400 rounded-lg hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete Schedule"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredSchedules.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
                <div className="bg-gray-50 p-4 rounded-full mb-4">
                  <Search size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No schedules found</h3>
                <p className="text-gray-500 max-w-sm mb-6">
                  We couldn't find any schedules matching your search. Try creating a new one!
                </p>
                {searchTerm ? (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Clear search
                  </button>
                ) : (
                  <Link
                    href="/schedules/add"
                    className="inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md"
                  >
                    Create your first schedule
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}