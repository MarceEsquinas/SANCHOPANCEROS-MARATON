
import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: string;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        return {
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };

    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return <div className="text-red-600 font-display text-5xl font-black italic animate-pulse">¡EL DÍA DEL JUICIO ES HOY!</div>;

  return (
    <div className="flex gap-6 font-display items-center">
      <div className="flex flex-col items-center">
        <span className="text-6xl md:text-8xl font-black text-white drop-shadow-lg leading-none">{timeLeft.d}</span>
        <span className="text-[10px] text-zinc-500 font-black tracking-widest mt-2 uppercase">DÍAS</span>
      </div>
      <div className="text-6xl md:text-8xl font-black text-red-600/50 leading-[0.7]">:</div>
      <div className="flex flex-col items-center">
        <span className="text-6xl md:text-8xl font-black text-white drop-shadow-lg leading-none">{String(timeLeft.h).padStart(2, '0')}</span>
        <span className="text-[10px] text-zinc-500 font-black tracking-widest mt-2 uppercase">HRS</span>
      </div>
      <div className="text-6xl md:text-8xl font-black text-red-600/50 leading-[0.7]">:</div>
      <div className="flex flex-col items-center">
        <span className="text-6xl md:text-8xl font-black text-white drop-shadow-lg leading-none">{String(timeLeft.m).padStart(2, '0')}</span>
        <span className="text-[10px] text-zinc-500 font-black tracking-widest mt-2 uppercase">MIN</span>
      </div>
      <div className="text-6xl md:text-8xl font-black text-red-600/50 leading-[0.7]">:</div>
      <div className="flex flex-col items-center">
        <span className="text-6xl md:text-8xl font-black text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.4)] leading-none tabular-nums animate-pulse">{String(timeLeft.s).padStart(2, '0')}</span>
        <span className="text-[10px] text-zinc-500 font-black tracking-widest mt-2 uppercase">SEG</span>
      </div>
    </div>
  );
};

export default Countdown;
