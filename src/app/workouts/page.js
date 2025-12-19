'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit, Trash2, Search, Video, Dumbbell, Target, Calendar, Clock,  Image as ImageIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WorkoutsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const currentUser = supabaseApi.getUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      fetchWorkouts();
    }
  }, [router]);

  const fetchWorkouts = async () => {
    try {
      const data = await supabaseApi.getWorkouts();
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      toast.error('Failed to load workouts');
    }
    setLoading(false);
  };

  const handleDelete = async (id, name) => {
    toast((t) => (
      <div className="flex flex-col space-y-3">
        <div>
          <p className="font-semibold text-gray-900">Delete Workout</p>
          <p className="text-sm text-gray-600 mt-1">
            Are you sure you want to delete <span className="font-semibold">{name}</span>?
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const toastId = toast.loading('Deleting workout...');
              try {
                await supabaseApi.deleteWorkout(id);
                toast.success('Workout deleted successfully', { id: toastId });
                fetchWorkouts();
              } catch (error) {
                console.error('Error deleting workout:', error);
                toast.error('Failed to delete workout', { id: toastId });
              }
            }}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
      style: {
        background: '#fff',
        minWidth: '320px',
      },
    });
  };

const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch = 
      workout.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workout.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workout.workout_type?.workout_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || workout.workout_type?.workout_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getWorkoutTypeColor = (type) => {
    switch(type?.toLowerCase()) {
      case 'strength training': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cardio': return 'bg-red-100 text-red-800 border-red-200';
      case 'flexibility': return 'bg-green-100 text-green-800 border-green-200';
      case 'balance': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-100 p-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Workout Library</h1>
                <p className="text-gray-600 flex items-center space-x-2">
                  <Dumbbell size={18} className="text-purple-600" />
                  <span>Create and manage your workout exercises</span>
                </p>
              </div>
              <Link
                href="/workouts/add"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus size={20} />
                <span className="font-semibold">Add Workout</span>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Workouts</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{workouts.length}</p>
                </div>
                <div className="bg-purple-100 p-4 rounded-xl">
                  <Dumbbell className="text-purple-600" size={32} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Cardio</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {workouts.filter(w => w.workout_type?.workout_type?.toLowerCase() === 'cardio').length}
                  </p>
                </div>
                <div className="bg-red-100 p-4 rounded-xl">
                  <Target className="text-red-600" size={32} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Strength</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {workouts.filter(w => w.workout_type?.workout_type?.toLowerCase() === 'strength training').length}
                  </p>
                </div>
                <div className="bg-green-100 p-4 rounded-xl">
                  <Dumbbell className="text-green-600" size={32} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">With Videos</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {workouts.filter(w => w.video_count > 0).length}
                  </p>
                </div>
                <div className="bg-blue-100 p-4 rounded-xl">
                  <Video className="text-blue-600" size={32} />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search workouts by name, type, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-w-[180px] justify-between"
                >
                  <span className="font-medium text-gray-700">
                    {filterType === 'all' ? 'All Types' : filterType}
                  </span>
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10">
                    <button
                      onClick={() => { setFilterType('all'); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${filterType === 'all' ? 'bg-purple-50 text-purple-600 font-semibold' : ''}`}
                    >
                      All Types
                    </button>
                    <button
                      onClick={() => { setFilterType('Strength Training'); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${filterType === 'Strength Training' ? 'bg-purple-50 text-purple-600 font-semibold' : ''}`}
                    >
                      Strength Training
                    </button>
                    <button
                      onClick={() => { setFilterType('Cardio'); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${filterType === 'Cardio' ? 'bg-purple-50 text-purple-600 font-semibold' : ''}`}
                    >
                      Cardio
                    </button>
                    <button
                      onClick={() => { setFilterType('Flexibility'); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${filterType === 'Flexibility' ? 'bg-purple-50 text-purple-600 font-semibold' : ''}`}
                    >
                      Flexibility
                    </button>
                    <button
                      onClick={() => { setFilterType('Balance'); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${filterType === 'Balance' ? 'bg-purple-50 text-purple-600 font-semibold' : ''}`}
                    >
                      Balance
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {searchTerm && (
              <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
                <span>Showing {filteredWorkouts.length} result{filteredWorkouts.length !== 1 ? 's' : ''}</span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Workouts Grid */}
          {filteredWorkouts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkouts.map((workout) => (
                <div 
                  key={workout.id} 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  {/* Image Section */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                    {workout.image_url ? (
                      <>
                        <img
                          src={workout.image_url}
                          alt={workout.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={64} className="text-purple-300" />
                      </div>
                    )}
                    
                    {/* Type Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 backdrop-blur-sm ${getWorkoutTypeColor(workout.workout_type?.workout_type)}`}>
                        {workout.workout_type?.workout_type || 'General'}
                      </span>
                    </div>

                    {/* Video Indicator */}
                    {workout.video_count > 0 && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg">
                        <Video size={14} />
                        <span className="text-xs font-bold">{workout.video_count}</span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors">
                      {workout.name}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
                      {workout.description || 'No description available'}
                    </p>
                    
                    {/* Stats - Conditional based on workout type */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                      {workout.workout_type?.workout_type?.toLowerCase() === 'cardio' || workout.duration > 0 ? (
                        // Duration-based workout (Cardio)
                        <div className="flex items-center space-x-2 text-green-600">
                          <Clock size={16} />
                          <span className="text-sm font-semibold">{workout.duration || 0} min</span>
                        </div>
                      ) : (
                        // Sets-based workout (Strength Training)
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1 text-purple-600">
                            <Target size={16} />
                            <span className="text-sm font-semibold">{workout.sets || 0} Sets</span>
                          </div>
                          <div className="w-px h-4 bg-gray-300" />
                          <div className="flex items-center space-x-1 text-pink-600">
                            <Dumbbell size={16} />
                            <span className="text-sm font-semibold">{workout.reps || 0} Reps</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Date */}
                    <div className="flex items-center text-xs text-gray-500 mb-4">
                      <Calendar size={14} className="mr-1" />
                      <span>Created: {formatDate(workout.created_date)}</span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Link
                        href={`/workouts/edit/${workout.id}`}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-center flex items-center justify-center space-x-2 font-semibold shadow-md hover:shadow-lg"
                      >
                        <Edit size={16} />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(workout.id, workout.name)}
                        className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2.5 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all flex items-center justify-center space-x-2 font-semibold shadow-md hover:shadow-lg"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-6">
                <Dumbbell size={48} className="text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No workouts found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms or filters'
                  : 'Get started by creating your first workout exercise'}
              </p>
              {!searchTerm && (
                <Link
                  href="/workouts/add"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                >
                  <Plus size={20} />
                  <span>Create First Workout</span>
                </Link>
              )}
            </div>
          )}

          {/* Pagination Footer */}
          {filteredWorkouts.length > 0 && (
            <div className="mt-6 flex items-center justify-between bg-white rounded-2xl shadow-lg px-6 py-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredWorkouts.length}</span> of <span className="font-semibold text-gray-900">{workouts.length}</span> workout{workouts.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Active Library</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}