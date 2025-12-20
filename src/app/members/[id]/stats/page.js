'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { 
  ArrowLeft, 
  Scale, 
  Activity, 
  Save, 
  Calendar, 
  TrendingUp, 
  Ruler,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

export default function MemberStatsPage({ params }) {
  const { id } = use(params);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [stats, setStats] = useState({ weight: [], chest: [], bicep: [], hip: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('weight');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    chest: '',
    bicep: '',
    hip: ''
  });

  const router = useRouter();

  // Log the member ID to verify it's correct
  console.log('Member ID from params:', id);

  useEffect(() => {
    const currentUser = supabaseApi.getUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      fetchData();
    }
  }, [id, router]);

  const fetchData = async () => {
    try {
      console.log('Fetching member with ID:', id);
      
      // Fetch member data with detailed logging
      const memberData = await supabaseApi.getMember(id);
      console.log('Member Data Raw Response:', memberData);
      
      // Fetch stats data
      const statsData = await supabaseApi.getMemberStats(id);
      console.log('Stats Data:', statsData);
      
      if (!memberData) {
        console.error('Member data is null/undefined. Member might not exist or might be marked as deleted.');
        toast.error('Member not found. Please check if the member exists.');
      }
      
      setMember(memberData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data: ' + error.message);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.weight && !formData.chest && !formData.bicep && !formData.hip) {
      toast.error('Please enter at least one measurement');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Saving stats...');

    try {
      await supabaseApi.addBodyStats(id, formData);
      toast.success('Stats updated successfully!', { id: toastId });
      
      setFormData(prev => ({
        ...prev,
        weight: '',
        chest: '',
        bicep: '',
        hip: ''
      }));

      const newStats = await supabaseApi.getMemberStats(id);
      setStats(newStats);
    } catch (error) {
      console.error('Error saving stats:', error);
      toast.error('Failed to save stats', { id: toastId });
    }
    setSaving(false);
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

  const currentHistory = stats[activeTab] || [];
  const unit = activeTab === 'weight' ? 'kg' : 'inch';

  const getValueKey = (tab) => {
    if (tab === 'hip') return 'hip_value';
    return `${tab}_value`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Enhanced Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => router.back()}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl">
                      <Activity className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {member ? `${member.first_name} ${member.last_name}` : 'Loading...'}
                      </h1>
                      <p className="text-gray-600 flex items-center space-x-2 mt-1">
                        <TrendingUp size={16} className="text-blue-600" />
                        <span>Body Statistics & Progress Tracking</span>
                      </p>
                    </div>
                  </div>
                  {member?.membership_id && (
                    <div className="ml-16 flex items-center space-x-2 text-sm">
                      <User size={14} className="text-gray-500" />
                      <span className="text-gray-500">Member ID:</span>
                      <span className="font-semibold text-blue-600">{member.membership_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Input Form */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="font-semibold text-gray-800 flex items-center">
                      <Activity size={18} className="mr-2 text-blue-600" />
                      Add New Entry
                    </h2>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Weight (kg)
                        </label>
                        <div className="relative">
                          <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="number"
                            name="weight"
                            step="0.1"
                            value={formData.weight}
                            onChange={handleInputChange}
                            placeholder="0.0"
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Chest (in)
                        </label>
                        <div className="relative">
                          <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="number"
                            name="chest"
                            step="0.1"
                            value={formData.chest}
                            onChange={handleInputChange}
                            placeholder="0.0"
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Bicep (in)
                        </label>
                        <div className="relative">
                          <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="number"
                            name="bicep"
                            step="0.1"
                            value={formData.bicep}
                            onChange={handleInputChange}
                            placeholder="0.0"
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Hip (in)
                        </label>
                        <div className="relative">
                          <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="number"
                            name="hip"
                            step="0.1"
                            value={formData.hip}
                            onChange={handleInputChange}
                            placeholder="0.0"
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                    >
                      {saving ? 'Saving...' : (
                        <>
                          <Save size={18} className="mr-2" />
                          Save Stats
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: History Tabs */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full min-h-[500px]">
                  
                  {/* Tabs */}
                  <div className="flex border-b border-gray-100 overflow-x-auto">
                    {[
                      { id: 'weight', label: 'Weight', icon: Scale },
                      { id: 'chest', label: 'Chest', icon: Ruler },
                      { id: 'bicep', label: 'Bicep', icon: Ruler },
                      { id: 'hip', label: 'Hip', icon: Ruler },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === tab.id
                              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon size={16} className="mr-2" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-800 capitalize">
                        {activeTab} History
                      </h3>
                      <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        Total Records: {currentHistory.length}
                      </div>
                    </div>

                    {currentHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                        <TrendingUp size={48} className="mb-3 opacity-20" />
                        <p>No data recorded yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {currentHistory.map((record, index) => {
                              const nextRecord = currentHistory[index + 1];
                              const valueKey = getValueKey(activeTab);
                              
                              const currentValue = record[valueKey];
                              const prevValue = nextRecord ? nextRecord[valueKey] : null;
                              
                              let trend = null;
                              if (prevValue !== null) {
                                const diff = currentValue - prevValue;
                                if (diff > 0) trend = 'up';
                                else if (diff < 0) trend = 'down';
                                else trend = 'same';
                              }

                              return (
                                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(record.date)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {currentValue} <span className="text-gray-500 font-normal text-xs">{unit}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {trend === 'up' && <span className="text-green-600 flex items-center"><TrendingUp size={14} className="mr-1" /> +</span>}
                                    {trend === 'down' && <span className="text-red-600 flex items-center"><TrendingUp size={14} className="mr-1 rotate-180" /> -</span>}
                                    {trend === 'same' && <span className="text-gray-400">-</span>}
                                    {trend === null && <span className="text-gray-300 text-xs">Start</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
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