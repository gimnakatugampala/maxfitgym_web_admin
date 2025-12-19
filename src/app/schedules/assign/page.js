'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  Save, 
  UserPlus, 
  Calendar, 
  Users, 
  ClipboardList, 
  Search,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AssignWorkoutSchedulePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [searchMember, setSearchMember] = useState('');
  const [searchAssignment, setSearchAssignment] = useState('');
  const [formData, setFormData] = useState({
    member_id: '',
    schedule_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
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
      const [membersData, schedulesData, assignmentsData] = await Promise.all([
        supabaseApi.getActiveMembers(),
        supabaseApi.getSchedules(),
        supabaseApi.getAllAssignments(),
      ]);
      
      setMembers(membersData || []);
      setSchedules(schedulesData || []);
      setAssignments(assignmentsData || []);
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
    const toastId = toast.loading('Assigning schedule...');
    
    try {
      const assignmentData = {
        member_id: parseInt(formData.member_id),
        schedule_id: parseInt(formData.schedule_id),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        notes: formData.notes,
        is_active: true,
      };
      
      await supabaseApi.assignScheduleToMember(assignmentData);
      
      toast.success('Schedule assigned successfully!', { id: toastId });
      
      // Reset form
      setFormData({
        member_id: '',
        schedule_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: '',
      });
      
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
            Remove schedule <span className="font-semibold">{scheduleName}</span> from{' '}
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
    
    return memberName.includes(search) || scheduleName.includes(search);
  });

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
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl">
                    <ClipboardList className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">Assign Workout Schedule</h1>
                    <p className="text-gray-600 mt-1">Assign workout schedules to members</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Active Assignments</div>
                    <div className="text-3xl font-bold text-indigo-600">{assignments.length}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assignment Form */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <UserPlus size={20} className="mr-2" />
                    New Assignment
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                  <div className="space-y-6">
                    {/* Member Selection */}
                    <div>
                      <label className="flex items-center text-gray-700 text-sm font-bold mb-3">
                        <Users size={18} className="mr-2 text-gray-500" />
                        Select Member <span className="text-red-500 ml-1">*</span>
                      </label>
                      
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={searchMember}
                          onChange={(e) => setSearchMember(e.target.value)}
                          placeholder="Search members..."
                          className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <select
                        name="member_id"
                        value={formData.member_id}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 ${
                          errors.member_id ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-indigo-500'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all`}
                      >
                        <option value="">Choose a member...</option>
                        {filteredMembers.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.first_name} {member.last_name} ({member.membership_id})
                          </option>
                        ))}
                      </select>
                      {errors.member_id && (
                        <p className="text-red-500 text-xs mt-2 flex items-center">
                          <AlertCircle size={14} className="mr-1" />
                          {errors.member_id}
                        </p>
                      )}
                    </div>

                    {/* Schedule Selection */}
                    <div>
                      <label className="flex items-center text-gray-700 text-sm font-bold mb-3">
                        <Calendar size={18} className="mr-2 text-gray-500" />
                        Workout Schedule <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        name="schedule_id"
                        value={formData.schedule_id}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 ${
                          errors.schedule_id ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-indigo-500'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all`}
                      >
                        <option value="">Choose a schedule...</option>
                        {schedules.map(schedule => (
                          <option key={schedule.id} value={schedule.id}>
                            {schedule.name}
                          </option>
                        ))}
                      </select>
                      {errors.schedule_id && (
                        <p className="text-red-500 text-xs mt-2 flex items-center">
                          <AlertCircle size={14} className="mr-1" />
                          {errors.schedule_id}
                        </p>
                      )}
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-3">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="start_date"
                          value={formData.start_date}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 ${
                            errors.start_date ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-indigo-500'
                          } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all`}
                        />
                        {errors.start_date && (
                          <p className="text-red-500 text-xs mt-2">{errors.start_date}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-3">
                          End Date (Optional)
                        </label>
                        <input
                          type="date"
                          name="end_date"
                          value={formData.end_date}
                          onChange={handleChange}
                          min={formData.start_date}
                          className={`w-full px-4 py-3 border-2 ${
                            errors.end_date ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-indigo-500'
                          } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all`}
                        />
                        {errors.end_date && (
                          <p className="text-red-500 text-xs mt-2">{errors.end_date}</p>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-3">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-300 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                        placeholder="Add any special instructions or notes..."
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Save size={20} />
                      <span className="font-semibold">
                        {saving ? 'Assigning Schedule...' : 'Assign Schedule'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Current Assignments List */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <ClipboardList size={20} className="mr-2" />
                    Current Assignments
                  </h2>
                </div>

                <div className="p-6">
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={searchAssignment}
                      onChange={(e) => setSearchAssignment(e.target.value)}
                      placeholder="Search assignments..."
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Assignments List */}
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredAssignments.length === 0 ? (
                      <div className="text-center py-12">
                        <ClipboardList size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No assignments found</p>
                      </div>
                    ) : (
                      filteredAssignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className="border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Users size={16} className="text-indigo-600" />
                                <h3 className="font-semibold text-gray-900">
                                  {assignment.members?.first_name} {assignment.members?.last_name}
                                </h3>
                                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                                  {assignment.members?.membership_id}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2 mb-2">
                                <Calendar size={16} className="text-purple-600" />
                                <p className="text-sm font-medium text-gray-700">
                                  {assignment.work_schedule?.name}
                                </p>
                              </div>
                              
                              <div className="text-xs text-gray-500 space-y-1">
                                <p>Start: {formatDate(assignment.start_date)}</p>
                                {assignment.end_date && (
                                  <p>End: {formatDate(assignment.end_date)}</p>
                                )}
                                {assignment.notes && (
                                  <p className="italic mt-1">Note: {assignment.notes}</p>
                                )}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleDeleteAssignment(
                                assignment.id,
                                `${assignment.members?.first_name} ${assignment.members?.last_name}`,
                                assignment.work_schedule?.name
                              )}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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