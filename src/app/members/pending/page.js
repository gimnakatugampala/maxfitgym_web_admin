'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function PendingMembersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // useEffect(() => {
  //   const currentUser = supabaseApi.getUser();
  //   if (!currentUser) {
  //     router.push('/login');
  //   } else {
  //     setUser(currentUser);
  //     fetchPendingMembers();
  //   }
  // }, [router]);

  const fetchPendingMembers = async () => {
    try {
      // In a real app, you'd filter by pending status
      const data = await supabaseApi.getMembers();
      // Filter for pending members (is_active = false or has pending flag)
      setMembers((data || []).filter(m => !m.is_active));
    } catch (error) {
      console.error('Error fetching members:', error);
    }
    setLoading(false);
  };

  const handleAction = async (memberId, action) => {
    const message = action === 'activate' 
      ? 'Are you sure you want to activate this member?' 
      : 'Are you sure you want to reject this member?';
      
    if (confirm(message)) {
      try {
        await supabaseApi.updateMember(memberId, { 
          is_active: action === 'activate' 
        });
        fetchPendingMembers();
      } catch (error) {
        console.error('Error updating member:', error);
        alert('Failed to update member status');
      }
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
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Pending Members</h1>
            <p className="text-gray-600 mt-1">Review and approve new member registrations</p>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Membership ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member, index) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {member.membership_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.phone_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleAction(member.id, 'activate')}
                          className="text-green-600 hover:text-green-900 inline-flex items-center space-x-1"
                        >
                          <CheckCircle size={16} />
                          <span>Activate</span>
                        </button>
                        <button
                          onClick={() => handleAction(member.id, 'reject')}
                          className="text-red-600 hover:text-red-900 inline-flex items-center space-x-1"
                        >
                          <XCircle size={16} />
                          <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {members.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No pending members</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}