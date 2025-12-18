'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Save, ArrowLeft, User, Mail, Lock, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AddAdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State matches public.users table columns
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });
  
  const [errors, setErrors] = useState({});
  const router = useRouter();

  useEffect(() => {
    const currentUser = supabaseApi.getUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      setLoading(false);
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please check the form for errors');
      return;
    }
    
    setSaving(true);
    const toastId = toast.loading('Creating administrator...');
    
    try {
      // Calls our updated function in supabase.js
      await supabaseApi.createAdmin({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
      });
      
      toast.success('Administrator created successfully!', { id: toastId });
      
      // Delay redirect slightly for better UX
      setTimeout(() => {
        router.push('/admin');
      }, 1000);
      
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error(error.message || 'Failed to create administrator', { id: toastId });
      setSaving(false);
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
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link
              href="/admin"
              className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors group"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm group-hover:shadow mr-3 transition-all border border-gray-200">
                <ArrowLeft size={18} />
              </div>
              <span className="font-medium">Back to Admin List</span>
            </Link>

            {/* Header Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-8 mb-6 text-white">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Add New Admin</h1>
                  <p className="text-blue-100 mt-1">Create a new administrator account with full access privileges</p>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Administrator Details
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-8">
                <div className="grid gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-100 transition-all outline-none ${
                          errors.full_name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                        }`}
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    {errors.full_name && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center font-medium">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-100 transition-all outline-none ${
                          errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                        }`}
                        placeholder="admin@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center font-medium">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-100 transition-all outline-none ${
                          errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                        }`}
                        placeholder="••••••••"
                      />
                    </div>
                    {errors.password ? (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center font-medium">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                        {errors.password}
                      </p>
                    ) : (
                      <p className="text-gray-400 text-xs mt-1.5 ml-1">Must be at least 6 characters</p>
                    )}
                  </div>

                  {/* Role Display */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-3">
                    <CheckCircle className="text-blue-600 mt-0.5" size={20} />
                    <div>
                      <h4 className="text-sm font-bold text-blue-900">Admin Privileges</h4>
                      <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                        This user will have full access to manage members, workouts, schedules, and view all dashboard statistics.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white px-6 py-3.5 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium shadow-lg shadow-blue-200"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" color="white" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Create Administrator</span>
                      </>
                    )}
                  </button>
                  <Link
                    href="/admin"
                    className="flex-1 bg-white border border-gray-300 text-gray-700 px-6 py-3.5 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center font-medium"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}