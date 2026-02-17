
import React, { useState } from 'react';
import { Workout } from '../types';
import { api } from '../services/api';
import { SUCCESS_MESSAGES } from '../constants';

interface WorkoutSectionProps {
  planId: string;
  workouts: Workout[];
  onRefresh: () => void;
  isAdmin: boolean;
  userId: string;
}

const WorkoutSection: React.FC<WorkoutSectionProps> = ({ planId, workouts, onRefresh, isAdmin, userId }) => {
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  
  const [feelings, setFeelings] = useState("");
  const [actualDistance, setActualDistance] = useState<string>("");
  const [duration, setDuration] = useState("");
  const [hasInjury, setHasInjury] = useState(false);
  const [injuryNote, setInjuryNote] = useState("");

  // Cronología: Semana 1, 2, 3...
  const weeks: number[] = Array.from<number>(new Set(workouts.map(w => w.week))).sort((a: number, b: number) => a - b);
  const totalWeeks = weeks.length;

  const handleToggle = async (workout: Workout) => {
    if (isAdmin || workout.skipped) return;

    if (workout.completed) {
        await api.updateWorkout(workout.id, userId, { completed: false });
        onRefresh();
        return;
    }

    // Validación de orden
    const prevWorkout = workouts.find(w => w.order === workout.order - 1);
    if (prevWorkout && !prevWorkout.completed && !prevWorkout.skipped) {
      setError("TE ESTOY VIENDO ZAMPABOLLOS. COMPLETA O SALTA EL ANTERIOR.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setActiveWorkoutId(workout.id);
    setActualDistance(workout.distanceKm.toString());
  };

  const saveCompletion = async () => {
    if (!activeWorkoutId) return;
    await api.updateWorkout(activeWorkoutId, userId, {
      completed: true,
      skipped: false,
      feelings,
      actualDistanceKm: parseFloat(actualDistance) || 0,
      duration,
      hasInjury,
      injuryNote: hasInjury ? injuryNote : undefined
    });
    setSuccessMsg(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
    setActiveWorkoutId(null);
    setFeelings(""); setActualDistance(""); setDuration(""); setHasInjury(false); setInjuryNote("");
    onRefresh();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-32">
      {error && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-4 rounded-full font-black text-xl z-[150] animate-bounce border-4 border-white">{error}</div>}
      {successMsg && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-8 py-4 rounded-full font-black text-xl z-[150] animate-pulse border-4 border-white">{successMsg}</div>}

      {weeks.map(week => {
        const weeklyDone = workouts.filter(w => w.week === week && w.completed).reduce((acc, w) => acc + (w.actualDistanceKm || w.distanceKm || 0), 0);
        const weeklyGoal = workouts.filter(w => w.week === week).reduce((acc, w) => acc + (w.distanceKm || 0), 0);
        const remainingWeeks = totalWeeks - week + 1;
        
        return (
          <div key={week} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 px-8 py-6 flex justify-between items-center border-b border-white/5">
              <div>
                <h3 className="font-display text-4xl font-black italic text-white uppercase tracking-tighter">SEMANA {week}</h3>
                <p className="text-[10px] text-red-600 font-black uppercase tracking-[0.3em]">
                  {remainingWeeks === 1 ? 'ÚLTIMA SEMANA' : `QUEDAN ${remainingWeeks} SEMANAS`}
                </p>
              </div>
              <div className="text-right">
                <span className="font-display text-5xl text-white font-black">{weeklyDone.toFixed(1)}</span>
                <span className="text-zinc-600 font-display text-2xl ml-2">/ {weeklyGoal.toFixed(1)} KM</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {workouts.filter(w => w.week === week).map(workout => (
                <div key={workout.id} className={`p-6 rounded-2xl flex items-center justify-between transition-all border ${workout.completed ? 'bg-zinc-800/40 border-green-500/30' : 'bg-zinc-800 border-white/5'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-[9px] font-black bg-zinc-700 text-zinc-400 px-2 py-1 rounded">DÍA {((workout.order - 1) % 4) + 1}</span>
                       <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">{workout.distanceKm} KM OBJETIVO</span>
                    </div>
                    <p className="text-white font-bold text-xl">{workout.description}</p>
                    {workout.feelings && <p className="text-sm italic text-zinc-500 mt-2">"{workout.feelings}"</p>}
                  </div>
                  <button onClick={() => handleToggle(workout)} className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all ${workout.completed ? 'bg-green-600 border-green-400 text-white' : 'bg-black border-zinc-800 hover:border-red-600'}`}>
                    {workout.completed ? '✓' : ''}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {activeWorkoutId && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
          <div className="bg-zinc-900 border-2 border-red-600 p-10 rounded-[3rem] w-full max-w-xl shadow-2xl">
            <h2 className="font-display text-6xl font-black mb-8 text-white uppercase italic text-center">REPORTE DE BATALLA</h2>
            <div className="space-y-6">
              <textarea value={feelings} onChange={(e) => setFeelings(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-6 text-white outline-none focus:border-red-600 h-32" placeholder="Sensaciones del entreno..." />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={actualDistance} onChange={(e) => setActualDistance(e.target.value)} className="bg-black border border-zinc-800 rounded-2xl p-4 text-white text-center font-bold" placeholder="KM REALES" />
                <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-black border border-zinc-800 rounded-2xl p-4 text-white text-center font-bold" placeholder="HH:MM:SS" />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setActiveWorkoutId(null)} className="flex-1 py-4 font-black text-zinc-600 uppercase tracking-widest text-xs">CANCELAR</button>
                <button onClick={saveCompletion} className="flex-[2] py-4 bg-red-600 text-white font-black text-xl rounded-2xl shadow-lg shadow-red-600/20">CONFIRMAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutSection;
