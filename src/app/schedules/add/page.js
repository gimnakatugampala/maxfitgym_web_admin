'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Save, ArrowLeft, Search, GripVertical, Plus, Trash2, Calendar, Dumbbell, Clock, AlertCircle, Coffee, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
  
  // Schedule state: { "Monday": [workout1, ...], "Tuesday": [] }
  const [schedule, setSchedule] = useState({});
  // Rest Days state: { "Monday": false, "Tuesday": true }
  const [restDays, setRestDays] = useState({});

  const [draggedWorkout, setDraggedWorkout] = useState(null);
  const [draggedFromDay, setDraggedFromDay] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
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

  useEffect(() => {
    // Initialize empty schedule and rest days
    const initialSchedule = {};
    const initialRestDays = {};
    DAYS.forEach(day => {
      initialSchedule[day] = [];
      initialRestDays[day] = false;
    });
    setSchedule(initialSchedule);
    setRestDays(initialRestDays);
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Toggle Rest Day Logic
  const toggleRestDay = (day) => {
    setRestDays(prev => {
      const isResting = !prev[day];
      
      // If turning ON rest day, clear workouts for that day
      if (isResting) {
        setSchedule(prevSched => ({
          ...prevSched,
          [day]: [] // Clear workouts
        }));
      }
      
      return { ...prev, [day]: isResting };
    });
  };

  const isCardioWorkout = (workout) => {
    const workoutType = workout.workout_type?.workout_type?.toLowerCase();
    if (workoutType === 'cardio' || workoutType === 'duration') return true;
    if (workout.duration >= 0 && workout.sets === 0 && workout.reps === 0) return true;
    return false;
  };

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e, workout) => {
    setDraggedWorkout(workout);
    setDraggedFromDay(null);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleScheduleDragStart = (e, workout, day, index) => {
    setDraggedWorkout(workout);
    setDraggedFromDay(day);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedFromDay ? 'move' : 'copy';
  };

  const handleDrop = (e, day) => {
    e.preventDefault();
    
    // Block drop if it's a rest day
    if (restDays[day]) return;

    if (draggedWorkout) {
      if (draggedFromDay) {
        if (draggedFromDay === day) return;
        
        const workoutToMove = { ...draggedWorkout };
        setSchedule(prev => ({
          ...prev,
          [draggedFromDay]: prev[draggedFromDay].filter(w => w.id !== draggedWorkout.id),
          [day]: [...(prev[day] || []), workoutToMove]
        }));
      } else {
        const newWorkout = {
          id: Date.now(),
          workout_id: draggedWorkout.id,
          workout_name: draggedWorkout.name,
          sets: draggedWorkout.sets || 0,
          reps: draggedWorkout.reps || 0,
          duration: draggedWorkout.duration || 0,
          workout_type: draggedWorkout.workout_type,
          image_url: draggedWorkout.image_url,
        };
        
        setSchedule(prev => ({
          ...prev,
          [day]: [...(prev[day] || []), newWorkout]
        }));
      }
      
      setDraggedWorkout(null);
      setDraggedFromDay(null);
      setDraggedIndex(null);
    }
  };

  const handleDropOnWorkout = (e, day, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Block drop if it's a rest day
    if (restDays[day]) return;

    if (draggedWorkout && draggedFromDay === day && draggedIndex !== null) {
      const dayWorkouts = [...schedule[day]];
      const [movedWorkout] = dayWorkouts.splice(draggedIndex, 1);
      dayWorkouts.splice(targetIndex, 0, movedWorkout);
      
      setSchedule(prev => ({
        ...prev,
        [day]: dayWorkouts
      }));
    }
    
    setDraggedWorkout(null);
    setDraggedFromDay(null);
    setDraggedIndex(null);
  };

  const removeWorkout = (day, workoutId) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter(w => w.id !== workoutId)
    }));
  };

  const updateWorkout = (day, workoutId, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].map(w => {
        if (w.id === workoutId) {
          if (value === '' || value === null) return { ...w, [field]: 0 };
          const numValue = parseInt(value, 10);
          if (isNaN(numValue)) return { ...w, [field]: 0 };
          return { ...w, [field]: numValue };
        }
        return w;
      })
    }));
  };

  const resetSchedule = () => {
    if (window.confirm('Are you sure you want to reset the entire schedule?')) {
      const emptySchedule = {};
      const emptyRestDays = {};
      DAYS.forEach(day => {
        emptySchedule[day] = [];
        emptyRestDays[day] = false;
      });
      setSchedule(emptySchedule);
      setRestDays(emptyRestDays);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Schedule name is required';
    
    // Calculate total workouts ignoring rest days
    const totalWorkouts = Object.values(schedule).reduce((sum, day) => sum + (day?.length || 0), 0);
    
    // It's valid to have a schedule with just rest days? Probably not helpful, but technically allowed. 
    // Usually we want at least 1 workout in the whole week.
    if (totalWorkouts === 0) {
      newErrors.workouts = 'Add at least one workout to the schedule (non-rest days)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSaving(true);
    const toastId = toast.loading('Creating schedule...');
    try {
      const scheduleData = {
        name: formData.name,
        description: formData.description,
        is_deleted: false,
      };
      
      const createdSchedule = await supabaseApi.createSchedule(scheduleData);
      const scheduleId = createdSchedule[0].id;
      
      // Add workouts to schedule
      for (const day of DAYS) {
        // If it's a rest day, we simply skip adding workouts for this day.
        // The DB doesn't have an is_rest_day column for the master schedule details,
        // so "Rest Day" effectively means "No Data" for that day.
        if (restDays[day]) continue; 

        const dayWorkouts = schedule[day] || [];
        
        for (let i = 0; i < dayWorkouts.length; i++) {
          const workout = dayWorkouts[i];
          
          await supabaseApi.createScheduleDetail({
            schedule_id: scheduleId,
            workout_id: workout.workout_id,
            day: day,
            order_index: i + 1,
            set_no: workout.sets.toString(),
            rep_no: workout.reps.toString(),
            duration_minutes: workout.duration.toString(),
            is_deleted: false,
          });
        }
      }
      
      toast.success('Schedule created successfully!', { id: toastId });
      router.push('/schedules');
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error(error.message || 'Failed to create schedule', { id: toastId });
    }
    setSaving(false);
  };

  const filteredWorkouts = workouts?.filter(w =>
    w.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalWorkouts = Object.values(schedule).reduce((sum, day) => sum + (day?.length || 0), 0);

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
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Link
                href="/schedules"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                <span className="font-medium">Back to Schedules</span>
              </Link>
              
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">Create Workout Schedule</h1>
                    <p className="text-gray-600 mt-1">Drag and drop workouts or set days as "Rest" days</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total Workouts</div>
                    <div className="text-3xl font-bold text-blue-600">{totalWorkouts}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Name Input */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-3">
                    Schedule Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 ${
                      errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="e.g., Beginner Full Body Workout, Advanced Strength Training"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-2 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-3">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Describe the schedule..."
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Workout List Sidebar */}
              <div className="lg:col-span-4">
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Available Workouts</h2>
                  
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Search workouts..."
                    />
                  </div>

                  {/* Workout Cards */}
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {filteredWorkouts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Dumbbell size={48} className="mx-auto mb-3 text-gray-300" />
                        <p>No workouts found</p>
                      </div>
                    ) : (
                      filteredWorkouts.map(workout => (
                        <div
                          key={workout.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, workout)}
                          className="flex items-center space-x-3 p-3 border-2 border-blue-200 rounded-xl bg-blue-50 cursor-grab hover:shadow-md hover:border-blue-400 transition-all active:cursor-grabbing"
                        >
                          <GripVertical size={20} className="text-gray-400 flex-shrink-0" />
                          {workout.image_url ? (
                            <img
                              src={workout.image_url}
                              alt={workout.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                              <Dumbbell size={24} className="text-purple-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{workout.name}</p>
                            <p className="text-sm text-gray-600">
                              {isCardioWorkout(workout) 
                                ? `${workout.duration} min` 
                                : `${workout.sets} sets × ${workout.reps} reps`
                              }
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Weekly Schedule Grid */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Weekly Schedule</h2>
                    <button
                      type="button"
                      onClick={resetSchedule}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                    >
                      Reset All
                    </button>
                  </div>

                  {errors.workouts && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center">
                      <AlertCircle size={16} className="mr-2" />
                      {errors.workouts}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    {DAYS.map(day => (
                      <div 
                        key={day} 
                        className={`border-2 rounded-xl overflow-hidden transition-all ${
                          restDays[day] ? 'border-green-200 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        {/* Day Header */}
                        <div className={`px-4 py-3 flex items-center justify-between ${
                          restDays[day] 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <h3 className="font-bold text-white text-lg">{day}</h3>
                            {restDays[day] && (
                              <span className="bg-white bg-opacity-20 text-white px-2 py-0.5 rounded text-xs font-semibold flex items-center">
                                <Coffee size={12} className="mr-1" /> Rest Day
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {!restDays[day] && (
                              <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                {schedule[day]?.length || 0} workouts
                              </span>
                            )}
                            
                            {/* Rest Day Toggle */}
                            <label className="flex items-center cursor-pointer bg-black bg-opacity-20 rounded-lg px-2 py-1 hover:bg-opacity-30 transition-all">
                              <input 
                                type="checkbox" 
                                className="hidden"
                                checked={restDays[day] || false}
                                onChange={() => toggleRestDay(day)}
                              />
                              <div className={`w-4 h-4 rounded-full border-2 border-white mr-2 flex items-center justify-center ${
                                restDays[day] ? 'bg-white' : 'bg-transparent'
                              }`}>
                                {restDays[day] && <CheckCircle size={10} className="text-green-600" />}
                              </div>
                              <span className="text-white text-xs font-medium">Rest Day</span>
                            </label>
                          </div>
                        </div>

                        {/* Drop Zone or Rest Message */}
                        {restDays[day] ? (
                          <div className="p-6 flex flex-col items-center justify-center text-green-700 min-h-[120px]">
                            <Coffee size={32} className="mb-2 opacity-50" />
                            <p className="font-semibold">Recovery Day</p>
                            <p className="text-xs opacity-75">No workouts scheduled</p>
                          </div>
                        ) : (
                          <div
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, day)}
                            className={`p-4 min-h-[120px] ${
                              schedule[day]?.length === 0
                                ? 'bg-gray-50 border-2 border-dashed border-gray-300'
                                : 'bg-white'
                            }`}
                          >
                            {schedule[day]?.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                                <Plus size={32} className="mb-2" />
                                <p className="text-sm font-medium">Drag workouts here</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {(schedule[day] || []).map((workout, index) => (
                                  <div
                                    key={workout.id}
                                    draggable
                                    onDragStart={(e) => handleScheduleDragStart(e, workout, day, index)}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onDrop={(e) => handleDropOnWorkout(e, day, index)}
                                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-400 transition-all group cursor-move"
                                  >
                                    {/* Drag Handle */}
                                    <div className="flex-shrink-0 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                                      <GripVertical size={20} />
                                    </div>
                                    
                                    {/* Order Number Badge */}
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                      {index + 1}
                                    </div>
                                    
                                    {workout.image_url ? (
                                      <img
                                        src={workout.image_url}
                                        alt={workout.workout_name}
                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                                        <Dumbbell size={24} className="text-purple-600" />
                                      </div>
                                    )}
                                    
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900">{workout.workout_name}</p>
                                      
                                      {/* Conditional inputs based on workout type */}
                                      {isCardioWorkout(workout) ? (
                                        // Duration input for cardio
                                        <div className="flex items-center space-x-2 mt-2">
                                          <Clock size={16} className="text-green-600" />
                                          <label className="text-xs text-gray-600 font-medium">Duration:</label>
                                          <input
                                            type="number"
                                            value={workout.duration || ''}
                                            onChange={(e) => updateWorkout(day, workout.id, 'duration', e.target.value)}
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                            min="0"
                                            placeholder="0"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-xs text-gray-600">min</span>
                                        </div>
                                      ) : (
                                        // Sets and Reps inputs for strength training
                                        <div className="flex items-center space-x-3 mt-2">
                                          <div className="flex items-center space-x-2">
                                            <label className="text-xs text-gray-600 font-medium">Sets:</label>
                                            <input
                                              type="number"
                                              value={workout.sets || ''}
                                              onChange={(e) => updateWorkout(day, workout.id, 'sets', e.target.value)}
                                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              min="0"
                                              placeholder="0"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <label className="text-xs text-gray-600 font-medium">Reps:</label>
                                            <input
                                              type="number"
                                              value={workout.reps || ''}
                                              onChange={(e) => updateWorkout(day, workout.id, 'reps', e.target.value)}
                                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              min="0"
                                              placeholder="0"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => removeWorkout(day, workout.id)}
                                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                <span>{saving ? 'Creating Schedule...' : 'Create Schedule'}</span>
              </button>
              <Link
                href="/schedules"
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-xl hover:bg-gray-300 transition-all flex items-center justify-center font-semibold"
              >
                Cancel
              </Link>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">💡 Tips:</span>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-700">
                <li>• Toggle <strong>"Rest Day"</strong> to block workouts for that specific day.</li>
                <li>• Drag workouts from the left sidebar and drop them onto any active day.</li>
                <li>• Drag workouts within a day to reorder them.</li>
                <li>• Remove workouts by clicking the trash icon that appears on hover.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}