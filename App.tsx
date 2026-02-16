
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Role, Workout, WeightEntry } from './types';
import { db } from './services/db';
import { MARATHONS, MOTIVATIONAL_QUOTES, LogoIcon } from './constants';
import Countdown from './components/Countdown';
import WorkoutSection from './components/WorkoutSection';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [view, setView] = useState<'dashboard' | 'plan' | 'admin'>('dashboard');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [currentWorkouts, setCurrentWorkouts] = useState<Workout[]>([]);
  const [motivation, setMotivation] = useState(MOTIVATIONAL_QUOTES[0]);

  const [weightInput, setWeightInput] = useState("");
  const [inspectedUser, setInspectedUser] = useState<User | null>(null);
  const [now, setNow] = useState(new Date());

  // Local state for admin to manage user list UI
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const isAdmin = currentUser?.role === Role.ADMIN;

  useEffect(() => {
    const interval = setInterval(() => {
      setMotivation(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    }, 15000);
    const clockInterval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  // Sync users when admin view is active
  useEffect(() => {
    if (view === 'admin') {
      setAllUsers(db.getUsers());
    }
  }, [view]);

  const refreshWorkouts = useCallback(() => {
    if (selectedPlanId && currentUser) {
      const targetUserId = inspectedUser ? inspectedUser.id : currentUser.id;
      setCurrentWorkouts(db.getWorkouts(selectedPlanId, targetUserId));
    }
  }, [selectedPlanId, currentUser, inspectedUser]);

  useEffect(() => {
    refreshWorkouts();
  }, [refreshWorkouts]);

  const activePlanName = useMemo(() => {
    const planId = inspectedUser ? inspectedUser.activePlanId : currentUser?.activePlanId;
    return MARATHONS.find(m => m.id === planId)?.name || null;
  }, [currentUser, inspectedUser]);

  const historyDetails = useMemo(() => {
    if (!currentUser || isAdmin) return null;
    const activeId = inspectedUser ? inspectedUser.activePlanId : currentUser.activePlanId;
    if (!activeId) return null;

    const all = db.getWorkouts(activeId, inspectedUser ? inspectedUser.id : currentUser.id);

    const todayWorkout = all.find(w => !w.completed && !w.skipped);
    const completed = all.filter(w => w.completed).sort((a,b) => b.order - a.order);
    const yesterdayWorkout = completed[0];
    const totalWeeklyKm = all.filter(w => w.completed).reduce((acc, w) => acc + (w.actualDistanceKm || w.distanceKm || 0), 0);
    const totalInjuries = all.filter(w => w.hasInjury).length;

    return { todayWorkout, yesterdayWorkout, totalWeeklyKm, totalInjuries };
  }, [currentUser, isAdmin, inspectedUser]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (authMode === 'login') {
      const users = db.getUsers();
      const found = users.find(u => u.name.toLowerCase() === username.toLowerCase());
      
      if (username === 'admin' && password === 'admin') {
        setCurrentUser({ id: '1', name: 'admin', role: Role.ADMIN });
        setView('admin');
      } else if (found && password === username) { 
        setCurrentUser(found);
        setView('dashboard');
      } else {
        setAuthError("Credenciales inválidas. (Tip: pass = user)");
      }
    } else {
      if (username.length < 3) return setAuthError("Nombre demasiado corto.");
      const newUser = db.registerUser(username);
      if (newUser) {
        setCurrentUser(newUser);
        setAuthMode('login');
      } else {
        setAuthError("Ese nombre ya está en el pelotón.");
      }
    }
  };

  const setActivePlan = (planId: string) => {
    if (currentUser && !isAdmin) {
      db.updateUser(currentUser.id, { activePlanId: planId });
      setCurrentUser({ ...currentUser, activePlanId: planId });
    }
  };

  const recordWeight = () => {
    if (currentUser && weightInput) {
      const val = parseFloat(weightInput);
      const month = new Date().toLocaleString('es-ES', { month: 'long' });
      const currentHistory = currentUser.weightHistory || [];
      const updatedHistory = [...currentHistory.filter(h => h.month !== month), { month, value: val }];
      
      db.updateUser(currentUser.id, { weightHistory: updatedHistory });
      setCurrentUser({ ...currentUser, weightHistory: updatedHistory });
      setWeightInput("");
    }
  };

  const deleteWeight = (userId: string, month: string) => {
    if (window.confirm(`¿Borrar pesaje de ${month}?`)) {
      db.deleteWeightEntry(userId, month);
      const updatedUsers = db.getUsers();
      setAllUsers(updatedUsers); // Refresh admin list
      const targetUser = updatedUsers.find(u => u.id === userId);
      if (inspectedUser && inspectedUser.id === userId) setInspectedUser(targetUser || null);
      if (currentUser && currentUser.id === userId) setCurrentUser(targetUser || null);
    }
  };

  const handleCascadeDeleteUser = (userId: string) => {
    if (window.confirm('¿ELIMINAR SOLDADO DEFINITIVAMENTE? Se borrará TODO su progreso y datos de la base de datos.')) {
      db.deleteUser(userId);
      setAllUsers(db.getUsers()); // Update local state for UI refresh
      setInspectedUser(null);
      refreshWorkouts();
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[100%] bg-red-600/5 blur-[200px] rounded-full"></div>
        
        <div className="w-full max-w-lg bg-zinc-900/40 backdrop-blur-3xl border border-zinc-800/50 p-12 rounded-[3rem] shadow-2xl relative z-10 text-center animate-fadeIn">
          <div className="flex justify-center mb-10">
            <LogoIcon />
          </div>
          <h1 className="font-display text-5xl font-black text-white italic mb-2 tracking-tighter uppercase">
            {authMode === 'login' ? 'INICIAR BOX' : 'NUEVO SOLDADO'}
          </h1>
          <p className="text-zinc-500 mb-10 font-black text-[10px] tracking-[0.5em] uppercase">Escuadrón Elite Sanchopanceros</p>
          
          <form onSubmit={handleAuth} className="space-y-6">
            <input 
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/60 border-2 border-zinc-800 rounded-2xl px-8 py-5 text-white focus:border-red-600 outline-none placeholder:text-zinc-700 font-bold text-lg transition-all"
              placeholder="USUARIO" required autoFocus
            />
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/60 border-2 border-zinc-800 rounded-2xl px-8 py-5 text-white focus:border-red-600 outline-none placeholder:text-zinc-700 font-bold text-lg transition-all"
              placeholder="CONTRASEÑA" required
            />
            {authError && <p className="text-red-500 text-xs font-black bg-red-500/10 py-4 rounded-2xl border border-red-500/20 uppercase">{authError}</p>}
            
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-3xl py-6 rounded-2xl shadow-xl active:scale-[0.96] transition-all uppercase tracking-widest italic">
              {authMode === 'login' ? 'ENTRAR' : 'REGISTRAR'}
            </button>
          </form>
          
          <div className="mt-10">
             <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-zinc-600 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.3em] transition-colors">
               {authMode === 'login' ? '¿ERES NUEVO? ÚNETE AL SUEÑO' : 'YA SOY SANCHOPANCERO, VOLVER'}
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white">
      <nav className="fixed top-0 left-0 right-0 h-32 bg-black/95 backdrop-blur-2xl border-b border-white/5 z-50 px-10 flex items-center justify-between">
        <div className="flex items-center gap-8 cursor-pointer group" onClick={() => { setInspectedUser(null); setView(isAdmin ? 'admin' : 'dashboard'); }}>
          <LogoIcon />
          <div className="hidden lg:block h-16 w-[1px] bg-zinc-800"></div>
          <div className="hidden lg:block">
             <p className="font-display text-5xl italic font-black text-white leading-none tracking-tight uppercase transition-all group-hover:text-red-600">
               HOLA, {currentUser.name}!
             </p>
             <p className="text-[10px] text-red-600 font-black tracking-[0.3em] mt-1 uppercase">SUEÑA CON GIGANTES, CORRE CON FUERZA</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-zinc-600 font-black text-[9px] tracking-widest uppercase">{now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
              <p className="text-white font-display text-2xl font-black italic tabular-nums leading-none">{now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            {isAdmin && (
              <button onClick={() => { setInspectedUser(null); setView('admin'); }} className={`px-6 py-2 rounded-xl font-black text-xs transition-all uppercase italic border-2 ${view === 'admin' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-zinc-800 hover:border-red-600'}`}>
                ADMIN
              </button>
            )}
            <button onClick={() => { setCurrentUser(null); setInspectedUser(null); setView('dashboard'); }} className="w-12 h-12 bg-zinc-900/50 rounded-xl flex items-center justify-center text-zinc-600 hover:text-red-500 transition-all border border-white/5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
        </div>
      </nav>

      <main className="pt-48 pb-32 px-6 md:px-16 max-w-[1500px] mx-auto">
        
        {view === 'dashboard' && (
          <div className="space-y-20 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               <div className="lg:col-span-2 bg-zinc-900/40 border border-white/5 p-10 rounded-[2.5rem] shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-10">
                      <h2 className="font-display text-4xl font-black italic border-l-8 border-red-600 pl-6 leading-none uppercase">RESUMEN DE BATALLA</h2>
                      {activePlanName && (
                        <span className="bg-red-600 text-white font-black text-[10px] px-4 py-2 rounded-lg italic shadow-lg uppercase tracking-widest">OBJETIVO: {activePlanName}</span>
                      )}
                    </div>

                    {!activePlanName && !isAdmin ? (
                      <div className="py-16 border-2 border-dashed border-zinc-800/40 rounded-2xl text-center">
                        <p className="text-zinc-600 font-display text-2xl italic">SELECCIONA TU OBJETIVO ABAJO PARA VER TU PROGRESO</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                          <p className="text-red-600 font-black text-[9px] tracking-widest uppercase mb-3">HOY</p>
                          <p className="text-zinc-500 text-[9px] font-black uppercase mb-1">MISIÓN:</p>
                          <p className="font-display text-xl text-white italic leading-tight">
                            {historyDetails?.todayWorkout?.description || "DESCANSO"}
                          </p>
                        </div>
                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                          <p className="text-zinc-500 font-black text-[9px] tracking-widest uppercase mb-3 italic">AYER</p>
                          <p className={`font-display text-xl italic leading-tight ${historyDetails?.yesterdayWorkout ? 'text-green-500' : 'text-zinc-600'}`}>
                            {historyDetails?.yesterdayWorkout ? 'COMPLETADO' : 'SIN REPORTE'}
                          </p>
                          {historyDetails?.yesterdayWorkout?.distanceKm ? <p className="text-[9px] mt-2 text-zinc-500 font-black">KM REAL: {historyDetails.yesterdayWorkout.actualDistanceKm || historyDetails.yesterdayWorkout.distanceKm}</p> : null}
                        </div>
                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                          <p className="text-zinc-500 font-black text-[9px] tracking-widest uppercase mb-3">SEMANA</p>
                          <div className="flex items-baseline gap-1">
                            <p className="font-display text-4xl text-white">{historyDetails?.totalWeeklyKm.toFixed(1) || "0.0"}</p>
                            <p className="text-red-600 font-display text-sm font-black italic">KM</p>
                          </div>
                          {historyDetails?.totalInjuries ? (
                            <p className="text-[9px] mt-2 text-red-500 font-black">AVERÍAS: {historyDetails.totalInjuries}</p>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-8 p-6 bg-red-600/5 border border-red-600/10 rounded-2xl text-center">
                    <p className="font-display text-2xl italic font-black text-zinc-400">"{motivation}"</p>
                  </div>
               </div>

               <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
                 <h3 className="text-red-600 font-black text-[10px] uppercase tracking-[0.3em] mb-6 italic text-center">PESO MENSUAL</h3>
                 <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="flex items-center gap-4 border-b border-zinc-800 pb-2">
                      <input 
                        type="number" value={weightInput} 
                        onChange={(e) => setWeightInput(e.target.value)} 
                        className="bg-transparent text-white font-display text-6xl font-black outline-none w-32 text-center"
                        placeholder="0.0"
                      />
                      <span className="font-display text-2xl text-zinc-700 italic font-black">KG</span>
                    </div>
                    <button onClick={recordWeight} className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-red-600/20">
                       <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    </button>
                 </div>
                 <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                   {currentUser.weightHistory?.slice().reverse().map((h, i) => (
                     <div key={i} className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5 group">
                        <span className="text-zinc-600 uppercase text-[9px] font-black">{h.month}</span>
                        <p className="text-white font-display text-xl italic font-black">{h.value} KG</p>
                        <button onClick={() => deleteWeight(currentUser.id, h.month)} className="text-red-500 opacity-0 group-hover:opacity-100 text-[10px]">×</button>
                     </div>
                   ))}
                 </div>
               </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-10">
                <h2 className="font-display text-5xl font-black italic border-l-[12px] border-red-600 pl-6 leading-none uppercase tracking-tighter">PLANES DE CONQUISTA</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {MARATHONS.map(marathon => (
                  <div key={marathon.id} onClick={() => { setSelectedPlanId(marathon.id); setView('plan'); }} className="relative group bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl cursor-pointer active:scale-95 transition-all h-[450px] border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10"></div>
                    <img src={`https://picsum.photos/seed/${marathon.id}_run_soft/1200/800`} alt={marathon.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-60 grayscale hover:grayscale-0" />
                    <div className="absolute inset-0 p-10 flex flex-col justify-end z-20">
                      {currentUser?.activePlanId === marathon.id && (
                        <span className="absolute top-8 right-8 bg-red-600 text-white font-black text-[9px] px-4 py-1.5 rounded-full italic tracking-widest shadow-xl">OBJETIVO ACTUAL</span>
                      )}
                      <h3 className="font-display text-8xl font-black text-white italic leading-none drop-shadow-2xl">{marathon.name}</h3>
                      <p className="text-red-600 font-black tracking-widest text-lg mt-4 uppercase">
                        {new Date(marathon.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'plan' && (
          <div className="animate-fadeIn">
            <div className="mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
              <div className="flex items-start gap-8">
                <button onClick={() => { if (inspectedUser) { setView('admin'); } else { setView('dashboard'); } }} className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-red-600 transition-all text-white shadow-xl shrink-0">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div>
                  <h2 className="font-display text-7xl md:text-9xl font-black italic uppercase text-red-600 leading-[0.8] tracking-tighter">PLAN {MARATHONS.find(m => m.id === selectedPlanId)?.name}</h2>
                  <div className="flex flex-wrap items-center gap-6 mt-4">
                    <p className="text-white font-black text-sm tracking-widest uppercase opacity-70">
                      {inspectedUser ? `REVISANDO PROGRESO: ${inspectedUser.name.toUpperCase()}` : `MÁXIMA CONCENTRACIÓN, SOLDADO ${currentUser?.name}`}
                    </p>
                    {!isAdmin && !inspectedUser && currentUser?.activePlanId !== selectedPlanId && (
                      <button onClick={() => setActivePlan(selectedPlanId!)} className="px-4 py-2 bg-zinc-800 hover:bg-white hover:text-black border border-zinc-700 rounded-lg text-[9px] font-black italic uppercase tracking-widest transition-all">MARCAR COMO OBJETIVO</button>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-zinc-900/60 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 shadow-xl">
                 <Countdown targetDate={MARATHONS.find(m => m.id === selectedPlanId)?.date || ''} />
              </div>
            </div>
            
            <WorkoutSection 
              planId={selectedPlanId || ''} 
              workouts={currentWorkouts} 
              onRefresh={refreshWorkouts} 
              isAdmin={isAdmin} 
              userId={inspectedUser ? inspectedUser.id : currentUser?.id || ''} 
            />
          </div>
        )}

        {view === 'admin' && (
           <div className="space-y-20 animate-fadeIn">
              <div className="flex flex-col gap-4">
                <h2 className="font-display text-8xl font-black italic text-white leading-none tracking-tighter uppercase">ADMINISTRACIÓN</h2>
                <div className="h-2 w-48 bg-red-600"></div>
                <p className="text-zinc-500 font-black text-xs tracking-widest uppercase italic">CONTROL ESTRATÉGICO</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {MARATHONS.map(m => (
                   <button key={m.id} onClick={() => { setSelectedPlanId(m.id); setView('plan'); }} className="bg-zinc-900/60 border border-white/5 p-8 rounded-[2rem] hover:border-red-600 transition-all text-left group flex items-center justify-between">
                      <div>
                        <p className="text-red-600 font-black text-[9px] tracking-widest uppercase mb-2">ENTRENOS GLOBALES</p>
                        <h3 className="font-display text-4xl font-black italic uppercase transition-transform leading-none">{m.name}</h3>
                      </div>
                      <svg className="w-8 h-8 text-zinc-800 group-hover:text-red-600 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                   </button>
                 ))}
              </div>

              <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-10 shadow-xl">
                <h3 className="font-display text-4xl font-black italic mb-10 border-b border-white/5 pb-6 uppercase tracking-tight">SOLDADOS EN CAMPAÑA</h3>
                <div className="grid grid-cols-1 gap-10">
                   {allUsers.filter(u => u.role !== Role.ADMIN).map(user => (
                     <div key={user.id} className="bg-black/40 p-8 rounded-[2rem] border border-white/5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 transition-all hover:bg-black/60 shadow-lg">
                        <div className="flex items-center gap-8">
                           <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-rose-800 rounded-2xl flex items-center justify-center font-display text-4xl font-black text-white italic shadow-lg shrink-0">
                              {user.name[0].toUpperCase()}
                           </div>
                           <div>
                              <p className="font-display text-4xl font-black uppercase tracking-tight text-white mb-2">{user.name}</p>
                              <div className="flex items-center gap-4">
                                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">ID: {user.id}</span>
                                {user.activePlanId && (
                                  <span className="text-red-600 text-[9px] font-black uppercase italic tracking-widest">OBJETIVO: {user.activePlanId.toUpperCase()}</span>
                                )}
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                           <button onClick={() => { setInspectedUser(user); setSelectedPlanId('bcn'); setView('plan'); }} className="px-6 py-3 bg-white text-black rounded-xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all uppercase italic">BCN</button>
                           <button onClick={() => { setInspectedUser(user); setSelectedPlanId('mad'); setView('plan'); }} className="px-6 py-3 bg-white text-black rounded-xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all uppercase italic">MAD</button>
                           <button 
                             onClick={() => handleCascadeDeleteUser(user.id)} 
                             className="px-6 py-3 bg-rose-950/20 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all uppercase italic"
                           >
                             ELIMINAR
                           </button>
                        </div>

                        <div className="xl:border-l xl:border-white/5 xl:pl-10 space-y-2 shrink-0">
                           <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic mb-2">PESO</p>
                           {user.weightHistory && user.weightHistory.length > 0 ? (
                             user.weightHistory.slice(-2).reverse().map((h, idx) => (
                               <div key={idx} className="flex justify-between gap-4 text-xs group/w">
                                  <span className="text-zinc-500 font-black uppercase text-[9px]">{h.month}:</span>
                                  <span className="font-display text-lg text-white font-black">{h.value} KG</span>
                               </div>
                             ))
                           ) : <p className="text-zinc-700 text-[9px] italic font-black uppercase">VACÍO</p>}
                        </div>
                     </div>
                   ))}
                </div>
              </div>
           </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-white/5 flex items-center justify-center text-[9px] font-black text-zinc-700 uppercase tracking-[0.8em] z-50">
        SANCHOPANCEROS © 2026 // HONOR // FUERZA // GLORIA
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #dc2626; }
      `}</style>
    </div>
  );
};

export default App;
