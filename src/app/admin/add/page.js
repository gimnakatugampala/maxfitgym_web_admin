'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddAdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });
  const [errors, setErrors] = useState({});
  const router = useRouter();

  // useEffect(() => {
  //   const currentUser = supabaseApi.getUser();
  //   if (!currentUser) {
  //     router.push('/login');
  //   } else {
  //     setUser(currentUser);
  //     setLoading(false);
  //   }
  // }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      await supabaseApi.createAdmin({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: 'admin',
      });
      
      alert('Admin created successfully!');
      router.push('/admin');
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('Failed to create admin: ' + error.message);
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

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="mb-6">
            <Link
              href="/admin"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft size={20} className="mr-1" />
              Back to Admin List
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Add New Admin</h1>
            <p className="text-gray-600 mt-1">Create a new admin user</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="admin@maxfitgym.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Enter password"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.full_name ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="John Doe"
                  />
                  {errors.full_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center space-x-2"
                >
                  <Save size={20} />
                  <span>{saving ? 'Creating...' : 'Create Admin'}</span>
                </button>
                <Link
                  href="/admin"
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}