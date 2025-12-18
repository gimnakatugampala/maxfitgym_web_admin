'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Trash2, Search, Shield, Mail, Calendar, User, Filter, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminListPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = supabaseApi.getUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      fetchAdmins();
    }
  }, [router]);

  const fetchAdmins = async () => {
    try {
      const data = await supabaseApi.getAdmins();
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load administrators');
    }
    setLoading(false);
  };

  const handleDelete = async (id, name) => {
    toast((t) => (
      <div className="flex flex-col space-y-3">
        <div>
          <p className="font-semibold text-gray-900">Delete Administrator</p>
          <p className="text-sm text-gray-600 mt-1">
            Are you sure you want to delete <span className="font-semibold">{name}</span>?
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const toastId = toast.loading('Deleting administrator...');
              try {
                await supabaseApi.updateAdmin(id, { is_deleted: true });
                toast.success('Administrator deleted successfully', { id: toastId });
                fetchAdmins();
              } catch (error) {
                console.error('Error deleting admin:', error);
                toast.error('Failed to delete administrator', { id: toastId });
              }
            }}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
          >
            Delete
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

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || admin.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const getInitials = (name) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeColor = (role) => {
    switch(role?.toLowerCase()) {
      case 'superadmin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'moderator': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Management</h1>
                <p className="text-gray-600 flex items-center space-x-2">
                  <Shield size={18} className="text-blue-600" />
                  <span>Manage administrator accounts and permissions</span>
                </p>
              </div>
              <Link
                href="/admin/add"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus size={20} />
                <span className="font-semibold">Add New Admin</span>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Admins</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{admins.length}</p>
                </div>
                <div className="bg-blue-100 p-4 rounded-xl">
                  <Shield className="text-blue-600" size={32} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Active Admins</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {admins.filter(a => a.is_active !== false).length}
                  </p>
                </div>
                <div className="bg-green-100 p-4 rounded-xl">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Super Admins</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {admins.filter(a => a.role?.toLowerCase() === 'superadmin').length}
                  </p>
                </div>
                <div className="bg-purple-100 p-4 rounded-xl">
                  <User className="text-purple-600" size={32} />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Filter size={20} className="text-gray-600" />
                  <span className="font-medium text-gray-700">
                    {filterRole === 'all' ? 'All Roles' : filterRole}
                  </span>
                </button>
                
                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10">
                    <button
                      onClick={() => { setFilterRole('all'); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${filterRole === 'all' ? 'bg-blue-50 text-blue-600' : ''}`}
                    >
                      All Roles
                    </button>
                    <button
                      onClick={() => { setFilterRole('superadmin'); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${filterRole === 'superadmin' ? 'bg-blue-50 text-blue-600' : ''}`}
                    >
                      Super Admin
                    </button>
                    <button
                      onClick={() => { setFilterRole('admin'); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${filterRole === 'admin' ? 'bg-blue-50 text-blue-600' : ''}`}
                    >
                      Admin
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {searchTerm && (
              <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
                <span>Showing {filteredAdmins.length} result{filteredAdmins.length !== 1 ? 's' : ''}</span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Admin Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {filteredAdmins.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Administrator
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Joined Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAdmins.map((admin) => (
                      <tr 
                        key={admin.id} 
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                                {getInitials(admin.full_name)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">
                                {admin.full_name || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: #{admin.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <Mail size={16} className="text-gray-400" />
                            <span>{admin.email}</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getRoleBadgeColor(admin.role)}`}>
                            {admin.role || 'Admin'}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar size={16} className="text-gray-400" />
                            <span>{formatDate(admin.created_at)}</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          {admin.is_active !== false ? (
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                              <span className="text-sm font-medium text-green-800">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 rounded-full bg-red-500"></div>
                              <span className="text-sm font-medium text-red-800">Inactive</span>
                            </div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleDelete(admin.id, admin.full_name)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete admin"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                  <Shield size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No admins found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Get started by adding your first administrator'}
                </p>
                {!searchTerm && (
                  <Link
                    href="/admin/add"
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={20} />
                    <span>Add First Admin</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {filteredAdmins.length > 0 && (
            <div className="mt-6 flex items-center justify-between bg-white rounded-2xl shadow-lg px-6 py-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredAdmins.length}</span> administrator{filteredAdmins.length !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-gray-500">
                Total: {admins.length} admin{admins.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}