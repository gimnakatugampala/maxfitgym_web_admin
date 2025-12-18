const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// --- ADD THIS DEBUG BLOCK ---
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("CRITICAL ERROR: Supabase environment variables are missing!");
  console.log("SUPABASE_URL:", SUPABASE_URL);
  console.log("SUPABASE_KEY:", SUPABASE_KEY ? "Loaded" : "Missing");
}
// -----------------------------

export const supabaseApi = {
async request(endpoint, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('supabase_token') : null;
    
    // Fix CORS: Always include proper headers
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token || SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    };
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      
      // If unauthorized (401) or Token Expired, log them out
      if (response.status === 401 || (error.message && error.message.includes("JWT expired"))) {
        console.warn("Session expired. Logging out...");
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase_token');
          localStorage.removeItem('supabase_user');
          window.location.href = '/';
        }
        return null;
      }

      throw new Error(error.message || 'API request failed');
    }
    
    const data = await response.json();
    return data;
  },

  async login(email, password) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('supabase_token', data.access_token);
      localStorage.setItem('supabase_user', JSON.stringify(data.user));
      return { user: data.user, error: null };
    }
    return { user: null, error: data.error || { message: 'Login failed' } };
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase_token');
      localStorage.removeItem('supabase_user');
    }
  },

  getUser() {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('supabase_user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('supabase_token');
  },

  // Admin/User endpoints
  async getAdmins() {
    return this.request('/users?select=*&is_active=eq.true&order=created_at.desc');
  },

  async updateAdmin(id, updates) {
    return this.request(`/users?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async createAdmin(data) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },


 // Workout endpoints
  async getWorkouts() {
    const workouts = await this.request('/workout?select=*,workout_type(id,workout_type)&is_deleted=eq.false&order=created_date.desc');
    
    // Fetch video counts for each workout
    if (workouts && workouts.length > 0) {
      const workoutsWithVideos = await Promise.all(
        workouts.map(async (workout) => {
          const videos = await this.request(`/workout_video?workout_id=eq.${workout.id}&is_deleted=eq.false&select=id`);
          return {
            ...workout,
            video_count: videos?.length || 0
          };
        })
      );
      return workoutsWithVideos;
    }
    
    return workouts;
  },

  async getWorkout(id) {
    const data = await this.request(`/workout?id=eq.${id}&select=*,workout_type(workout_type)`);
    return data[0];
  },

 // ------------------------------------------------------------------
  // CREATE WORKOUT (Auto-generate 'code' column: W_001)
  // ------------------------------------------------------------------
  async createWorkout(data) {
    console.log('Step 1: Generating Workout Code...');

    try {
      // 1. Fetch the last workout to find the highest code
      // We select the 'code' column specifically
      const lastRecord = await this.request('/workout?select=code&order=id.desc&limit=1');

      let nextNum = 1;

      // If a previous record exists with a code, parse it
      if (lastRecord && lastRecord.length > 0 && lastRecord[0].code) {
        // Expected format: "W_001"
        const parts = lastRecord[0].code.split('_'); 
        if (parts.length === 2 && !isNaN(parts[1])) {
          nextNum = parseInt(parts[1], 10) + 1;
        }
      }

      // 2. Format the new code (e.g., 1 -> "W_001", 15 -> "W_015")
      const newCode = `W_${String(nextNum).padStart(3, '0')}`;
      console.log('Generated Code:', newCode);

      // 3. Validate and Prepare Payload
      const payload = {
        ...data,
        sets: Number(data.sets),
        reps: Number(data.reps),
        workout_type_id: Number(data.workout_type_id),
        is_deleted: false,
        code: newCode // <--- Saving to your existing 'code' column
      };

      console.log('Step 2: Sending POST request to Supabase...');
      
      const result = await this.request('/workout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!result || result.length === 0) {
        throw new Error('Workout created but no data returned. Check RLS policies.');
      }

      console.log('Step 3: Workout created successfully!', result[0]);
      return result;

    } catch (error) {
      console.error('CRITICAL ERROR in createWorkout:', error);
      throw error;
    }
  },

  // ------------------------------------------------------------------
  // UPDATE WORKOUT (Using PUT to bypass CORS PATCH issues)
  // ------------------------------------------------------------------
  async updateWorkout(id, updates) {
    console.log('Step 1: Starting update for ID:', id);

    try {
      // 1. Fetch the existing workout first
      // We need the full object because PUT replaces everything
      const currentData = await this.getWorkout(id);
      
      if (!currentData) {
        throw new Error('Workout not found');
      }

      // 2. Merge the existing data with the new updates
      const payload = { ...currentData, ...updates };

      // 3. Clean the payload
      // Remove joined tables (e.g., workout_type object) because they aren't columns in the 'workout' table
      delete payload.workout_type; 
      delete payload.video_count; // Remove if present
      
      // Ensure numeric fields are numbers (HTML forms often send strings)
      if (payload.sets) payload.sets = Number(payload.sets);
      if (payload.reps) payload.reps = Number(payload.reps);
      if (payload.workout_type_id) payload.workout_type_id = Number(payload.workout_type_id);

      // 4. Send PUT request
      console.log('Step 2: Sending PUT request...');
      const result = await this.request(`/workout?id=eq.${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      console.log('Step 3: Workout updated successfully!');
      return result;

    } catch (error) {
      console.error('CRITICAL ERROR in updateWorkout:', error);
      throw error;
    }
  },

 // SOFT DELETE: Set is_deleted = true using PUT (Fetch -> Modify -> Save)
  async deleteWorkout(id) {
    console.log('Starting workout soft deletion for ID:', id);
    
    try {
      // Step 1: Get the workout details first
      const workout = await this.getWorkout(id);
      
      if (!workout) {
        throw new Error('Workout not found');
      }
      
      // Step 2: Delete the image if it exists
      // We wrap this in try/catch so missing images don't stop the deletion
      if (workout.image_url) {
        try {
          await this.deleteWorkoutImage(workout.image_url);
        } catch (error) {
          console.warn('Image delete failed or image missing (continuing):', error);
        }
      }

      // Step 3: Soft delete related videos
      // Since PUT replaces the whole row, we cannot do a "Bulk Update".
      // We must fetch the videos, loop through them, and PUT them back one by one.
      try {
        const videos = await this.getWorkoutVideos(id);
        
        // Loop through and soft-delete each video
        for (const video of videos) {
            const videoUpdate = { ...video, is_deleted: true };
            // IMPORTANT: If 'workout' or other joined tables are in the video object, remove them
            // But getWorkoutVideos usually returns flat data. 
            
            await this.request(`/workout_video?id=eq.${video.id}`, {
                method: 'PUT',
                body: JSON.stringify(videoUpdate)
            });
        }
        console.log('Videos soft deleted successfully');
      } catch (error) {
        console.warn('Failed to soft delete videos:', error);
      }
      
      // Step 4: Soft delete the workout itself
      console.log('Step 4: Soft deleting workout record...');
      
      // Prepare the object for PUT
      const workoutUpdate = { ...workout, is_deleted: true };
      
      // CRITICAL: Remove the "workout_type" object. 
      // Your getWorkout() fetches joined data (e.g. { id: 1, workout_type: { name: 'Cardio' } })
      // If you send that joined object back in a PUT, Supabase will reject it.
      delete workoutUpdate.workout_type; 

      const result = await this.request(`/workout?id=eq.${id}`, {
        method: 'PUT',
        body: JSON.stringify(workoutUpdate),
      });
      
      console.log('Workout soft deleted successfully!');
      return result;

    } catch (error) {
      console.error('Error in deleteWorkout:', error);
      throw error;
    }
  },

   async deleteWorkoutImage(imageUrl) {
    if (!imageUrl) return;
    
    // Extract the file path from the URL
    // URL format: https://project.supabase.co/storage/v1/object/public/workout-images/filename.jpg
    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      
      // Find 'public' in the path, then bucket is next, and rest is the file path
      const publicIndex = pathParts.indexOf('public');
      if (publicIndex === -1 || publicIndex >= pathParts.length - 1) {
        throw new Error('Invalid image URL format - cannot find bucket');
      }
      
      const bucket = pathParts[publicIndex + 1]; // Should be 'workout-images'
      const fileName = pathParts.slice(publicIndex + 2).join('/'); // Rest of the path is the filename
      
      if (!bucket || !fileName) {
        throw new Error('Invalid image URL format - missing bucket or filename');
      }
      
      console.log('Deleting image:', { bucket, fileName, fullUrl: imageUrl });
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('supabase_token') : null;

      const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token || SUPABASE_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete image' }));
        
        // Handle token expiration
        if (response.status === 401) {
          console.warn("Session expired during image deletion");
          if (typeof window !== 'undefined') {
            localStorage.removeItem('supabase_token');
            localStorage.removeItem('supabase_user');
            window.location.href = '/';
          }
          throw new Error('Session expired. Please log in again.');
        }
        
        console.warn('Image deletion failed:', error);
        throw new Error(error.message || 'Failed to delete image');
      }

      console.log('Image deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteWorkoutImage:', error);
      throw error;
    }
  },

  // Workout Video endpoints
  async getWorkoutVideos(workoutId) {
    return this.request(`/workout_video?workout_id=eq.${workoutId}&is_deleted=eq.false&order=created_date.desc`);
  },

  async createWorkoutVideo(data) {
    return this.request('/workout_video', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteWorkoutVideos(workoutId) {
    console.log('Soft deleting videos for workout:', workoutId);
    const token = typeof window !== 'undefined' ? localStorage.getItem('supabase_token') : null;
    
    // Using POST with X-HTTP-Method-Override to bypass CORS PATCH restriction
    const response = await fetch(`${SUPABASE_URL}/rest/v1/workout_video?workout_id=eq.${workoutId}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token || SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'X-HTTP-Method-Override': 'PATCH',
      },
      body: JSON.stringify({ is_deleted: true }),
    });
    
    return response.ok;
  },

  // Schedule endpoints
  async getSchedules() {
    return this.request('/work_schedule?select=*&is_deleted=eq.false&order=created_date.desc');
  },

  async getSchedule(id) {
    const data = await this.request(`/work_schedule?id=eq.${id}&is_deleted=eq.false`);
    return data[0];
  },

  async getScheduleDetails(scheduleId) {
    return this.request(`/workout_schedule_details?schedule_id=eq.${scheduleId}&is_deleted=eq.false&select=*,workout(*),day(name)`);
  },

  async createSchedule(data) {
    return this.request('/work_schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createScheduleDetail(data) {
    return this.request('/workout_schedule_details', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSchedule(id, data) {
    return this.request(`/work_schedule?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteScheduleDetails(scheduleId) {
    return this.request(`/workout_schedule_details?schedule_id=eq.${scheduleId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_deleted: true }),
    });
  },

  // Member endpoints
  async getMembers() {
    return this.request('/members?select=*,platform(name)&is_deleted=eq.false&order=created_date.desc');
  },

  async getMember(id) {
    const data = await this.request(`/members?id=eq.${id}&is_deleted=eq.false&select=*,platform(name)`);
    return data[0];
  },

  async updateMember(id, data) {
    return this.request(`/members?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Attendance endpoints
  async getAttendance(date) {
    // Date should be in format YYYY-MM-DD
    return this.request(`/attendence?select=*,members(membership_id,first_name,last_name)&start_time=gte.${date}T00:00:00&start_time=lt.${date}T23:59:59&order=start_time.desc`);
  },

  async createAttendance(data) {
    return this.request('/attendence', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Body Progress endpoints
  async getWeightProgress(memberId) {
    return this.request(`/weight_progress?member_id=eq.${memberId}&order=date.desc`);
  },

  async createWeightProgress(data) {
    return this.request('/weight_progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getChestProgress(memberId) {
    return this.request(`/chest_progress?member_id=eq.${memberId}&order=date.desc`);
  },

  async getBicepProgress(memberId) {
    return this.request(`/bicep_progress?member_id=eq.${memberId}&order=date.desc`);
  },

  async getHipProgress(memberId) {
    return this.request(`/hip_size_progress?member_id=eq.${memberId}&order=date.desc`);
  },

  // Payment endpoints
  async getPayments(memberId) {
    return this.request(`/payment_members?member_id=eq.${memberId}&order=created_date.desc`);
  },

  async createPayment(data) {
    return this.request('/payment_members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Workout Types
  async getWorkoutTypes() {
    return this.request('/workout_type?select=*&order=id.asc');
  },

  // Days
  async getDays() {
    return this.request('/day?select=*&order=id.asc');
  },

  // Platform
  async getPlatforms() {
    return this.request('/platform?select=*&order=id.asc');
  },

  // Member Schedule endpoints
  async getMemberSchedules(memberId) {
    return this.request(`/member_workout_schedule?member_id=eq.${memberId}&is_active=eq.true&select=*,work_schedule(name,description)`);
  },

  async assignScheduleToMember(data) {
    return this.request('/member_workout_schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

 async uploadWorkoutImage(file) {
    const bucket = 'workout-images'; // IMPORTANT: You must create this bucket in Supabase
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('supabase_token') : null;

    // 1. Upload the file
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token || SUPABASE_KEY}`,
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      
      // Handle token expiration
      if (response.status === 401 || (error.message && error.message.includes("exp"))) {
        console.warn("Session expired during upload. Logging out...");
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase_token');
          localStorage.removeItem('supabase_user');
          window.location.href = '/';
        }
        throw new Error('Session expired. Please log in again.');
      }
      
      throw new Error(error.message || 'Failed to upload image');
    }

    // 2. Get the Public URL
    // Format: https://project.supabase.co/storage/v1/object/public/bucket/file
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`;
  },

  // Dashboard Stats
  async getDashboardStats() {
    try {
      const [members, workouts, schedules, attendance] = await Promise.all([
        this.request('/members?select=id,is_active&is_deleted=eq.false'),
        this.request('/workout?select=id&is_deleted=eq.false'),
        this.request('/work_schedule?select=id&is_deleted=eq.false'),
        this.getAttendance(new Date().toISOString().split('T')[0]),
      ]);

      const activeMembers = members?.filter(m => m.is_active).length || 0;
      const pendingMembers = members?.filter(m => !m.is_active).length || 0;

      return {
        totalMembers: members?.length || 0,
        activeMembers,
        pendingMembers,
        totalWorkouts: workouts?.length || 0,
        totalSchedules: schedules?.length || 0,
        todayAttendance: attendance?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalMembers: 0,
        activeMembers: 0,
        pendingMembers: 0,
        totalWorkouts: 0,
        totalSchedules: 0,
        todayAttendance: 0,
      };
    }
  },
  
};