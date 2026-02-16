
import React from 'react';

export const MARATHONS = [
  { id: 'bcn', name: 'BARCELONA', date: '2026-03-15T09:00:00' },
  { id: 'mad', name: 'MADRID', date: '2026-04-26T09:00:00' }
];

export const MOTIVATIONAL_QUOTES = [
  "Sin fuerza no hay maratón. Las piernas que entrenan fuerza, llegan al kilómetro 35 con dignidad.",
  "La fuerza es el seguro de vida del corredor.",
  "El maratón empieza cuando tus piernas quieren parar.",
  "Entrena fuerza hoy, sonríe en el kilómetro 38.",
  "La disciplina te lleva donde la motivación no alcanza.",
  "Un maratón se gana en los entrenamientos de invierno.",
  "No cuentes los kilómetros, haz que los kilómetros cuenten.",
  "Correr es el 10% piernas y el 90% cabeza."
];

export const SUCCESS_MESSAGES = [
  "¡Bien hecho, Quijote!",
  "Un paso más cerca de la gloria.",
  "Sancho estaría orgulloso de tu esfuerzo.",
  "¡Nadie te para!",
  "A por la siguiente sin piedad."
];

export const LogoIcon = () => (
  <svg viewBox="0 0 320 120" className="w-72 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#991b1b" />
      </linearGradient>
    </defs>
    {/* Stylized Don Quixote (The Dreamer/Runner) */}
    <g transform="translate(10, 10)">
       <path d="M40 10 L42 5 L45 10" stroke="white" strokeWidth="2" fill="none" /> 
       <circle cx="42" cy="18" r="6" fill="white" /> 
       <path d="M42 24 L42 60 L30 90 M42 60 L54 90" stroke="white" strokeWidth="3" strokeLinecap="round" /> 
       <path d="M42 35 L60 25 M42 35 L25 45" stroke="white" strokeWidth="3" strokeLinecap="round" /> 
       <path d="M60 25 L80 0" stroke="#ef4444" strokeWidth="2" strokeDasharray="4" />
    </g>
    
    {/* Stylized Sancho Panza (The Sturdy Reality) */}
    <g transform="translate(85, 45)">
       <circle cx="20" cy="10" r="8" fill="url(#redGrad)" /> 
       <circle cx="20" cy="38" r="20" fill="url(#redGrad)" /> 
       <path d="M12 55 L10 75 M28 55 L30 75" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" /> 
       <path d="M5 38 L-5 48 M35 38 L45 48" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" /> 
    </g>

    <text x="145" y="55" className="font-display text-5xl font-black fill-white tracking-tighter uppercase">SANCHO</text>
    <text x="145" y="98" className="font-display text-6xl font-black fill-red-600 tracking-tighter italic uppercase">PANCEROS</text>
  </svg>
);
