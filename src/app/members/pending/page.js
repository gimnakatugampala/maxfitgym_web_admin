'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../../components/LoadingSpinner'; // Adjust path as needed
import { CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PendingMembersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const currentUser = supabaseApi.getUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      fetchPendingMembers();
    }
  }, [router]);

  const fetchPendingMembers = async () => {
    try {
      setLoading(true);
      // Use the new specific API call
      const data = await supabaseApi.getPendingMembers();
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load pending members');
    }
    setLoading(false);
  };

  const handleAction = async (memberId, memberName, action) => {
    const actionText = action === 'activate' ? 'activate' : 'reject';
    
    toast((t) => (
      <div className="flex flex-col space-y-3">
        <div>
          <p className="font-semibold text-gray-900">
            {action === 'activate' ? 'Activate Member' : 'Reject Member'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Are you sure you want to {actionText} <span className="font-semibold">{memberName}</span>?
          </p>
          {action === 'reject' && (
             <p className="text-xs text-red-500 mt-1">This will remove the user application.</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const toastId = toast.loading(`${action === 'activate' ? 'Activating' : 'Rejecting'} member...`);
              
              try {
                if (action === 'activate') {
                    await supabaseApi.activateMember(memberId);
                } else {
                    // Rejecting implies soft-deleting the request
                    await supabaseApi.rejectMember(memberId);
                }

                toast.success(
                  `Member ${action === 'activate' ? 'activated' : 'rejected'} successfully`, 
                  { id: toastId }
                );
                
                // Refresh the list to remove the processed member
                fetchPendingMembers();
              } catch (error) {
                console.error('Error updating member:', error);
                toast.error('Failed to update member status', { id: toastId });
              }
            }}
            className={`flex-1 ${
              action === 'activate' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            } text-white px-4 py-2 rounded-lg transition text-sm font-medium`}
          >
            {action === 'activate' ? 'Activate' : 'Reject'}
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
                        {member.membership_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {/* Fixed: using first_name + last_name based on your schema */}
                        {member.first_name} {member.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.phone_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* Fixed: using created_date based on your schema */}
                        {formatDate(member.created_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleAction(member.id, `${member.first_name} ${member.last_name}`, 'activate')}
                          className="text-green-600 hover:text-green-900 inline-flex items-center space-x-1"
                        >
                          <CheckCircle size={16} />
                          <span>Activate</span>
                        </button>
                        <button
                          onClick={() => handleAction(member.id, `${member.first_name} ${member.last_name}`, 'reject')}
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
                <p className="text-gray-500">No pending members found.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}