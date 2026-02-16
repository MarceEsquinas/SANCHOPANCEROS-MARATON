
import { User, Workout, Role } from '../types';

const API_BASE = '/api';

export const api = {
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },

  async login(username: string): Promise<User | null> {
    const res = await fetch(`${API_BASE}/users?name=${username}`);
    const users = await res.json();
    return users.length > 0 ? users[0] : null;
  },

  async registerUser(name: string): Promise<User> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role: Role.USER })
    });
    return res.json();
  },

  async deleteUser(id: string): Promise<void> {
    await fetch(`${API_BASE}/users?id=${id}`, { method: 'DELETE' });
  },

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await fetch(`${API_BASE}/users?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  },

  async getWorkouts(planId: string, userId: string): Promise<Workout[]> {
    const res = await fetch(`${API_BASE}/workouts?planId=${planId}&userId=${userId}`);
    return res.json();
  },

  async updateWorkout(workoutId: string, userId: string, updates: Partial<Workout>): Promise<void> {
    await fetch(`${API_BASE}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workoutId, userId, ...updates })
    });
  }
};
