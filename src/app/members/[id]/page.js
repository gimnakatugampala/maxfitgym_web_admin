'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import LoadingSpinner from '@/components/LoadingSpinner';
import { User, Phone, Calendar, Activity } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function MemberDetailsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const currentUser = supabaseApi.getUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      fetchMember();
    }
  }, [router, params.id]);

  const fetchMember = async () => {
    try {
      const data = await supabaseApi.getMember(params.id);
      setMember(data);
    } catch (error) {
      console.error('Error fetching member:', error);
    }
    setLoading(false);
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

  if (!member) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1">
          <TopNav toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} />
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">Member not found</p>
            </div>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Member Details</h1>
            <p className="text-gray-600 mt-1">{member.full_name}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'info'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Member Info
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'schedule'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Workout Schedule
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'stats'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Body Stats
                </button>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'attendance'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Attendance
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Member Info Tab */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <User className="text-gray-400" size={24} />
                      <div>
                        <p className="text-sm text-gray-500">Membership ID</p>
                        <p className="text-lg font-semibold">{member.membership_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="text-gray-400" size={24} />
                      <div>
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="text-lg font-semibold">{member.phone_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="text-gray-400" size={24} />
                      <div>
                        <p className="text-sm text-gray-500">Member Since</p>
                        <p className="text-lg font-semibold">{formatDate(member.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Activity className="text-gray-400" size={24} />
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="text-lg font-semibold">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            member.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other tabs would show appropriate content */}
              {activeTab === 'schedule' && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Workout schedule information coming soon...</p>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Body stats tracking coming soon...</p>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Attendance history coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}