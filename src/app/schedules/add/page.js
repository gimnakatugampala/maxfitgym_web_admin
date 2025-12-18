'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Save, ArrowLeft, Plus, X, Search } from 'lucide-react';
import Link from 'next/link';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AddSchedulePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [scheduleWorkouts, setScheduleWorkouts] = useState([]);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
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
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddWorkout = (day) => {
    setSelectedDay(day);
    setShowWorkoutModal(true);
  };

  const handleSelectWorkout = (workout) => {
    const newWorkout = {
      id: Date.now(),
      day: selectedDay,
      workout_id: workout.id,
      workout_name: workout.name,
      sets: workout.sets,
      reps: workout.reps,
    };
    setScheduleWorkouts([...scheduleWorkouts, newWorkout]);
    setShowWorkoutModal(false);
    setSearchTerm('');
  };

  const handleRemoveWorkout = (id) => {
    setScheduleWorkouts(scheduleWorkouts.filter(w => w.id !== id));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Schedule name is required';
    }
    
    if (scheduleWorkouts.length === 0) {
      newErrors.workouts = 'Add at least one workout to the schedule';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }
    
    setSaving(true);
    try {
      const scheduleData = {
        name: formData.name,
        description: formData.description,
        is_deleted: false,
      };
      
      const schedule = await supabaseApi.createSchedule(scheduleData);
      
      // Add workouts to schedule
      for (const workout of scheduleWorkouts) {
        await supabaseApi.createScheduleDetail({
          schedule_id: schedule[0].id,
          workout_id: workout.workout_id,
          day: workout.day,
          is_deleted: false,
        });
      }
      
      alert('Schedule created successfully!');
      router.push('/schedules');
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create schedule: ' + error.message);
    }
    setSaving(false);
  };

  const filteredWorkouts = workouts.filter(workout =>
    workout.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <div className="mb-6">
            <Link
              href="/schedules"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft size={20} className="mr-1" />
              Back to Schedules
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Add New Schedule</h1>
            <p className="text-gray-600 mt-1">Create a new workout schedule</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Schedule Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="e.g., Beginner Full Body Workout"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the schedule..."
                  />
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Schedule</h2>
                {errors.workouts && (
                  <p className="text-red-500 text-sm mb-4">{errors.workouts}</p>
                )}
                <div className="space-y-4">
                  {DAYS.map((day) => {
                    const dayWorkouts = scheduleWorkouts.filter(w => w.day === day);
                    return (
                      <div key={day} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">{day}</h3>
                          <button
                            type="button"
                            onClick={() => handleAddWorkout(day)}
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
                          >
                            <Plus size={16} />
                            <span>Add Workout</span>
                          </button>
                        </div>
                        
                        {dayWorkouts.length > 0 ? (
                          <div className="space-y-2">
                            {dayWorkouts.map((workout) => (
                              <div key={workout.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                <div>
                                  <p className="font-medium text-gray-900">{workout.workout_name}</p>
                                  <p className="text-sm text-gray-600">
                                    {workout.sets} sets × {workout.reps} reps
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWorkout(workout.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X size={20} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No workouts added</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center space-x-2"
                >
                  <Save size={20} />
                  <span>{saving ? 'Creating...' : 'Create Schedule'}</span>
                </button>
                <Link
                  href="/schedules"
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Workout Selection Modal */}
      {showWorkoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Select Workout for {selectedDay}</h3>
                <button
                  onClick={() => {
                    setShowWorkoutModal(false);
                    setSearchTerm('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="relative">
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
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
              <div className="space-y-2">
                {filteredWorkouts.map((workout) => (
                  <button
                    key={workout.id}
                    type="button"
                    onClick={() => handleSelectWorkout(workout)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{workout.name}</h4>
                    <p className="text-sm text-gray-600">
                      {workout.sets} sets × {workout.reps} reps
                    </p>
                    {workout.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {workout.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
              {filteredWorkouts.length === 0 && (
                <p className="text-center text-gray-500 py-8">No workouts found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}