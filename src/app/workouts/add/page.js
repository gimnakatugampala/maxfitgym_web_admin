'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { Save, ArrowLeft, Plus, X, Video } from 'lucide-react';
import Link from 'next/link';
import { getYouTubeId } from '@/lib/utils';

export default function AddWorkoutPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sets: '',
    reps: '',
    workout_type_id: '1',
  });
  const [videoUrls, setVideoUrls] = useState(['']);
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

  const handleVideoUrlChange = (index, value) => {
    const newUrls = [...videoUrls];
    newUrls[index] = value;
    setVideoUrls(newUrls);
  };

  const addVideoUrl = () => {
    setVideoUrls([...videoUrls, '']);
  };

  const removeVideoUrl = (index) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Workout name is required';
    }
    
    if (!formData.sets || formData.sets < 1) {
      newErrors.sets = 'Sets must be at least 1';
    }
    
    if (!formData.reps || formData.reps < 1) {
      newErrors.reps = 'Reps must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const workoutData = {
        name: formData.name,
        description: formData.description,
        sets: parseInt(formData.sets),
        reps: parseInt(formData.reps),
        workout_type_id: parseInt(formData.workout_type_id),
        is_deleted: false,
      };
      
      const workout = await supabaseApi.createWorkout(workoutData);
      
      // Add video URLs
      const validUrls = videoUrls.filter(url => url.trim() !== '');
      for (const url of validUrls) {
        await supabaseApi.createWorkoutVideo({
          workout_id: workout[0].id,
          video_url: url,
          is_deleted: false,
        });
      }
      
      alert('Workout created successfully!');
      router.push('/workouts');
    } catch (error) {
      console.error('Error creating workout:', error);
      alert('Failed to create workout: ' + error.message);
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
              href="/workouts"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft size={20} className="mr-1" />
              Back to Workouts
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Add New Workout</h1>
            <p className="text-gray-600 mt-1">Create a new workout exercise</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Workout Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="e.g., Push-ups"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the workout..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Sets *
                    </label>
                    <input
                      type="number"
                      name="sets"
                      value={formData.sets}
                      onChange={handleChange}
                      min="1"
                      className={`w-full px-3 py-2 border ${
                        errors.sets ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="3"
                    />
                    {errors.sets && (
                      <p className="text-red-500 text-xs mt-1">{errors.sets}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Reps *
                    </label>
                    <input
                      type="number"
                      name="reps"
                      value={formData.reps}
                      onChange={handleChange}
                      min="1"
                      className={`w-full px-3 py-2 border ${
                        errors.reps ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="10"
                    />
                    {errors.reps && (
                      <p className="text-red-500 text-xs mt-1">{errors.reps}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Workout Type
                  </label>
                  <select
                    name="workout_type_id"
                    value={formData.workout_type_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">Strength Training</option>
                    <option value="2">Cardio</option>
                    <option value="3">Flexibility</option>
                    <option value="4">Balance</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-gray-700 text-sm font-bold">
                      Video URLs (YouTube)
                    </label>
                    <button
                      type="button"
                      onClick={addVideoUrl}
                      className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
                    >
                      <Plus size={16} />
                      <span>Add Video</span>
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {videoUrls.map((url, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => handleVideoUrlChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                        {videoUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVideoUrl(index)}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {videoUrls.some(url => url.trim() !== '') && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-gray-600">Preview:</p>
                      {videoUrls.filter(url => url.trim() !== '').map((url, index) => {
                        const videoId = getYouTubeId(url);
                        return videoId ? (
                          <div key={index} className="aspect-video">
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${videoId}`}
                              title={`Video ${index + 1}`}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="rounded-lg"
                            />
                          </div>
                        ) : null;
                      })}
                    </div>
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
                  <span>{saving ? 'Creating...' : 'Create Workout'}</span>
                </button>
                <Link
                  href="/workouts"
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