'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit, Trash2, Search, Video } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function WorkoutsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // useEffect(() => {
  //   const currentUser = supabaseApi.getUser();
  //   if (!currentUser) {
  //     router.push('/login');
  //   } else {
  //     setUser(currentUser);
  //     fetchWorkouts();
  //   }
  // }, [router]);

  const fetchWorkouts = async () => {
    try {
      const data = await supabaseApi.getWorkouts();
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this workout?')) {
      try {
        await supabaseApi.deleteWorkout(id);
        fetchWorkouts();
      } catch (error) {
        console.error('Error deleting workout:', error);
        alert('Failed to delete workout');
      }
    }
  };

  const filteredWorkouts = workouts.filter(workout =>
    workout.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workout.workout_type?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h1 className="text-3xl font-bold text-gray-900">Workouts</h1>
              <p className="text-gray-600 mt-1">Manage workout exercises</p>
            </div>
            <Link
              href="/workouts/add"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Workout</span>
            </Link>
          </div>

          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search workouts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkouts.map((workout) => (
              <div key={workout.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      {workout.workout_type?.name || 'General'}
                    </span>
                    <Video className="text-gray-400" size={20} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{workout.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {workout.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Sets: {workout.sets || 0}</span>
                    <span>Reps: {workout.reps || 0}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    Created: {formatDate(workout.created_date)}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/workouts/edit/${workout.id}`}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-center flex items-center justify-center space-x-1"
                    >
                      <Edit size={16} />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(workout.id)}
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

          {filteredWorkouts.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No workouts found</p>
              <Link
                href="/workouts/add"
                className="inline-block mt-4 text-blue-600 hover:text-blue-800"
              >
                Add your first workout
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}