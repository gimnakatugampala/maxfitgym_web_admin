'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Save, ArrowLeft, User, Mail, Lock, Shield } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }
    
    setSaving(true);
    const toastId = toast.loading('Creating administrator...');
    
    try {
      await supabaseApi.createAdmin({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: 'admin',
      });
      
      toast.success('Administrator created successfully!', { id: toastId });
      router.push('/admin');
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error(error.message || 'Failed to create administrator', { id: toastId });
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
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link
              href="/admin"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              <span className="font-medium">Back to Admin List</span>
            </Link>

            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <div className="flex items-center space-x-4 mb-2">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Add New Admin</h1>
                  <p className="text-gray-600 mt-1">Create a new administrator account</p>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
                <h2 className="text-xl font-semibold text-white">Administrator Information</h2>
                <p className="text-blue-100 text-sm mt-1">Please fill in all the required fields below</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8">
                <div className="space-y-6">
                  {/* Full Name Field */}
                  <div>
                    <label className="flex items-center text-gray-700 text-sm font-bold mb-3">
                      <User size={18} className="mr-2 text-gray-500" />
                      Full Name <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 ${
                        errors.full_name ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all`}
                      placeholder="John Doe"
                    />
                    {errors.full_name && (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <span className="mr-1">⚠</span>
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="flex items-center text-gray-700 text-sm font-bold mb-3">
                      <Mail size={18} className="mr-2 text-gray-500" />
                      Email Address <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all`}
                      placeholder="admin@maxfitgym.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <span className="mr-1">⚠</span>
                        {errors.email}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-2">This will be used for login credentials</p>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="flex items-center text-gray-700 text-sm font-bold mb-3">
                      <Lock size={18} className="mr-2 text-gray-500" />
                      Password <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 ${
                        errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all`}
                      placeholder="Enter secure password"
                    />
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <span className="mr-1">⚠</span>
                        {errors.password}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-2">Minimum 6 characters required</p>
                  </div>

                  {/* Role Badge */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <Shield className="text-blue-600" size={24} />
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Access Level</p>
                        <p className="text-lg font-bold text-blue-600">Administrator</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 ml-9">
                      Full system access with ability to manage members, workouts, and schedules
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Save size={20} />
                    <span className="font-semibold">
                      {saving ? 'Creating Administrator...' : 'Create Administrator'}
                    </span>
                  </button>
                  <Link
                    href="/admin"
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-4 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center font-semibold"
                  >
                    Cancel
                  </Link>
                </div>

                {/* Help Text */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">💡 Tip:</span> The new administrator will be able to log in immediately using the email and password you provide here.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}