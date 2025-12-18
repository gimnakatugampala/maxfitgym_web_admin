'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../../components/LoadingSpinner';
import { User, Phone, Calendar, Activity, TrendingUp, CreditCard } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function MemberDetailsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [bodyStats, setBodyStats] = useState({
    weight: [],
    chest: [],
    bicep: [],
    hip: [],
  });
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
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
      
      if (data) {
        // Fetch additional data
        const [weight, chest, bicep, hip, paymentData] = await Promise.all([
          supabaseApi.getWeightProgress(params.id),
          supabaseApi.getChestProgress(params.id),
          supabaseApi.getBicepProgress(params.id),
          supabaseApi.getHipProgress(params.id),
          supabaseApi.getPayments(params.id),
        ]);
        
        setBodyStats({ weight, chest, bicep, hip });
        setPayments(paymentData || []);
      }
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
            <p className="text-gray-600 mt-1">{member.first_name} {member.last_name}</p>
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
                  onClick={() => setActiveTab('payments')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'payments'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Payments
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
                        <p className="text-lg font-semibold">{formatDate(member.created_date)}</p>
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
                    <div className="flex items-center space-x-3">
                      <Activity className="text-gray-400" size={24} />
                      <div>
                        <p className="text-sm text-gray-500">Platform</p>
                        <p className="text-lg font-semibold">{member.platform?.name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="text-gray-400" size={24} />
                      <div>
                        <p className="text-sm text-gray-500">Last Active</p>
                        <p className="text-lg font-semibold">{formatDate(member.last_active)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Body Stats Tab */}
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Weight Progress */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <TrendingUp size={20} className="mr-2 text-blue-600" />
                        Weight Progress
                      </h3>
                      {bodyStats.weight.length > 0 ? (
                        <div className="space-y-2">
                          {bodyStats.weight.slice(0, 5).map((record, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">{formatDate(record.date)}</span>
                              <span className="font-semibold">{record.weight_kg} kg</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No weight records</p>
                      )}
                    </div>

                    {/* Chest Progress */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <TrendingUp size={20} className="mr-2 text-green-600" />
                        Chest Progress
                      </h3>
                      {bodyStats.chest.length > 0 ? (
                        <div className="space-y-2">
                          {bodyStats.chest.slice(0, 5).map((record, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">{formatDate(record.date)}</span>
                              <span className="font-semibold">{record.chest_size_inch} inch</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No chest records</p>
                      )}
                    </div>

                    {/* Bicep Progress */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <TrendingUp size={20} className="mr-2 text-purple-600" />
                        Bicep Progress
                      </h3>
                      {bodyStats.bicep.length > 0 ? (
                        <div className="space-y-2">
                          {bodyStats.bicep.slice(0, 5).map((record, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">{formatDate(record.date)}</span>
                              <span className="font-semibold">{record.hip_size_inch} inch</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No bicep records</p>
                      )}
                    </div>

                    {/* Hip Progress */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <TrendingUp size={20} className="mr-2 text-pink-600" />
                        Hip Progress
                      </h3>
                      {bodyStats.hip.length > 0 ? (
                        <div className="space-y-2">
                          {bodyStats.hip.slice(0, 5).map((record, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">{formatDate(record.date)}</span>
                              <span className="font-semibold">{record.hip_size_inch} inch</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No hip records</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div>
                  {payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiring Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {payment.code}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(payment.payment_date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(payment.expiring_date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                                ${payment.amount || '0.00'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No payment records</p>
                    </div>
                  )}
                </div>
              )}

              {/* Schedule Tab */}
              {activeTab === 'schedule' && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Workout schedule information coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}