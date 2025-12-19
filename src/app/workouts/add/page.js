'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Save, ArrowLeft, Plus, X, Video, Upload, Image as ImageIcon, Dumbbell, Target, Loader, Clock } from 'lucide-react';
import Link from 'next/link';
import { getYouTubeId } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AddWorkoutPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [workoutTypes, setWorkoutTypes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sets: '',
    reps: '',
    duration: '',
    workout_type_id: '1',
  });
  const [videoUrls, setVideoUrls] = useState(['']);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = supabaseApi.getUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      fetchWorkoutTypes();
    }
  }, [router]);

  const fetchWorkoutTypes = async () => {
    try {
      const types = await supabaseApi.getWorkoutTypes();
      setWorkoutTypes(types || []);
    } catch (error) {
      console.error('Error fetching workout types:', error);
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
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (JPG, PNG, GIF, etc.)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      
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

  // Check if selected workout type is "Duration" based (Cardio)
  const isDurationBased = () => {
    const selectedType = workoutTypes.find(t => t.id === parseInt(formData.workout_type_id));
    return selectedType?.workout_type?.toLowerCase() === 'duration';
  };

  // Check if selected workout type is "Sets" based (Strength Training)
  const isSetsBased = () => {
    const selectedType = workoutTypes.find(t => t.id === parseInt(formData.workout_type_id));
    return selectedType?.workout_type?.toLowerCase() === 'sets';
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Workout name is required';
    }
    
    if (isSetsBased()) {
      if (!formData.sets || formData.sets < 1) {
        newErrors.sets = 'Sets must be at least 1';
      }
      
      if (!formData.reps || formData.reps < 1) {
        newErrors.reps = 'Reps must be at least 1';
      }
    }
    
    if (isDurationBased()) {
      if (!formData.duration || formData.duration < 1) {
        newErrors.duration = 'Duration must be at least 1 minute';
      }
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
    const toastId = toast.loading('Creating workout...');

    try {
      let imageUrl = null;
      
      if (imageFile) {
        setUploading(true);
        try {
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
        sets: isSetsBased() ? parseInt(formData.sets) : 0,
        reps: isSetsBased() ? parseInt(formData.reps) : 0,
        duration: isDurationBased() ? parseInt(formData.duration) : 0,
        workout_type_id: parseInt(formData.workout_type_id),
        image_url: imageUrl,
        is_deleted: false,
      };
      
      const workout = await supabaseApi.createWorkout(workoutData);
      
      const validUrls = videoUrls.filter(url => url.trim() !== '');
      for (const url of validUrls) {
        await supabaseApi.createWorkoutVideo({
          workout_id: workout[0].id,
          video_url: url,
          is_deleted: false,
        });
      }
      
      toast.success('Workout created successfully!', { id: toastId });
      router.push('/workouts');
    } catch (error) {
      console.error('Error creating workout:', error);
      toast.error(error.message || 'Failed to create workout', { id: toastId });
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
            <Link
              href="/workouts"
              className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-6 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              <span className="font-medium">Back to Workouts</span>
            </Link>

            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <div className="flex items-center space-x-4 mb-2">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl">
                  <Dumbbell className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Add New Workout</h1>
                  <p className="text-gray-600 mt-1">Create a new workout exercise with details</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-6">
                <h2 className="text-xl font-semibold text-white">Workout Information</h2>
                <p className="text-purple-100 text-sm mt-1">Fill in all the required fields below</p>
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
                      placeholder="e.g., Push-ups, Squats, Bench Press, Running"
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

                  {/* Workout Type */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-3">
                      Workout Type <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      name="workout_type_id"
                      value={formData.workout_type_id}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 focus:border-purple-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all bg-white"
                    >
                      {workoutTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.workout_type}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      {isSetsBased() && '📊 Sets-based workout (strength training)'}
                      {isDurationBased() && '⏱️ Duration-based workout (cardio)'}
                    </p>
                  </div>

                  {/* Conditional Fields: Sets & Reps OR Duration */}
                  {isSetsBased() && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
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
                  )}

                  {isDurationBased() && (
                    <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                      <label className="flex items-center text-gray-700 text-sm font-bold mb-3">
                        <Clock size={18} className="mr-2 text-gray-500" />
                        Duration (minutes) <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        min="1"
                        className={`w-full px-4 py-3 border-2 ${
                          errors.duration ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-green-500'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 transition-all`}
                        placeholder="30"
                      />
                      {errors.duration && (
                        <p className="text-red-500 text-xs mt-2 flex items-center">
                          <span className="mr-1">⚠</span>
                          {errors.duration}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 mt-2">
                        Enter duration in minutes (e.g., 30 for 30 minutes of cardio)
                      </p>
                    </div>
                  )}

                  {/* Video URLs */}
                  <div className="border-2 border-gray-200 rounded-2xl p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <label className="flex items-center text-gray-700 text-sm font-bold">
                        <Video size={18} className="mr-2 text-gray-500" />
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
                          {uploading ? 'Uploading Image...' : 'Creating Workout...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        <span className="font-semibold">Create Workout</span>
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
                    <span className="font-semibold">💡 Tip:</span> Choose "Sets" type for strength training workouts (push-ups, squats) and "Duration" type for cardio exercises (running, cycling). Images are stored securely in Supabase Cloud Storage.
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