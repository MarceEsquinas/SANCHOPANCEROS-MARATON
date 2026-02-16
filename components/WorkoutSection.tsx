
import React, { useState } from 'react';
import { Workout } from '../types';
import { db } from '../services/db';
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
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  
  const [editDesc, setEditDesc] = useState("");
  const [editKm, setEditKm] = useState(0);
  
  const [feelings, setFeelings] = useState("");
  const [actualDistance, setActualDistance] = useState<string>("");
  const [duration, setDuration] = useState("");
  const [hasInjury, setHasInjury] = useState(false);
  const [injuryNote, setInjuryNote] = useState("");

  // Sort weeks in ascending order (1, 2, 3...) as requested
  const weeks: number[] = Array.from<number>(new Set(workouts.map(w => w.week))).sort((a: number, b: number) => a - b);
  const maxWeeks = weeks.length > 0 ? Math.max(...weeks) : 0;

  const handleToggle = (workout: Workout) => {
    if (isAdmin) return;
    if (workout.skipped) return;

    if (workout.completed) {
        db.updateWorkout(workout.id, userId, { completed: false });
        onRefresh();
        return;
    }

    const prevWorkout = workouts.find(w => w.order === workout.order - 1);
    if (prevWorkout && !prevWorkout.completed && !prevWorkout.skipped) {
      setError("TE ESTOY VIENDO ZAMPABOLLOS. COMPLETA O SALTA EL ANTERIOR.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setActiveWorkoutId(workout.id);
    setActualDistance(workout.distanceKm.toString());
  };

  const handleSkip = (workout: Workout) => {
    if (isAdmin || workout.completed || workout.skipped) return;
    if (window.confirm("¿Seguro que quieres saltar? Sancho se decepcionará...")) {
      db.updateWorkout(workout.id, userId, { skipped: true, completed: false });
      onRefresh();
    }
  };

  const saveCompletion = () => {
    if (!activeWorkoutId) return;
    db.updateWorkout(activeWorkoutId, userId, {
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

  const handleAdminEdit = (workout: Workout) => {
    setEditingWorkoutId(workout.id);
    setEditDesc(workout.description);
    setEditKm(workout.distanceKm);
  };

  const saveAdminEdit = () => {
    if (editingWorkoutId) {
      db.updateWorkout(editingWorkoutId, userId, { description: editDesc, distanceKm: editKm });
      setEditingWorkoutId(null);
      onRefresh();
    }
  };

  const getWeeklyKm = (week: number): number => {
    return workouts
      .filter(w => w.week === week && w.completed)
      .reduce((acc, w) => acc + (w.actualDistanceKm || w.distanceKm || 0), 0);
  };

  const getWeeklyTotal = (week: number): number => {
    return workouts
      .filter(w => w.week === week)
      .reduce((acc, w) => acc + (w.distanceKm || 0), 0);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-32">
      {error && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-4 rounded-full font-black text-xl shadow-2xl z-[150] border-4 border-white animate-bounce">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-8 py-4 rounded-full font-black text-xl shadow-2xl z-[150] border-4 border-white animate-pulse">
          {successMsg}
        </div>
      )}

      {weeks.map(week => {
        const weeklyDone = getWeeklyKm(week);
        const weeklyGoal = getWeeklyTotal(week);
        const remainingWeeks = maxWeeks - week + 1;
        
        return (
          <div key={week} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-red-900 px-8 py-5 flex justify-between items-center">
              <div>
                <h3 className="font-display text-3xl font-black italic text-white uppercase tracking-tighter">SEMANA {week}</h3>
                <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">
                  QUEDAN {remainingWeeks} {remainingWeeks === 1 ? 'SEMANA' : 'SEMANAS'} PARA EL OBJETIVO
                </p>
              </div>
              <div className="text-right">
                <span className="font-display text-4xl text-white font-black">{weeklyDone.toFixed(1)}</span>
                <span className="text-white/40 font-display text-xl ml-2">/ {weeklyGoal.toFixed(1)} KM</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {workouts.filter(w => w.week === week).map(workout => (
                <div 
                  key={workout.id} 
                  className={`p-5 rounded-2xl flex items-center justify-between border-l-8 transition-all relative overflow-hidden ${
                    workout.completed ? 'bg-zinc-800 border-green-500 opacity-60' : 
                    workout.skipped ? 'bg-zinc-800/20 border-zinc-700 border-l-zinc-700' :
                    'bg-zinc-800/50 border-red-600 hover:bg-zinc-800'
                  }`}
                >
                  {workout.skipped && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-10">
                       <p className="text-zinc-500 font-display text-4xl font-black rotate-[-5deg] border-2 border-zinc-500 px-4 py-1">SALTADO - COBARDE</p>
                    </div>
                  )}

                  <div className="flex-1 mr-4 z-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded italic">DÍA {((workout.order - 1) % 4) + 1}</span>
                      <span className="text-xs font-black text-zinc-500 uppercase">OBJETIVO: {workout.distanceKm} KM</span>
                      {workout.completed && (
                        <span className="text-xs font-black text-green-500 uppercase">REAL: {workout.actualDistanceKm} KM {workout.duration && `(${workout.duration})`}</span>
                      )}
                    </div>
                    
                    {editingWorkoutId === workout.id ? (
                      <div className="space-y-3 p-4 bg-zinc-900 rounded-xl border border-red-500/30">
                        <input 
                          className="w-full bg-zinc-800 text-white p-3 rounded-xl border border-zinc-700 outline-none focus:border-red-600"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Descripción entreno"
                        />
                        <div className="flex items-center gap-4">
                           <label className="text-xs font-black text-zinc-500 uppercase">Distancia (km):</label>
                           <input 
                             type="number"
                             className="bg-zinc-800 text-white p-2 rounded-lg border border-zinc-700 w-24"
                             value={editKm}
                             onChange={(e) => setEditKm(parseFloat(e.target.value) || 0)}
                           />
                           <button onClick={saveAdminEdit} className="flex-1 bg-green-600 text-white py-2 rounded-xl font-black text-sm shadow-lg shadow-green-600/20">GUARDAR CAMBIOS</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white font-bold text-xl leading-tight tracking-tight">{workout.description}</p>
                    )}

                    {workout.feelings && (
                      <div className="mt-3 border-t border-zinc-700 pt-3 flex flex-col gap-1 group/item">
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-zinc-500 italic">" {workout.feelings} "</p>
                          {isAdmin && (
                            <button onClick={() => { if(window.confirm('¿Borrar detalle?')) { db.updateWorkout(workout.id, userId, { feelings: undefined }); onRefresh(); } }} className="text-[10px] text-red-500 opacity-0 group-hover/item:opacity-100 uppercase font-black">BORRAR</button>
                          )}
                        </div>
                        {workout.duration && <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">TIEMPO: {workout.duration}</p>}
                      </div>
                    )}

                    {workout.hasInjury && (
                      <div className="mt-1 flex justify-between items-center group/injury">
                        <p className="text-xs text-red-400 font-bold uppercase">⚠️ Molestia: {workout.injuryNote}</p>
                        {isAdmin && (
                          <button onClick={() => { if(window.confirm('¿Borrar molestia?')) { db.updateWorkout(workout.id, userId, { hasInjury: false, injuryNote: undefined }); onRefresh(); } }} className="text-[10px] text-red-500 opacity-0 group-hover/injury:opacity-100 uppercase font-black">BORRAR</button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 z-20">
                    {isAdmin && (
                      <button 
                        onClick={() => handleAdminEdit(workout)}
                        className="w-10 h-10 bg-zinc-700 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                    )}
                    
                    {!isAdmin && !workout.completed && !workout.skipped && (
                      <button 
                        onClick={() => handleSkip(workout)}
                        className="w-10 h-10 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-zinc-600 hover:text-red-500 hover:border-red-500 transition-all"
                        title="Saltar entrenamiento"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}

                    <button
                      onClick={() => handleToggle(workout)}
                      disabled={isAdmin || workout.skipped}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-2 ${
                        isAdmin ? 'opacity-20 cursor-not-allowed border-zinc-800' :
                        workout.skipped ? 'bg-zinc-900 border-zinc-800 cursor-not-allowed opacity-20' :
                        workout.completed ? 'bg-green-600 border-green-400 text-white shadow-[0_0_20px_rgba(22,163,74,0.4)]' : 
                        'bg-zinc-900 border-zinc-700 hover:border-red-600 group-hover:scale-105'
                      }`}
                    >
                      {workout.completed ? '✓' : ''}
                      {workout.skipped ? '✘' : ''}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {activeWorkoutId && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
          <div className="bg-zinc-900 border-2 border-red-600 p-10 rounded-[2.5rem] w-full max-w-xl shadow-[0_0_80px_rgba(220,38,38,0.4)] max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-6xl font-black mb-8 text-white uppercase italic tracking-tighter text-center">PARTE DE GUERRA</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-2">¿CÓMO HA IDO LA BATALLA?</label>
                <textarea 
                  value={feelings}
                  onChange={(e) => setFeelings(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-6 text-white focus:ring-4 focus:ring-red-600/20 outline-none min-h-[100px] text-lg"
                  placeholder="Sancho te escucha..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-2">DISTANCIA REAL (KM)</label>
                  <input 
                    type="number"
                    value={actualDistance}
                    onChange={(e) => setActualDistance(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-red-600/50 outline-none text-xl font-bold"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-2">TIEMPO (HH:MM:SS)</label>
                  <input 
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-red-600/50 outline-none text-xl font-bold"
                    placeholder="00:00:00"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-5 cursor-pointer p-4 bg-zinc-800/40 rounded-2xl border border-zinc-700 hover:border-red-600 transition-all">
                  <input type="checkbox" checked={hasInjury} onChange={(e) => setHasInjury(e.target.checked)} className="w-8 h-8 rounded-lg bg-zinc-900 border-zinc-700 text-red-600 focus:ring-red-600" />
                  <span className="text-lg font-black uppercase italic tracking-tight text-zinc-300">⚠️ ¿HAY ALGUNA AVERÍA?</span>
                </label>
              </div>
              
              {hasInjury && (
                <div className="animate-slideDown">
                   <textarea value={injuryNote} onChange={(e) => setInjuryNote(e.target.value)} className="w-full bg-red-900/10 border border-red-900 rounded-2xl p-5 text-white focus:ring-2 focus:ring-red-600 outline-none" placeholder="Especifica el dolor, soldado..." />
                </div>
              )}
              
              <div className="flex gap-4 pt-4">
                <button onClick={() => setActiveWorkoutId(null)} className="flex-1 py-4 font-black text-zinc-600 hover:text-white uppercase tracking-widest text-[10px]">CANCELAR</button>
                <button onClick={saveCompletion} className="flex-[3] py-4 bg-red-600 text-white font-black text-2xl rounded-2xl hover:bg-red-700 shadow-2xl active:scale-95 transition-all italic tracking-tighter uppercase">MARCAR CUMPLIDO</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutSection;
