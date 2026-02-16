
import { User, Role, Workout, TrainingPlan, WeightEntry } from '../types';
import { MARATHONS } from '../constants';

const USERS_KEY = 'sp_users';
const WORKOUTS_KEY = 'sp_workouts'; // Global definitions
const USER_PROGRESS_KEY = 'sp_user_progress'; // Per-user completion data

const INITIAL_USERS: User[] = [
  { id: '1', name: 'admin', role: Role.ADMIN },
  { id: '2', name: 'corredor1', role: Role.USER, weightHistory: [{ month: 'Enero', value: 75 }], monthlyKmGoal: 120 }
];

const calculateWeeksUntil = (targetDate: string): number => {
  const now = new Date();
  const target = new Date(targetDate);
  const diffTime = target.getTime() - now.getTime();
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return diffWeeks > 0 ? diffWeeks : 12; // Fallback to 12 if date passed
};

const generateWorkouts = (planId: string): Workout[] => {
  const marathon = MARATHONS.find(m => m.id === planId);
  const totalWeeks = marathon ? calculateWeeksUntil(marathon.date) : 12;
  
  const workouts: Workout[] = [];
  for (let w = 1; w <= totalWeeks; w++) {
    for (let d = 1; d <= 4; d++) {
      workouts.push({
        id: `${planId}-w${w}-d${d}`,
        planId,
        week: w,
        order: (w - 1) * 4 + d,
        description: "Entrenamiento por definir",
        completed: false,
        skipped: false,
        distanceKm: 0,
        hasInjury: false
      });
    }
  }
  return workouts;
};

class MockDB {
  constructor() {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(WORKOUTS_KEY)) {
      const allWorkouts = [...generateWorkouts('bcn'), ...generateWorkouts('mad')];
      localStorage.setItem(WORKOUTS_KEY, JSON.stringify(allWorkouts));
    }
    if (!localStorage.getItem(USER_PROGRESS_KEY)) {
      localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify({}));
    }
  }

  getUsers(): User[] {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  }

  registerUser(name: string): User | null {
    const users = this.getUsers();
    if (users.find(u => u.name.toLowerCase() === name.toLowerCase())) return null;
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      role: Role.USER,
      weightHistory: [],
      monthlyKmGoal: 0
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }

  deleteUser(id: string) {
    const users = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    // Cascade delete progress
    const allProgress = JSON.parse(localStorage.getItem(USER_PROGRESS_KEY) || '{}');
    delete allProgress[id];
    localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(allProgress));
  }

  deleteWeightEntry(userId: string, month: string) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user && user.weightHistory) {
      user.weightHistory = user.weightHistory.filter(h => h.month !== month);
      this.updateUser(userId, { weightHistory: user.weightHistory });
    }
  }

  getWorkouts(planId: string, userId: string): Workout[] {
    const definitions = JSON.parse(localStorage.getItem(WORKOUTS_KEY) || '[]');
    const progress = JSON.parse(localStorage.getItem(USER_PROGRESS_KEY) || '{}')[userId] || {};
    
    return definitions
      .filter((w: Workout) => w.planId === planId)
      .map((w: Workout) => ({
        ...w,
        ...(progress[w.id] || {})
      }))
      .sort((a: Workout, b: Workout) => a.order - b.order);
  }

  updateWorkout(workoutId: string, userId: string, updates: Partial<Workout>) {
    if (updates.description !== undefined || updates.distanceKm !== undefined) {
      const definitions = JSON.parse(localStorage.getItem(WORKOUTS_KEY) || '[]');
      const index = definitions.findIndex((w: Workout) => w.id === workoutId);
      if (index !== -1) {
        definitions[index] = { ...definitions[index], ...updates };
        localStorage.setItem(WORKOUTS_KEY, JSON.stringify(definitions));
      }
    }

    const allProgress = JSON.parse(localStorage.getItem(USER_PROGRESS_KEY) || '{}');
    if (!allProgress[userId]) allProgress[userId] = {};
    
    const { description, distanceKm, ...userUpdates } = updates;
    allProgress[userId][workoutId] = {
      ...(allProgress[userId][workoutId] || {}),
      ...userUpdates
    };
    
    localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(allProgress));
  }
}

export const db = new MockDB();
