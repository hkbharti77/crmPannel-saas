import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { AlertTriangle } from 'lucide-react';

export function SessionManager() {
  // Using 25 mins idle + 5 mins warning as proposed
  const { isWarningModalOpen, countdown, stayLoggedIn, handleLogout } = useIdleTimeout({
    idleMinutes: 25,
    warningMinutes: 5,
  });

  if (!isWarningModalOpen) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200 border border-slate-100">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Session Expiring Soon</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            You've been inactive for a while. For your security, you will be automatically logged out in{' '}
            <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              {formatTime(countdown)}
            </span>
            .
          </p>
          <div className="flex w-full gap-3">
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200"
            >
              Log Out Now
            </button>
            <button
              onClick={stayLoggedIn}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
