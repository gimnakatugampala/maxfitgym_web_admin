'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import { 
  Save, 
  UserPlus, 
  Calendar, 
  Users, 
  ClipboardList, 
  Search,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Target,
  PlayCircle,
  Edit3,
  X,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Timer,
  Coffee,
  CheckCircle,
  Plus,
  GripVertical
} from 'lucide-react';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getStatusColor = (assignment) => {
  const today = new Date();
  const startDate = new Date(assignment.start_date);
  const endDate = assignment.end_date ? new Date(assignment.end_date) : null;
  
  if (endDate && today > endDate) {
    return 'bg-slate-100 text-slate-600 border-slate-200';
  } else if (today < startDate) {
    return 'bg-blue-100 text-blue-700 border-blue-200';
  } else {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
};

const getStatusText = (assignment) => {
  const today = new Date();
  const startDate = new Date(assignment.start_date);
  const endDate = assignment.end_date ? new Date(assignment.end_date) : null;
  
  if (endDate && today > endDate) {
    return 'COMPLETED';
  } else if (today < startDate) {
    return 'UPCOMING';
  } else {
    return 'ACTIVE';
  }
};

export default function AssignWorkoutSchedulePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [members, setMembers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [searchMember, setSearchMember] = useState('');
  const [searchAssignment, setSearchAssignment] = useState('');
  const [searchWorkout, setSearchWorkout] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Customization states
  const [showCustomization, setShowCustomization] = useState(false);
  const [scheduleDetails, setScheduleDetails] = useState([]);
  const [expandedDays, setExpandedDays] = useState({});
  const [restDays, setRestDays] = useState({});
  
  // Drag and drop states
  const [draggedWorkout, setDraggedWorkout] = useState(null);
  const [draggedFromDay, setDraggedFromDay] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  const [formData, setFormData] = useState({
    member_id: '',
    schedule_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });
  const [errors, setErrors] = useState({});
  const router = useRouter();

  useEffect(() => {
    const currentUser = supabaseApi.getUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      fetchData();
    }
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersData, schedulesData, assignmentsData, workoutsData] = await Promise.all([
        supabaseApi.getActiveMembers(),
        supabaseApi.getSchedules(),
        supabaseApi.getAllAssignments(),
        supabaseApi.getWorkouts(),
      ]);
      
      setMembers(membersData || []);
      setSchedules(schedulesData || []);
      setWorkouts(workoutsData || []);
      
      const processedAssignments = (assignmentsData || []).map(assignment => ({
        ...assignment,
        work_schedule: assignment.schedule || { name: 'Unknown Schedule' },
        members: assignment.members || { first_name: 'Unknown', last_name: 'Member', membership_id: 'N/A' }
      }));
      
      setAssignments(processedAssignments);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
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

  const handleScheduleChange = async (e) => {
    const scheduleId = e.target.value;
    handleChange(e);
    
    if (scheduleId) {
      await loadScheduleDetails(scheduleId);
    } else {
      setScheduleDetails([]);
      setShowCustomization(false);
    }
  };

  const loadScheduleDetails = async (scheduleId) => {
    try {
      setLoadingSchedule(true);
      const details = await supabaseApi.getScheduleDetails(scheduleId);
      
      // Initialize rest days state
      const initialRestDays = {};
      DAYS.forEach(day => {
        initialRestDays[day] = details.some(d => d.day === day && d.is_rest_day);
      });
      setRestDays(initialRestDays);
      
      // Group by day and organize
      const organized = DAYS.map(day => ({
        day,
        workouts: (details || [])
          .filter(d => d.day === day && !d.is_rest_day)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          .map(d => ({
            id: Date.now() + Math.random(),
            workout_id: d.workout_id,
            workout_name: d.workout?.name || 'Unknown',
            original_sets: d.set_no ? parseInt(d.set_no) : 0,
            original_reps: d.rep_no ? parseInt(d.rep_no) : 0,
            original_duration: d.duration_minutes ? parseInt(d.duration_minutes) : 0,
            sets: d.set_no ? parseInt(d.set_no) : 0,
            reps: d.rep_no ? parseInt(d.rep_no) : 0,
            duration: d.duration_minutes ? parseInt(d.duration_minutes) : 0,
            order_index: d.order_index,
            is_cardio: d.duration_minutes > 0,
            workout_type: d.workout?.workout_type,
            image_url: d.workout?.image_url,
          })),
        is_rest_day: initialRestDays[day]
      }));
      
      setScheduleDetails(organized);
      setShowCustomization(true);
    } catch (error) {
      console.error('Error loading schedule details:', error);
      toast.error('Failed to load schedule details');
    }
    setLoadingSchedule(false);
  };

  // Helper to check if workout is cardio
  const isCardioWorkout = (workout) => {
    const workoutType = workout.workout_type?.workout_type?.toLowerCase();
    if (workoutType === 'cardio' || workoutType === 'duration') return true;
    if (workout.duration >= 0 && workout.sets === 0 && workout.reps === 0) return true;
    return false;
  };

  // Toggle Rest Day Logic
  const toggleRestDay = (day) => {
    setRestDays(prev => {
      const isResting = !prev[day];
      
      // If turning ON rest day, clear workouts for that day
      if (isResting) {
        setScheduleDetails(prevSched => 
          prevSched.map(d => d.day === day ? { ...d, workouts: [] } : d)
        );
      }
      
      return { ...prev, [day]: isResting };
    });
  };

  // Drag and Drop Handlers
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
    
    // Prevent dropping on a Rest Day
    if (restDays[day]) {
      toast.error(`Cannot add workouts to ${day} (Rest Day)`);
      return;
    }

    if (draggedWorkout) {
      if (draggedFromDay) {
        // Moving from another day
        if (draggedFromDay === day) return;
        
        const workoutToMove = { ...draggedWorkout };
        setScheduleDetails(prev => prev.map(dayData => {
          if (dayData.day === draggedFromDay) {
            return {
              ...dayData,
              workouts: dayData.workouts.filter(w => w.id !== draggedWorkout.id)
            };
          }
          if (dayData.day === day) {
            return {
              ...dayData,
              workouts: [...dayData.workouts, workoutToMove]
            };
          }
          return dayData;
        }));
      } else {
        // Adding new workout from list
        const originalWorkout = workouts.find(w => w.id === draggedWorkout.id);
        const newWorkout = {
          id: Date.now() + Math.random(),
          workout_id: draggedWorkout.id,
          workout_name: draggedWorkout.name,
          sets: draggedWorkout.sets || 0,
          reps: draggedWorkout.reps || 0,
          duration: draggedWorkout.duration || 0,
          workout_type: draggedWorkout.workout_type,
          image_url: draggedWorkout.image_url,
          is_cardio: isCardioWorkout(draggedWorkout),
          original_sets: draggedWorkout.sets || 0,
          original_reps: draggedWorkout.reps || 0,
          original_duration: draggedWorkout.duration || 0,
        };
        
        setScheduleDetails(prev => prev.map(dayData => {
          if (dayData.day === day) {
            return {
              ...dayData,
              workouts: [...dayData.workouts, newWorkout]
            };
          }
          return dayData;
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
    
    if (restDays[day]) return;

    if (draggedWorkout && draggedFromDay === day && draggedIndex !== null) {
      setScheduleDetails(prev => prev.map(dayData => {
        if (dayData.day === day) {
          const dayWorkouts = [...dayData.workouts];
          const [movedWorkout] = dayWorkouts.splice(draggedIndex, 1);
          dayWorkouts.splice(targetIndex, 0, movedWorkout);
          return { ...dayData, workouts: dayWorkouts };
        }
        return dayData;
      }));
    }
    
    setDraggedWorkout(null);
    setDraggedFromDay(null);
    setDraggedIndex(null);
  };

  const updateWorkoutDetail = (day, workoutId, field, value) => {
    setScheduleDetails(prev => prev.map(dayData => {
      if (dayData.day === day) {
        return {
          ...dayData,
          workouts: dayData.workouts.map(w => 
            w.id === workoutId ? { ...w, [field]: parseInt(value) || 0 } : w
          )
        };
      }
      return dayData;
    }));
  };

  const removeWorkout = (day, workoutId) => {
    setScheduleDetails(prev => prev.map(dayData => {
      if (dayData.day === day) {
        return {
          ...dayData,
          workouts: dayData.workouts.filter(w => w.id !== workoutId)
        };
      }
      return dayData;
    }));
  };

  const resetWorkout = (day, workoutId) => {
    setScheduleDetails(prev => prev.map(dayData => {
      if (dayData.day === day) {
        return {
          ...dayData,
          workouts: dayData.workouts.map(w => 
            w.id === workoutId 
              ? { 
                  ...w, 
                  sets: w.original_sets, 
                  reps: w.original_reps, 
                  duration: w.original_duration 
                } 
              : w
          )
        };
      }
      return dayData;
    }));
  };

  const toggleDayExpanded = (day) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.member_id) {
      newErrors.member_id = 'Please select a member';
    }
    
    if (!formData.schedule_id) {
      newErrors.schedule_id = 'Please select a workout schedule';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    
    if (formData.end_date && formData.start_date) {
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        newErrors.end_date = 'End date must be after start date';
      }
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
    const toastId = toast.loading('Assigning customized schedule...');
    
    try {
      // Step 1: Create the assignment
      const assignmentData = {
        member_id: parseInt(formData.member_id),
        schedule_id: parseInt(formData.schedule_id),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        is_active: true,
      };
      
      const assignment = await supabaseApi.assignScheduleToMember(assignmentData);
      const memberScheduleId = assignment[0].id;
      
      // Step 2: Create customized details for each day
      for (const dayData of scheduleDetails) {
        // Handle Rest Days
        if (restDays[dayData.day] || (dayData.is_rest_day && dayData.workouts.length === 0)) {
          await supabaseApi.createMemberScheduleDetail({
            member_schedule_id: memberScheduleId,
            schedule_detail_id: null,
            is_rest_day: true,
            completed: false,
            order_index: '1',
            set_no: null,
            rep_no: null,
            duration_minutes: null,
          });
          continue;
        }

        // Handle Workout Days
        for (let i = 0; i < dayData.workouts.length; i++) {
          const workout = dayData.workouts[i];
          
          await supabaseApi.createMemberScheduleDetail({
            member_schedule_id: memberScheduleId,
            schedule_detail_id: workout.id,
            set_no: workout.sets.toString(),
            rep_no: workout.reps.toString(),
            duration_minutes: workout.duration.toString(),
            order_index: (i + 1).toString(),
            is_rest_day: false,
            completed: false
          });
        }
      }
      
      toast.success('Customized schedule assigned successfully!', { id: toastId });
      
      // Reset form
      setFormData({
        member_id: '',
        schedule_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
      });
      setScheduleDetails([]);
      setRestDays({});
      setShowCustomization(false);
      
      // Refresh assignments
      fetchData();
    } catch (error) {
      console.error('Error assigning schedule:', error);
      toast.error(error.message || 'Failed to assign schedule', { id: toastId });
    }
    setSaving(false);
  };

  const handleDeleteAssignment = async (id, memberName, scheduleName) => {
    toast((t) => (
      <div className="flex flex-col space-y-3">
        <div>
          <p className="font-semibold text-gray-900">Remove Assignment</p>
          <p className="text-sm text-gray-600 mt-1">
            Remove schedule <span className="font-semibold">"{scheduleName}"</span> from{' '}
            <span className="font-semibold">{memberName}</span>?
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const toastId = toast.loading('Removing assignment...');
              try {
                await supabaseApi.deleteAssignment(id);
                toast.success('Assignment removed successfully', { id: toastId });
                fetchData();
              } catch (error) {
                console.error('Error removing assignment:', error);
                toast.error('Failed to remove assignment', { id: toastId });
              }
            }}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
          >
            Remove
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

  const filteredMembers = members.filter(member =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchMember.toLowerCase()) ||
    member.membership_id?.toLowerCase().includes(searchMember.toLowerCase())
  );

  const filteredWorkouts = workouts?.filter(w =>
    w.name?.toLowerCase().includes(searchWorkout.toLowerCase())
  ) || [];

  const filteredAssignments = assignments.filter(assignment => {
    const memberName = `${assignment.members?.first_name} ${assignment.members?.last_name}`.toLowerCase();
    const scheduleName = assignment.work_schedule?.name?.toLowerCase() || '';
    const search = searchAssignment.toLowerCase();
    const matchesSearch = memberName.includes(search) || scheduleName.includes(search);
    
    if (filterStatus === 'all') return matchesSearch;
    
    const status = getStatusText(assignment).toLowerCase();
    const matchesFilter = status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const activeCount = assignments.filter(a => getStatusText(a) === 'ACTIVE').length;
  const completedCount = assignments.filter(a => getStatusText(a) === 'COMPLETED').length;
  const upcomingCount = assignments.filter(a => getStatusText(a) === 'UPCOMING').length;

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
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
          <div className="p-6 lg:p-8">
            
            {/* Enhanced Header with Stats */}
            <div className="mb-8">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-indigo-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/5 to-pink-500/5 rounded-full blur-3xl -ml-24 -mb-24"></div>
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-4 rounded-2xl shadow-lg shadow-indigo-500/20">
                        <ClipboardList className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                          Schedule Assignments
                        </h1>
                        <p className="text-slate-600 mt-2 text-lg">
                          Assign and customize workout plans for members
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-emerald-700 text-sm font-semibold uppercase tracking-wide">Active</p>
                          <p className="text-4xl font-bold text-emerald-900 mt-2">{activeCount}</p>
                        </div>
                        <div className="bg-emerald-100 p-3 rounded-xl">
                          <PlayCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-5 border border-slate-200/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide">Completed</p>
                          <p className="text-4xl font-bold text-slate-800 mt-2">{completedCount}</p>
                        </div>
                        <div className="bg-slate-100 p-3 rounded-xl">
                          <CheckCircle2 className="w-6 h-6 text-slate-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-200/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-indigo-700 text-sm font-semibold uppercase tracking-wide">Total</p>
                          <p className="text-4xl font-bold text-indigo-900 mt-2">{assignments.length}</p>
                        </div>
                        <div className="bg-indigo-100 p-3 rounded-xl">
                          <TrendingUp className="w-6 h-6 text-indigo-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              
              {/* Workout List Sidebar - Show when customizing */}
              {showCustomization && (
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-3xl shadow-xl p-6 sticky top-6 border border-slate-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Available Workouts</h2>
                    
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={searchWorkout}
                        onChange={(e) => setSearchWorkout(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Search workouts..."
                      />
                    </div>

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
                            className="flex items-center space-x-3 p-3 border-2 border-indigo-200 rounded-xl bg-indigo-50 cursor-grab hover:shadow-md hover:border-indigo-400 transition-all active:cursor-grabbing"
                          >
                            <GripVertical size={20} className="text-gray-400 flex-shrink-0" />
                            {workout.image_url ? (
                              <img src={workout.image_url} alt={workout.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                                <Dumbbell size={24} className="text-purple-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{workout.name}</p>
                              <p className="text-sm text-gray-600">
                                {isCardioWorkout(workout) 
                                  ? `${workout.duration || 0} min` 
                                  : `${workout.sets} sets × ${workout.reps} reps`}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Assignment Form */}
              <div className={`${showCustomization ? 'lg:col-span-6' : 'lg:col-span-8'} bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transition-all`}>
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 px-8 py-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                      <UserPlus size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">New Assignment</h2>
                      <p className="text-indigo-100 text-sm mt-1">
                        {showCustomization ? 'Customize schedule before assigning' : 'Create a new schedule assignment'}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                  <div className="space-space-y-6">
                    {/* Member Selection */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                        <Users size={18} className="mr-2 text-indigo-500" />
                        Select Member <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="member_id"
                          value={formData.member_id}
                          onChange={handleChange}
                          className={`w-full pl-4 pr-10 py-3 bg-slate-50 border-2 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                            errors.member_id ? 'border-red-300' : 'border-slate-200 focus:border-indigo-500'
                          }`}
                        >
                          <option value="">Choose a member...</option>
                          {filteredMembers.map(member => (
                            <option key={member.id} value={member.id}>
                              {member.first_name} {member.last_name} ({member.membership_id})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                      </div>
                      {errors.member_id && <p className="text-red-500 text-xs mt-1 ml-1">{errors.member_id}</p>}
                    </div>

                    {/* Schedule Selection */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                        <Calendar size={18} className="mr-2 text-purple-500" />
                        Select Template <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="schedule_id"
                          value={formData.schedule_id}
                          onChange={handleScheduleChange}
                          className={`w-full pl-4 pr-10 py-3 bg-slate-50 border-2 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                            errors.schedule_id ? 'border-red-300' : 'border-slate-200 focus:border-purple-500'
                          }`}
                        >
                          <option value="">Load from template...</option>
                          {schedules.map(schedule => (
                            <option key={schedule.id} value={schedule.id}>
                              {schedule.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                      </div>
                      {errors.schedule_id && <p className="text-red-500 text-xs mt-1 ml-1">{errors.schedule_id}</p>}
                    </div>

                    {/* Customization Area */}
                    {showCustomization && (
                      <div className="mt-8 border-t-2 border-dashed border-indigo-100 pt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <Edit3 className="w-5 h-5 mr-2 text-indigo-600" />
                            Customize Weekly Plan
                          </h3>
                          <div className="text-xs text-indigo-500 font-medium bg-indigo-50 px-3 py-1 rounded-full">
                            Drag & Drop to Add/Reorder
                          </div>
                        </div>

                        {loadingSchedule ? (
                          <div className="py-12 flex justify-center">
                            <LoadingSpinner />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {scheduleDetails.map((dayData) => (
                              <div 
                                key={dayData.day} 
                                className={`border-2 rounded-xl transition-all duration-200 overflow-hidden ${
                                  restDays[dayData.day] 
                                    ? 'border-slate-200 bg-slate-50' 
                                    : 'border-indigo-100 bg-white shadow-sm hover:border-indigo-300'
                                }`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, dayData.day)}
                              >
                                {/* Day Header */}
                                <div 
                                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 transition-colors"
                                  onClick={() => toggleDayExpanded(dayData.day)}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${restDays[dayData.day] ? 'bg-slate-200' : 'bg-indigo-100'}`}>
                                      {restDays[dayData.day] ? (
                                        <Coffee size={18} className="text-slate-500" />
                                      ) : (
                                        <Calendar size={18} className="text-indigo-600" />
                                      )}
                                    </div>
                                    <span className={`font-bold ${restDays[dayData.day] ? 'text-slate-500' : 'text-gray-900'}`}>
                                      {dayData.day}
                                    </span>
                                    {!restDays[dayData.day] && (
                                      <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
                                        {dayData.workouts.length} exercises
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => toggleRestDay(dayData.day)}
                                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border ${
                                        restDays[dayData.day]
                                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200'
                                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                      }`}
                                    >
                                      {restDays[dayData.day] ? 'REST DAY ON' : 'Set as Rest Day'}
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => toggleDayExpanded(dayData.day)}
                                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                                    >
                                      {expandedDays[dayData.day] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                  </div>
                                </div>

                                {/* Workouts List */}
                                {(expandedDays[dayData.day] || !restDays[dayData.day]) && (
                                  <div className={`border-t ${restDays[dayData.day] ? 'border-slate-200' : 'border-indigo-50'}`}>
                                    {restDays[dayData.day] ? (
                                      <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                                        <Coffee size={32} className="mb-2 opacity-50" />
                                        <p className="font-medium">Rest Day Assigned</p>
                                        <p className="text-xs mt-1">No workouts needed</p>
                                      </div>
                                    ) : (
                                      <div className="p-3 space-y-2 min-h-[100px]">
                                        {dayData.workouts.length === 0 ? (
                                          <div className="h-24 border-2 border-dashed border-indigo-100 rounded-lg flex flex-col items-center justify-center text-indigo-300">
                                            <Dumbbell size={24} className="mb-1" />
                                            <span className="text-sm">Drop workouts here</span>
                                          </div>
                                        ) : (
                                          dayData.workouts.map((workout, index) => (
                                            <div 
                                              key={workout.id}
                                              className="group flex items-center bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all"
                                              draggable
                                              onDragStart={(e) => handleScheduleDragStart(e, workout, dayData.day, index)}
                                              onDrop={(e) => handleDropOnWorkout(e, dayData.day, index)}
                                            >
                                              <div className="mr-3 cursor-move text-gray-300 hover:text-indigo-400">
                                                <GripVertical size={16} />
                                              </div>
                                              
                                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                                <div className="sm:col-span-4 font-semibold text-gray-800 text-sm flex items-center">
                                                  {workout.is_cardio ? <Timer size={14} className="mr-1.5 text-orange-500" /> : <Dumbbell size={14} className="mr-1.5 text-indigo-500" />}
                                                  {workout.workout_name}
                                                </div>
                                                
                                                <div className="sm:col-span-6 flex items-center space-x-2">
                                                  {workout.is_cardio ? (
                                                    <div className="flex items-center bg-white rounded-md border border-gray-200 px-2 py-1">
                                                      <input
                                                        type="number"
                                                        value={workout.duration}
                                                        onChange={(e) => updateWorkoutDetail(dayData.day, workout.id, 'duration', e.target.value)}
                                                        className="w-12 text-center text-sm font-medium outline-none text-gray-700"
                                                        min="0"
                                                      />
                                                      <span className="text-xs text-gray-400 ml-1">mins</span>
                                                    </div>
                                                  ) : (
                                                    <>
                                                      <div className="flex items-center bg-white rounded-md border border-gray-200 px-2 py-1">
                                                        <span className="text-xs text-gray-400 mr-1">S:</span>
                                                        <input
                                                          type="number"
                                                          value={workout.sets}
                                                          onChange={(e) => updateWorkoutDetail(dayData.day, workout.id, 'sets', e.target.value)}
                                                          className="w-8 text-center text-sm font-medium outline-none text-gray-700"
                                                          min="0"
                                                        />
                                                      </div>
                                                      <div className="flex items-center bg-white rounded-md border border-gray-200 px-2 py-1">
                                                        <span className="text-xs text-gray-400 mr-1">R:</span>
                                                        <input
                                                          type="number"
                                                          value={workout.reps}
                                                          onChange={(e) => updateWorkoutDetail(dayData.day, workout.id, 'reps', e.target.value)}
                                                          className="w-8 text-center text-sm font-medium outline-none text-gray-700"
                                                          min="0"
                                                        />
                                                      </div>
                                                    </>
                                                  )}
                                                </div>

                                                <div className="sm:col-span-2 flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button 
                                                    type="button"
                                                    onClick={() => removeWorkout(dayData.day, workout.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Remove"
                                                  >
                                                    <X size={16} />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                        <input
                          type="date"
                          name="start_date"
                          value={formData.start_date}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                            errors.start_date ? 'border-red-300' : 'border-slate-200 focus:border-indigo-500'
                          }`}
                        />
                        {errors.start_date && <p className="text-red-500 text-xs mt-1 ml-1">{errors.start_date}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">End Date (Optional)</label>
                        <input
                          type="date"
                          name="end_date"
                          value={formData.end_date}
                          onChange={handleChange}
                          min={formData.start_date}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                        {errors.end_date && <p className="text-red-500 text-xs mt-1 ml-1">{errors.end_date}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {saving ? (
                        <>
                          <LoadingSpinner size="sm" color="white" />
                          <span className="ml-2">Assigning...</span>
                        </>
                      ) : (
                        <>
                          <Save size={20} className="mr-2" />
                          Confirm Assignment
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Assignment History */}
              <div className={`${showCustomization ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6 transition-all duration-300`}>
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-140px)] sticky top-6">
                  
                  {/* History Header */}
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="font-bold text-gray-800 flex items-center mb-4">
                      <ClipboardList size={20} className="mr-2 text-indigo-500" />
                      History
                    </h2>
                    
                    {/* Search */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={searchAssignment}
                        onChange={(e) => setSearchAssignment(e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex p-1 bg-gray-200/50 rounded-lg">
                      {['all', 'active', 'upcoming', 'completed'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${
                            filterStatus === status
                              ? 'bg-white text-indigo-600 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List Content */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {filteredAssignments.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
                        <ClipboardList size={40} className="mb-3 opacity-20" />
                        <p className="text-sm">No assignments found</p>
                      </div>
                    ) : (
                      filteredAssignments.map((assignment) => (
                        <div 
                          key={assignment.id}
                          className="bg-white border border-gray-100 rounded-xl p-3 hover:border-indigo-200 hover:shadow-md transition-all group relative"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                {assignment.members.first_name?.[0]}{assignment.members.last_name?.[0]}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900 leading-tight">
                                  {assignment.members.first_name} {assignment.members.last_name}
                                </p>
                                <p className="text-xs text-gray-500">{assignment.members.membership_id}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(assignment)}`}>
                              {getStatusText(assignment)}
                            </span>
                          </div>

                          <div className="pl-10 space-y-1">
                            <div className="flex items-center text-xs text-gray-600 font-medium">
                              <Target size={12} className="mr-1.5 text-purple-500" />
                              <span className="truncate">{assignment.work_schedule.name}</span>
                            </div>
                            
                            <div className="flex items-center text-[10px] text-gray-400">
                              <Calendar size={10} className="mr-1.5" />
                              <span>{formatDate(assignment.start_date)}</span>
                              <span className="mx-1">→</span>
                              <span>{assignment.end_date ? formatDate(assignment.end_date) : 'Ongoing'}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteAssignment(
                              assignment.id, 
                              `${assignment.members.first_name} ${assignment.members.last_name}`,
                              assignment.work_schedule.name
                            )}
                            className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Remove Assignment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}