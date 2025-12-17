const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseApi = {
  async request(endpoint, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('supabase_token') : null;
    
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
      const error = await response.json();
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

  // Admin endpoints
  async getAdmins() {
    return this.request('/users?select=*&order=created_at.desc');
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
    return this.request('/workout?select=*,workout_type(*)&order=created_date.desc');
  },

  async getWorkout(id) {
    const data = await this.request(`/workout?id=eq.${id}&select=*,workout_type(*)`);
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
      method: 'DELETE',
    });
  },

  // Workout Video endpoints
  async getWorkoutVideos(workoutId) {
    return this.request(`/workout_video?workout_id=eq.${workoutId}&is_deleted=eq.false`);
  },

  async createWorkoutVideo(data) {
    return this.request('/workout_video', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteWorkoutVideos(workoutId) {
    return this.request(`/workout_video?workout_id=eq.${workoutId}`, {
      method: 'DELETE',
    });
  },

  // Schedule endpoints
  async getSchedules() {
    return this.request('/work_schedule?select=*&order=created_date.desc');
  },

  async getSchedule(id) {
    const data = await this.request(`/work_schedule?id=eq.${id}`);
    return data[0];
  },

  async getScheduleDetails(scheduleId) {
    return this.request(`/workout_schedule_details?schedule_id=eq.${scheduleId}&select=*,workout(*)`);
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
      method: 'DELETE',
    });
  },

  // Member endpoints
  async getMembers() {
    return this.request('/members?select=*&order=created_at.desc');
  },

  async getMember(id) {
    const data = await this.request(`/members?id=eq.${id}`);
    return data[0];
  },

  async updateMember(id, data) {
    return this.request(`/members?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
