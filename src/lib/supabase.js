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
    
    // ... existing fetch code ...
    const response = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
      ...options,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token || SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      
      // --- ADD THIS FIX ---
      // If unauthorized (401) or Token Expired, log them out
      if (response.status === 401 || (error.message && error.message.includes("JWT expired"))) {
        console.warn("Session expired. Logging out...");
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase_token');
          localStorage.removeItem('supabase_user');
          window.location.href = '/'; // Force redirect to Login page
        }
        return null; // Stop the crash
      }
      // ---------------------

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
    return this.request('/workout?select=*,workout_type(workout_type)&is_deleted=eq.false&order=created_date.desc');
  },

  async getWorkout(id) {
    const data = await this.request(`/workout?id=eq.${id}&select=*,workout_type(workout_type)`);
    return data[0];
  },

  async createWorkout(data) {
    return this.request('/workout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateWorkout(id, data) {
    return this.request(`/workout?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteWorkout(id) {
    return this.request(`/workout?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_deleted: true }),
    });
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
    return this.request(`/workout_video?workout_id=eq.${workoutId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_deleted: true }),
    });
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