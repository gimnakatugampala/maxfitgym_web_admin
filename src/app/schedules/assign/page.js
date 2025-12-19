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
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Timer
} from 'lucide-react';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

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
  const [assignments, setAssignments] = useState([]);
  const [searchMember, setSearchMember] = useState('');
  const [searchAssignment, setSearchAssignment] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Customization states
  const [showCustomization, setShowCustomization] = useState(false);
  const [scheduleDetails, setScheduleDetails] = useState([]);
  const [expandedDays, setExpandedDays] = useState({});
  
  const [formData, setFormData] = useState({
    member_id: '',
    schedule_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
      const [membersData, schedulesData, assignmentsData] = await Promise.all([
        supabaseApi.getActiveMembers(),
        supabaseApi.getSchedules(),
        supabaseApi.getAllAssignments(),
      ]);
      
      setMembers(membersData || []);
      setSchedules(schedulesData || []);
      
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
      
      // Group by day and organize
      const organized = DAYS.map(day => ({
        day,
        workouts: (details || [])
          .filter(d => d.day === day && !d.is_rest_day)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          .map(d => ({
            id: d.id,
            workout_id: d.workout_id,
            workout_name: d.workout?.name || 'Unknown',
            original_sets: d.set_no ? parseInt(d.set_no) : 0,
            original_reps: d.rep_no ? parseInt(d.rep_no) : 0,
            original_duration: d.duration_minutes ? parseInt(d.duration_minutes) : 0,
            sets: d.set_no ? parseInt(d.set_no) : 0,
            reps: d.rep_no ? parseInt(d.rep_no) : 0,
            duration: d.duration_minutes ? parseInt(d.duration_minutes) : 0,
            order_index: d.order_index,
            is_cardio: d.duration_minutes > 0
          })),
        is_rest_day: details.some(d => d.day === day && d.is_rest_day)
      }));
      
      setScheduleDetails(organized);
      setShowCustomization(true);
    } catch (error) {
      console.error('Error loading schedule details:', error);
      toast.error('Failed to load schedule details');
    }
    setLoadingSchedule(false);
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
      
      // Step 2: Create customized details for each workout
      for (const dayData of scheduleDetails) {
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
        
        // Handle rest days
        if (dayData.is_rest_day && dayData.workouts.length === 0) {
          await supabaseApi.createMemberScheduleDetail({
            member_schedule_id: memberScheduleId,
            schedule_detail_id: null,
            is_rest_day: true,
            completed: false,
            order_index: '1'
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Enhanced Assignment Form */}
              <div className={`${showCustomization ? 'lg:col-span-2' : 'lg:col-span-1'} bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transition-all`}>
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
                  <div className="space-y-6">
                    
                    {/* Member Selection */}
                    <div>
                      <label className="flex items-center text-slate-700 text-sm font-bold mb-3 tracking-wide uppercase">
                        <Users size={18} className="mr-2 text-indigo-600" />
                        Select Member <span className="text-rose-500 ml-1">*</span>
                      </label>
                      
                      <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          value={searchMember}
                          onChange={(e) => setSearchMember(e.target.value)}
                          placeholder="Search members..."
                          className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                        />
                      </div>

                      <select
                        name="member_id"
                        value={formData.member_id}
                        onChange={handleChange}
                        className={`w-full px-4 py-3.5 border-2 ${
                          errors.member_id 
                            ? 'border-rose-300 bg-rose-50 focus:ring-rose-500' 
                            : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200'
                        } rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 font-medium shadow-sm`}
                      >
                        <option value="">Choose a member...</option>
                        {filteredMembers.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.first_name} {member.last_name} ({member.membership_id})
                          </option>
                        ))}
                      </select>
                      {errors.member_id && (
                        <div className="flex items-center mt-2 text-rose-600 text-sm bg-rose-50 px-3 py-2 rounded-lg">
                          <AlertCircle size={14} className="mr-2" />
                          {errors.member_id}
                        </div>
                      )}
                    </div>

                    {/* Schedule Selection */}
                    <div>
                      <label className="flex items-center text-slate-700 text-sm font-bold mb-3 tracking-wide uppercase">
                        <Calendar size={18} className="mr-2 text-purple-600" />
                        Workout Schedule <span className="text-rose-500 ml-1">*</span>
                      </label>
                      <select
                        name="schedule_id"
                        value={formData.schedule_id}
                        onChange={handleScheduleChange}
                        disabled={loadingSchedule}
                        className={`w-full px-4 py-3.5 border-2 ${
                          errors.schedule_id 
                            ? 'border-rose-300 bg-rose-50 focus:ring-rose-500' 
                            : 'border-slate-200 focus:border-purple-500 focus:ring-purple-200'
                        } rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 font-medium shadow-sm disabled:opacity-50`}
                      >
                        <option value="">Choose a schedule...</option>
                        {schedules.map(schedule => (
                          <option key={schedule.id} value={schedule.id}>
                            {schedule.name}
                          </option>
                        ))}
                      </select>
                      {loadingSchedule && (
                        <div className="flex items-center mt-2 text-indigo-600 text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                          Loading schedule details...
                        </div>
                      )}
                      {errors.schedule_id && (
                        <div className="flex items-center mt-2 text-rose-600 text-sm bg-rose-50 px-3 py-2 rounded-lg">
                          <AlertCircle size={14} className="mr-2" />
                          {errors.schedule_id}
                        </div>
                      )}
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 text-sm font-bold mb-3 tracking-wide uppercase">
                          Start Date <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="start_date"
                          value={formData.start_date}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 ${
                            errors.start_date 
                              ? 'border-rose-300 bg-rose-50' 
                              : 'border-slate-200 focus:border-indigo-500'
                          } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm`}
                        />
                        {errors.start_date && (
                          <p className="text-rose-600 text-xs mt-2">{errors.start_date}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-700 text-sm font-bold mb-3 tracking-wide uppercase">
                          End Date
                        </label>
                        <input
                          type="date"
                          name="end_date"
                          value={formData.end_date}
                          onChange={handleChange}
                          min={formData.start_date}
                          className={`w-full px-4 py-3 border-2 ${
                            errors.end_date 
                              ? 'border-rose-300 bg-rose-50' 
                              : 'border-slate-200 focus:border-indigo-500'
                          } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm`}
                        />
                        {errors.end_date && (
                          <p className="text-rose-600 text-xs mt-2">{errors.end_date}</p>
                        )}
                      </div>
                    </div>

                    {/* Schedule Customization Section */}
                    {showCustomization && scheduleDetails.length > 0 && (
                      <div className="border-t-2 border-slate-200 pt-6 mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-slate-900 flex items-center">
                            <Edit3 size={20} className="mr-2 text-indigo-600" />
                            Customize Schedule
                          </h3>
                          <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            {scheduleDetails.filter(d => d.workouts.length > 0 || d.is_rest_day).length} days configured
                          </span>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                          {scheduleDetails.map(dayData => (
                            <div key={dayData.day} className="border-2 border-slate-200 rounded-xl overflow-hidden">
                              <button
                                type="button"
                                onClick={() => toggleDayExpanded(dayData.day)}
                                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="font-bold text-slate-900">{dayData.day}</span>
                                  {dayData.is_rest_day ? (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                      Rest Day
                                    </span>
                                  ) : (
                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">
                                      {dayData.workouts.length} workout{dayData.workouts.length !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                {expandedDays[dayData.day] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              </button>

                              {expandedDays[dayData.day] && !dayData.is_rest_day && (
                                <div className="p-4 space-y-3 bg-white">
                                  {dayData.workouts.map((workout, idx) => (
                                    <div key={workout.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                          <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                            {idx + 1}
                                          </span>
                                          <span className="font-semibold text-slate-900 text-sm">
                                            {workout.workout_name}
                                          </span>
                                        </div>
                                        <div className="flex space-x-1">
                                          <button
                                            type="button"
                                            onClick={() => resetWorkout(dayData.day, workout.id)}
                                            className="text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors"
                                            title="Reset to original"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => removeWorkout(dayData.day, workout.id)}
                                            className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                            title="Remove workout"
                                          >
                                            <X size={16} />
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {workout.is_cardio ? (
                                        <div className="flex items-center space-x-3">
                                          <Timer size={16} className="text-green-600" />
                                          <label className="text-xs font-semibold text-slate-600">Duration (min):</label>
                                          <input
                                            type="number"
                                            value={workout.duration}
                                            onChange={(e) => updateWorkoutDetail(dayData.day, workout.id, 'duration', e.target.value)}
                                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                            min="0"
                                          />
                                        </div>
                                      ) : (
                                        <div className="flex items-center space-x-4">
                                          <div className="flex items-center space-x-2">
                                            <Dumbbell size={16} className="text-purple-600" />
                                            <label className="text-xs font-semibold text-slate-600">Sets:</label>
                                            <input
                                              type="number"
                                              value={workout.sets}
                                              onChange={(e) => updateWorkoutDetail(dayData.day, workout.id, 'sets', e.target.value)}
                                              className="w-16 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                              min="0"
                                            />
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Target size={16} className="text-blue-600" />
                                            <label className="text-xs font-semibold text-slate-600">Reps:</label>
                                            <input
                                              type="number"
                                              value={workout.reps}
                                              onChange={(e) => updateWorkoutDetail(dayData.day, workout.id, 'reps', e.target.value)}
                                              className="w-16 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              min="0"
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <button
                      type="submit"
                      disabled={saving || loadingSchedule}
                      className="group relative w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white px-6 py-4 rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transform overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                      <Save size={20} className="relative" />
                      <span className="font-bold text-lg relative tracking-wide">
                        {saving ? 'Assigning Schedule...' : showCustomization ? 'Assign Customized Schedule' : 'Assign Schedule'}
                      </span>
                      <Sparkles size={20} className="relative animate-pulse" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Assignments List */}
              <div className={`${showCustomization ? 'lg:col-span-1' : 'lg:col-span-2'} bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transition-all`}>
                <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                        <Target size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Assignments</h2>
                        <p className="text-slate-300 text-sm mt-1">{filteredAssignments.length} assignments found</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Search & Filter */}
                  <div className="space-y-3 mb-6">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="text"
                        value={searchAssignment}
                        onChange={(e) => setSearchAssignment(e.target.value)}
                        placeholder="Search assignments..."
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                      />
                    </div>

                    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                      <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                          filterStatus === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All ({assignments.length})
                      </button>
                      <button
                        onClick={() => setFilterStatus('active')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                          filterStatus === 'active' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Active ({activeCount})
                      </button>
                      <button
                        onClick={() => setFilterStatus('completed')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                          filterStatus === 'completed' ? 'bg-slate-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Completed ({completedCount})
                      </button>
                      <button
                        onClick={() => setFilterStatus('upcoming')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                          filterStatus === 'upcoming' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Upcoming ({upcomingCount})
                      </button>
                    </div>
                  </div>

                  {/* Assignments List */}
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredAssignments.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-4">
                          <ClipboardList size={40} className="text-slate-400" />
                        </div>
                        <p className="text-slate-500 text-lg font-medium">No assignments found</p>
                        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or create a new assignment</p>
                      </div>
                    ) : (
                      filteredAssignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className="group border-2 border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-lg transition-all bg-gradient-to-br from-white to-slate-50/30"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-2 rounded-xl">
                                  <Users size={18} className="text-indigo-600" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-900 text-lg">
                                    {assignment.members?.first_name} {assignment.members?.last_name}
                                  </h3>
                                  <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-semibold">
                                    {assignment.members?.membership_id}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3 pl-11">
                                <Calendar size={16} className="text-purple-600" />
                                <p className="text-sm font-bold text-slate-800">
                                  {assignment.work_schedule?.name}
                                </p>
                              </div>

                              <div className="flex items-center space-x-3 pl-11">
                                <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${getStatusColor(assignment)}`}>
                                  {getStatusText(assignment)}
                                </span>
                              </div>
                              
                              <div className="text-xs text-slate-500 space-y-1 pl-11 pt-2 border-t border-slate-100">
                                <div className="flex items-center space-x-2">
                                  <Clock size={12} />
                                  <span>Start: {formatDate(assignment.start_date)}</span>
                                </div>
                                {assignment.end_date && (
                                  <div className="flex items-center space-x-2">
                                    <Clock size={12} />
                                    <span>End: {formatDate(assignment.end_date)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleDeleteAssignment(
                                assignment.id,
                                `${assignment.members?.first_name} ${assignment.members?.last_name}`,
                                assignment.work_schedule?.name
                              )}
                              className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
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