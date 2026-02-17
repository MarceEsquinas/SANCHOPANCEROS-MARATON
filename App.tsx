
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Role, Workout } from './types';
import { api } from './services/api';
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = currentUser?.role === Role.ADMIN;

  const activePlanName = useMemo(() => {
    const planId = inspectedUser ? inspectedUser.activePlanId : currentUser?.activePlanId;
    return MARATHONS.find(m => m.id === planId)?.name || null;
  }, [currentUser, inspectedUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMotivation(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    }, 15000);
    const clockInterval = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  const refreshUsers = useCallback(async () => {
    if (isAdmin) {
      try {
        const users = await api.getUsers();
        setAllUsers(users);
      } catch (e) { console.error(e); }
    }
  }, [isAdmin]);

  useEffect(() => {
    if (view === 'admin') refreshUsers();
  }, [view, refreshUsers]);

  const refreshWorkouts = useCallback(async () => {
    if (selectedPlanId && currentUser) {
      setLoading(true);
      try {
        const targetUserId = inspectedUser ? inspectedUser.id : currentUser.id;
        const data = await api.getWorkouts(selectedPlanId, targetUserId);
        setCurrentWorkouts(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
  }, [selectedPlanId, currentUser, inspectedUser]);

  useEffect(() => {
    refreshWorkouts();
  }, [refreshWorkouts]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);

    try {
      if (authMode === 'login') {
        if (username === 'admin' && password === 'admin') {
          setCurrentUser({ id: '1', name: 'admin', role: Role.ADMIN });
          setView('admin');
        } else {
          const user = await api.login(username);
          if (user && password === username) {
            setCurrentUser(user);
            setView('dashboard');
          } else {
            setAuthError("Credenciales inválidas.");
          }
        }
      } else {
        const newUser = await api.registerUser(username);
        setCurrentUser(newUser);
        setView('dashboard');
      }
    } catch (err) {
      setAuthError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleCascadeDeleteUser = async (userId: string) => {
    if (window.confirm('¿ELIMINAR SOLDADO DEFINITIVAMENTE? Se borrará TODO su progreso de la base de datos SQL.')) {
      setLoading(true);
      try {
        await api.deleteUser(userId);
        await refreshUsers();
        setInspectedUser(null);
        setView('admin');
      } catch (e) { alert("Error al eliminar usuario."); }
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-zinc-900/40 backdrop-blur-3xl border border-white/5 p-12 rounded-[3rem] shadow-2xl text-center">
          <div className="flex justify-center mb-10"><LogoIcon /></div>
          <form onSubmit={handleAuth} className="space-y-6">
            <input 
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/60 border-2 border-zinc-800 rounded-2xl px-8 py-5 text-white focus:border-red-600 outline-none font-bold text-lg transition-all"
              placeholder="USUARIO" required
            />
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/60 border-2 border-zinc-800 rounded-2xl px-8 py-5 text-white focus:border-red-600 outline-none font-bold text-lg transition-all"
              placeholder="CONTRASEÑA" required
            />
            {authError && <p className="text-red-500 text-xs font-black uppercase tracking-widest">{authError}</p>}
            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-3xl py-6 rounded-2xl shadow-xl transition-all uppercase italic">
              {loading ? 'CARGANDO...' : (authMode === 'login' ? 'ENTRAR' : 'UNIRSE')}
            </button>
          </form>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-8 text-zinc-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em]">
            {authMode === 'login' ? 'CREAR CUENTA NUEVA' : 'VOLVER AL LOGIN'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 selection:bg-red-600 selection:text-white">
      <nav className="fixed top-0 left-0 right-0 h-32 bg-black/90 backdrop-blur-xl border-b border-white/5 z-50 px-10 flex items-center justify-between">
        <div className="flex items-center gap-8 cursor-pointer group" onClick={() => { setInspectedUser(null); setView(isAdmin ? 'admin' : 'dashboard'); }}>
          <LogoIcon />
          <p className="hidden lg:block font-display text-5xl italic font-black text-white group-hover:text-red-600 transition-colors uppercase">HOLA, {currentUser.name}!</p>
        </div>
        <div className="flex items-center gap-6">
          {isAdmin && <button onClick={() => setView('admin')} className="px-6 py-2 rounded-xl border-2 border-zinc-800 font-black text-xs uppercase italic text-white hover:border-red-600 transition-all">PANEL MANDO</button>}
          <button onClick={() => { setCurrentUser(null); setView('dashboard'); }} className="text-zinc-700 hover:text-red-600 transition-colors"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
        </div>
      </nav>

      <main className="pt-48 pb-32 px-6 md:px-16 max-w-[1500px] mx-auto">
        {view === 'dashboard' && (
          <div className="animate-fadeIn space-y-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 bg-zinc-900/40 p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                <h2 className="font-display text-4xl font-black italic text-white mb-10 border-l-8 border-red-600 pl-6 uppercase tracking-tighter">ESTADO DEL FRENTE</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-black/40 p-8 rounded-3xl border border-white/5">
                    <p className="text-red-600 font-black text-[10px] tracking-widest uppercase mb-4 italic">MOTIVACIÓN</p>
                    <p className="font-display text-2xl text-white italic leading-tight">"{motivation}"</p>
                  </div>
                  <div className="bg-black/40 p-8 rounded-3xl border border-white/5">
                    <p className="text-zinc-600 font-black text-[10px] tracking-widest uppercase mb-4 italic">MISIÓN ACTUAL</p>
                    <p className="font-display text-5xl text-white font-black italic uppercase tracking-tighter">{activePlanName || "SIN PLAN"}</p>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-900/40 p-8 rounded-[3rem] border border-white/5 text-center flex flex-col justify-center">
                <h3 className="text-red-600 font-black text-[10px] uppercase tracking-widest mb-6 italic">CONTROL DE CARGA</h3>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <input type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} className="bg-transparent text-white font-display text-8xl font-black w-36 text-center outline-none" placeholder="0.0" />
                  <span className="font-display text-2xl text-zinc-700 italic">KG</span>
                </div>
                <button onClick={() => {}} className="w-full py-5 bg-red-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-red-600/10 uppercase italic hover:bg-red-700 transition-all">REGISTRAR PESO</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {MARATHONS.map(m => (
                <div key={m.id} onClick={() => { setSelectedPlanId(m.id); setView('plan'); }} className="relative h-[450px] rounded-[3.5rem] overflow-hidden group cursor-pointer border border-white/5 shadow-2xl">
                  <img src={`https://picsum.photos/seed/${m.id}/1200/800`} className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-12 flex flex-col justify-end">
                    <h3 className="font-display text-8xl font-black text-white italic leading-[0.8] mb-4 group-hover:text-red-600 transition-colors uppercase tracking-tighter">{m.name}</h3>
                    <p className="text-red-600 font-black uppercase text-sm tracking-[0.4em] italic">{new Date(m.date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'plan' && (
          <div className="animate-fadeIn">
            <div className="mb-20 flex flex-col lg:flex-row lg:items-end justify-between gap-12">
              <div className="flex items-center gap-10">
                <button onClick={() => setView(inspectedUser ? 'admin' : 'dashboard')} className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center border border-white/5 hover:bg-red-600 hover:scale-110 transition-all text-white shadow-2xl"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
                <h2 className="font-display text-9xl font-black italic uppercase text-red-600 tracking-tighter leading-none">{MARATHONS.find(m => m.id === selectedPlanId)?.name}</h2>
              </div>
              <div className="bg-zinc-900/60 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
                <Countdown targetDate={MARATHONS.find(m => m.id === selectedPlanId)?.date || ''} />
              </div>
            </div>
            <WorkoutSection planId={selectedPlanId || ''} workouts={currentWorkouts} onRefresh={refreshWorkouts} isAdmin={isAdmin} userId={inspectedUser ? inspectedUser.id : currentUser?.id || ''} />
          </div>
        )}

        {view === 'admin' && (
          <div className="animate-fadeIn space-y-20">
            <h2 className="font-display text-9xl font-black italic uppercase text-white tracking-tighter border-b-8 border-red-600 inline-block pb-6 leading-none">INTELIGENCIA</h2>
            <div className="grid grid-cols-1 gap-10">
              {allUsers.filter(u => u.role !== Role.ADMIN).map(user => (
                <div key={user.id} className="bg-zinc-900/40 p-12 rounded-[3.5rem] border border-white/5 flex flex-col xl:flex-row justify-between items-center group transition-all hover:bg-zinc-900/60 shadow-2xl">
                  <div>
                    <h3 className="font-display text-7xl font-black uppercase text-white group-hover:text-red-600 transition-colors leading-none tracking-tighter mb-3">{user.name}</h3>
                    <div className="flex gap-4 text-zinc-600 font-black text-xs uppercase tracking-widest italic">
                      <span>ID: {user.id}</span>
                      <span className="text-red-900">•</span>
                      <span>{user.activePlanId ? `OBJETIVO: ${user.activePlanId.toUpperCase()}` : 'SIN MISIÓN'}</span>
                    </div>
                  </div>
                  <div className="flex gap-6 mt-8 xl:mt-0">
                    <button onClick={() => { setInspectedUser(user); setSelectedPlanId('bcn'); setView('plan'); }} className="px-10 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase italic hover:bg-red-600 hover:text-white transition-all shadow-xl">BARCELONA</button>
                    <button onClick={() => { setInspectedUser(user); setSelectedPlanId('mad'); setView('plan'); }} className="px-10 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase italic hover:bg-red-600 hover:text-white transition-all shadow-xl">MADRID</button>
                    <button onClick={() => handleCascadeDeleteUser(user.id)} className="px-10 py-4 bg-rose-950/20 text-red-500 border border-red-500/20 rounded-2xl font-black text-sm uppercase italic hover:bg-red-600 hover:text-white transition-all">DE BAJA</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-white/5 flex items-center justify-center text-[10px] font-black text-zinc-800 uppercase tracking-[1em] z-50">SANCHOPANCEROS • EL SUEÑO DE LOS VALIENTES • SQL INFRASTRUCTURE</footer>
    </div>
  );
};

export default App;
