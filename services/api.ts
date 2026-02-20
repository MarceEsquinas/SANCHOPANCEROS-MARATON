
import { User, Workout, Role, WeightEntry } from '../types';

const API_BASE = '/api';

export const api = {
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async login(username: string): Promise<User | null> {
    const res = await fetch(`${API_BASE}/users?name=${encodeURIComponent(username)}`);
    if (!res.ok) return null;
    const users = await res.json();
    return users.length > 0 ? users[0] : null;
  },

  async registerUser(name: string): Promise<User> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role: Role.USER })
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/users?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete user');
  },

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const res = await fetch(`${API_BASE}/users?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Update failed');
  },

  async registerWeight(userId: string, weight: number, weightHistory: WeightEntry[]): Promise<void> {
    const month = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date());
    const newEntry = { month, value: weight };
    const updatedHistory = [...weightHistory, newEntry];
    await this.updateUser(userId, { weightHistory: updatedHistory });
  },

  async getWorkouts(planId: string, userId: string): Promise<Workout[]> {
    const res = await fetch(`${API_BASE}/workouts?planId=${planId}&userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch workouts');
    return res.json();
  },

  async updateWorkout(workoutId: string, userId: string, updates: Partial<Workout>): Promise<void> {
    const res = await fetch(`${API_BASE}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workoutId, userId, ...updates })
    });
    if (!res.ok) throw new Error('Workout update failed');
  },

  async initDatabase(): Promise<void> {
    const res = await fetch(`${API_BASE}/init`, { method: 'POST' });
    if (!res.ok) throw new Error('Database initialization failed');
  }
};
