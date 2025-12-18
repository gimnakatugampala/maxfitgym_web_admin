'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { Save, ArrowLeft, Plus, X, Upload, Image as ImageIcon, Dumbbell, Target, Loader } from 'lucide-react';
import Link from 'next/link';
import { getYouTubeId } from '@/lib/utils';
import toast from 'react-hot-toast';


export default function EditWorkoutPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sets: '',
    reps: '',
    workout_type_id: '1',
  });
  const [videoUrls, setVideoUrls] = useState(['']);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const currentUser = supabaseApi.getUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      fetchWorkout();
    }
  }, [router, params.id]);

  const fetchWorkout = async () => {
    try {
      const workout = await supabaseApi.getWorkout(params.id);
      if (workout) {
        setFormData({
          name: workout.name || '',
          description: workout.description || '',
          sets: workout.sets || '',
          reps: workout.reps || '',
          workout_type_id: workout.workout_type_id || '1',
        });
        
        // Set existing image
        if (workout.image_url) {
          setExistingImageUrl(workout.image_url);
          setImagePreview(workout.image_url);
        }
        
        const videos = await supabaseApi.getWorkoutVideos(params.id);
        if (videos && videos.length > 0) {
          setVideoUrls(videos.map(v => v.video_url));
        }
      }
    } catch (error) {
      console.error('Error fetching workout:', error);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (JPG, PNG, GIF, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return
    }
    
    setSaving(true);
    const toastId = toast.loading('Updating workout...');
    try {
      let imageUrl = existingImageUrl;
      
      // Upload new image if selected
      if (imageFile) {
        setUploading(true);
        try {
          // Delete old image if exists
          if (existingImageUrl) {
            await supabaseApi.deleteWorkoutImage(existingImageUrl);
          }
          // Upload new image
          imageUrl = await supabaseApi.uploadWorkoutImage(imageFile);
          console.log('Image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Failed to upload image. Please try again.', { id: toastId });
          setSaving(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }
      
      const workoutData = {
        name: formData.name,
        description: formData.description,
        sets: parseInt(formData.sets),
        reps: parseInt(formData.reps),
        workout_type_id: parseInt(formData.workout_type_id),
        image_url: imageUrl,
      };
      
      await supabaseApi.updateWorkout(params.id, workoutData);
      
      // Delete old videos and add new ones
      await supabaseApi.deleteWorkoutVideos(params.id);
      const validUrls = videoUrls.filter(url => url.trim() !== '');
      for (const url of validUrls) {
        await supabaseApi.createWorkoutVideo({
          workout_id: params.id,
          video_url: url,
          is_deleted: false,
        });
      }
      
      toast.success('Workout updated successfully!', { id: toastId });
      router.push('/workouts');
    } catch (error) {
      console.error('Error updating workout:', error);
      toast.error(error.message || 'Failed to update workout', { id: toastId });
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
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-100 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link
              href="/workouts"
              className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-6 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              <span className="font-medium">Back to Workouts</span>
            </Link>

            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <div className="flex items-center space-x-4 mb-2">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl">
                  <Dumbbell className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Edit Workout</h1>
                  <p className="text-gray-600 mt-1">Update workout exercise details</p>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-6">
                <h2 className="text-xl font-semibold text-white">Workout Information</h2>
                <p className="text-purple-100 text-sm mt-1">Update the fields below</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8">
                <div className="space-y-6">
                  {/* Image Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50">
                  <label className="flex items-center text-gray-700 text-sm font-bold mb-3">
                    <ImageIcon size={18} className="mr-2 text-gray-500" />
                    Workout Image
                  </label>
                    
                    {!imagePreview ? (
                      <div className="text-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="image-upload"
                          disabled={uploading || saving}
                        />
                        <label
                          htmlFor="image-upload"
                          className={`cursor-pointer inline-flex flex-col items-center ${
                            uploading || saving ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4 hover:from-purple-200 hover:to-pink-200 transition-all">
                            {uploading ? (
                              <Loader size={48} className="text-purple-600 animate-spin" />
                            ) : (
                              <Upload size={48} className="text-purple-600" />
                            )}
                          </div>
                          <span className="text-sm font-semibold text-gray-700 mb-1">
                            {uploading ? 'Uploading...' : 'Click to upload workout image'}
                          </span>
                          <span className="text-xs text-gray-500">
                            PNG, JPG, GIF up to 5MB
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Workout preview"
                          className="w-full h-64 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={uploading || saving}
                          className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50"
                        >
                          <X size={20} />
                        </button>
                        <div className="mt-4 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading || saving}
                            className="text-purple-600 hover:text-purple-800 font-medium text-sm disabled:opacity-50"
                          >
                            Change Image
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {uploading && (
                      <div className="mt-4 flex items-center justify-center text-sm text-purple-600">
                        <Loader size={16} className="animate-spin mr-2" />
                        <span>Uploading image to cloud storage...</span>
                      </div>
                    )}
                  </div>

                  {/* Workout Name */}
                  <div>
                    <label className="flex items-center text-gray-700 text-sm font-bold mb-3">
                      <Dumbbell size={18} className="mr-2 text-gray-500" />
                      Workout Name <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 ${
                        errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-purple-500'
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all`}
                      placeholder="e.g., Push-ups, Squats, Bench Press"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-2 flex items-center">
                        <span className="mr-1">⚠</span>
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-3">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 focus:border-purple-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                      placeholder="Describe the workout exercise, proper form, and benefits..."
                    />
                  </div>

                  {/* Sets and Reps */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center text-gray-700 text-sm font-bold mb-3">
                        <Target size={18} className="mr-2 text-gray-500" />
                        Sets <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        name="sets"
                        value={formData.sets}
                        onChange={handleChange}
                        min="1"
                        className={`w-full px-4 py-3 border-2 ${
                          errors.sets ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-purple-500'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all`}
                        placeholder="3"
                      />
                      {errors.sets && (
                        <p className="text-red-500 text-xs mt-2 flex items-center">
                          <span className="mr-1">⚠</span>
                          {errors.sets}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center text-gray-700 text-sm font-bold mb-3">
                        <Target size={18} className="mr-2 text-gray-500" />
                        Reps <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        name="reps"
                        value={formData.reps}
                        onChange={handleChange}
                        min="1"
                        className={`w-full px-4 py-3 border-2 ${
                          errors.reps ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-purple-500'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all`}
                        placeholder="10"
                      />
                      {errors.reps && (
                        <p className="text-red-500 text-xs mt-2 flex items-center">
                          <span className="mr-1">⚠</span>
                          {errors.reps}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Workout Type */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-3">
                      Workout Type
                    </label>
                    <select
                      name="workout_type_id"
                      value={formData.workout_type_id}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 focus:border-purple-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all bg-white"
                    >
                      <option value="1">Strength Training</option>
                      <option value="2">Cardio</option>
                      <option value="3">Flexibility</option>
                      <option value="4">Balance</option>
                    </select>
                  </div>

                  {/* Video URLs - same as Add page */}
                  <div className="border-2 border-gray-200 rounded-2xl p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <label className="flex items-center text-gray-700 text-sm font-bold">
                        <Upload size={18} className="mr-2 text-gray-500" />
                        Video URLs (YouTube)
                      </label>
                      <button
                        type="button"
                        onClick={addVideoUrl}
                        className="text-purple-600 hover:text-purple-800 flex items-center space-x-1 text-sm font-semibold transition-colors"
                      >
                        <Plus size={16} />
                        <span>Add Video</span>
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {videoUrls.map((url, index) => (
                        <div key={index} className="flex space-x-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handleVideoUrlChange(index, e.target.value)}
                            className="flex-1 px-4 py-3 border-2 border-gray-300 focus:border-purple-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                            placeholder="https://www.youtube.com/watch?v=..."
                          />
                          {videoUrls.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVideoUrl(index)}
                              className="text-red-600 hover:text-red-800 p-3 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <X size={20} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {videoUrls.some(url => url.trim() !== '') && (
                      <div className="mt-6 space-y-4">
                        <p className="text-sm font-semibold text-gray-700">Preview:</p>
                        {videoUrls.filter(url => url.trim() !== '').map((url, index) => {
                          const videoId = getYouTubeId(url);
                          return videoId ? (
                            <div key={index} className="aspect-video rounded-xl overflow-hidden shadow-lg">
                              <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title={`Video ${index + 1}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {saving || uploading ? (
                      <>
                        <Loader size={20} className="animate-spin" />
                        <span className="font-semibold">
                          {uploading ? 'Uploading Image...' : 'Updating Workout...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        <span className="font-semibold">Update Workout</span>
                      </>
                    )}
                  </button>
                  <Link
                    href="/workouts"
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-4 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center font-semibold"
                  >
                    Cancel
                  </Link>
                </div>

                {/* Help Text */}
                <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="text-sm text-purple-800">
                    <span className="font-semibold">💡 Tip:</span> Images are stored securely in Supabase Cloud Storage. Changing the image will automatically delete the old one.
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