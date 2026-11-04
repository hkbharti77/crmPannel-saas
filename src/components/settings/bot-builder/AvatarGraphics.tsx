import React from 'react';
import { MessageSquare, Upload } from 'lucide-react';

export const RobotCyan3DGraphic: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-md select-none overflow-visible`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="avRobotBody" x1="20" y1="20" x2="80" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="avRobotHead" x1="25" y1="15" x2="75" y2="75" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="60%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="avRobotVisor" x1="30" y1="28" x2="70" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#090d16" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <filter id="avCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <ellipse cx="50" cy="94" rx="28" ry="5" fill="#0f172a" fillOpacity="0.18" />
    <path d="M36 68 C36 64, 64 64, 64 68 L68 84 C68 88, 32 88, 32 84 Z" fill="url(#avRobotBody)" stroke="#94a3b8" strokeWidth="0.75" />
    <path d="M40 73 C45 76, 55 76, 60 73" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
    <rect x="22" y="68" width="8" height="18" rx="4" fill="url(#avRobotBody)" stroke="#94a3b8" strokeWidth="0.75" transform="rotate(10 26 77)" />
    <rect x="70" y="68" width="8" height="18" rx="4" fill="url(#avRobotBody)" stroke="#94a3b8" strokeWidth="0.75" transform="rotate(-10 74 77)" />
    <rect x="44" y="61" width="12" height="6" rx="2" fill="#64748b" />
    <rect x="18" y="36" width="6" height="14" rx="3" fill="#e2e8f0" stroke="#06b6d4" strokeWidth="0.8" />
    <rect x="76" y="36" width="6" height="14" rx="3" fill="#e2e8f0" stroke="#06b6d4" strokeWidth="0.8" />
    <rect x="23" y="20" width="54" height="44" rx="18" fill="url(#avRobotHead)" stroke="#cbd5e1" strokeWidth="1.2" />
    <rect x="29" y="27" width="42" height="30" rx="11" fill="url(#avRobotVisor)" />
    <path d="M34 30 Q50 33 66 30" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.25" />
    {/* Cyan Happy Smiling Curved Eyes (^^) */}
    <path d="M37 42 Q42 34 47 42" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#avCyanGlow)" />
    <path d="M53 42 Q58 34 63 42" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#avCyanGlow)" />
    {/* Cyan Smile */}
    <path d="M47 48 Q50 51 53 48" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" fill="none" filter="url(#avCyanGlow)" />
  </svg>
);

export const RobotPurple3DGraphic: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-md select-none overflow-visible`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="avRobotBodyP" x1="20" y1="20" x2="80" y2="90">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="avRobotHeadP" x1="25" y1="15" x2="75" y2="75">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="60%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="avRobotVisorP" x1="30" y1="28" x2="70" y2="58">
        <stop offset="0%" stopColor="#090d16" />
        <stop offset="100%" stopColor="#1e1b4b" />
      </linearGradient>
      <filter id="avPurpleGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <ellipse cx="50" cy="94" rx="28" ry="5" fill="#0f172a" fillOpacity="0.18" />
    <path d="M36 68 C36 64, 64 64, 64 68 L68 84 C68 88, 32 88, 32 84 Z" fill="url(#avRobotBodyP)" stroke="#94a3b8" strokeWidth="0.75" />
    <path d="M40 73 C45 76, 55 76, 60 73" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
    <rect x="22" y="68" width="8" height="18" rx="4" fill="url(#avRobotBodyP)" stroke="#94a3b8" strokeWidth="0.75" transform="rotate(10 26 77)" />
    <rect x="70" y="68" width="8" height="18" rx="4" fill="url(#avRobotBodyP)" stroke="#94a3b8" strokeWidth="0.75" transform="rotate(-10 74 77)" />
    <rect x="44" y="61" width="12" height="6" rx="2" fill="#64748b" />
    <rect x="18" y="36" width="6" height="14" rx="3" fill="#e2e8f0" stroke="#a855f7" strokeWidth="0.8" />
    <rect x="76" y="36" width="6" height="14" rx="3" fill="#e2e8f0" stroke="#a855f7" strokeWidth="0.8" />
    <rect x="23" y="20" width="54" height="44" rx="18" fill="url(#avRobotHeadP)" stroke="#cbd5e1" strokeWidth="1.2" />
    <rect x="29" y="27" width="42" height="30" rx="11" fill="url(#avRobotVisorP)" />
    <path d="M34 30 Q50 33 66 30" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.25" />
    <path d="M37 42 Q42 34 47 42" stroke="#c084fc" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#avPurpleGlow)" />
    <path d="M53 42 Q58 34 63 42" stroke="#c084fc" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#avPurpleGlow)" />
    <path d="M47 48 Q50 51 53 48" stroke="#c084fc" strokeWidth="2.2" strokeLinecap="round" fill="none" filter="url(#avPurpleGlow)" />
  </svg>
);

export const SparkleOrbGraphic: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-md select-none overflow-visible`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="avOrbGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#a5b4fc" />
        <stop offset="40%" stopColor="#6366f1" />
        <stop offset="85%" stopColor="#312e81" />
        <stop offset="100%" stopColor="#1e1b4b" />
      </radialGradient>
      <filter id="avOrbGlow" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <ellipse cx="50" cy="94" rx="24" ry="5" fill="#0f172a" fillOpacity="0.2" />
    <circle cx="50" cy="50" r="34" fill="url(#avOrbGrad)" filter="url(#avOrbGlow)" />
    <circle cx="40" cy="38" r="8" fill="#ffffff" fillOpacity="0.4" filter="blur(2px)" />
    <path d="M50 24 L52 32 L60 34 L52 36 L50 44 L48 36 L40 34 L48 32 Z" fill="#ffffff" fillOpacity="0.9" />
    <path d="M64 54 L65 59 L70 60 L65 61 L64 66 L63 61 L58 60 L63 59 Z" fill="#38bdf8" fillOpacity="0.85" />
    <path d="M34 62 L35 65 L38 66 L35 67 L34 70 L33 67 L30 66 L33 65 Z" fill="#e0e7ff" fillOpacity="0.8" />
  </svg>
);

export const SupportHumanGraphic: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-md select-none overflow-visible`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="avAgentShirt" x1="20" y1="65" x2="80" y2="95">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="94" rx="26" ry="5" fill="#0f172a" fillOpacity="0.18" />
    <path d="M26 90 C26 72 38 68 50 68 C62 68 74 72 74 90 Z" fill="url(#avAgentShirt)" />
    <circle cx="50" cy="42" r="22" fill="#fde047" fillOpacity="0.3" />
    <circle cx="50" cy="42" r="18" fill="#fed7aa" />
    <path d="M32 40 C32 26 68 26 68 40 C68 32 60 22 50 22 C38 22 32 30 32 40 Z" fill="#334155" />
    <circle cx="43" cy="41" r="2.2" fill="#1e293b" />
    <circle cx="57" cy="41" r="2.2" fill="#1e293b" />
    <path d="M45 49 Q50 53 55 49" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M31 42 C31 28 69 28 69 42" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <rect x="29" y="38" width="4" height="8" rx="2" fill="#0f172a" />
    <rect x="67" y="38" width="4" height="8" rx="2" fill="#0f172a" />
    <path d="M68 44 Q68 55 58 55" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <circle cx="58" cy="55" r="2" fill="#06b6d4" />
  </svg>
);

