import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

interface IdleTimeoutOptions {
  idleMinutes?: number;
  warningMinutes?: number;
}

export function useIdleTimeout({ idleMinutes = 25, warningMinutes = 5 }: IdleTimeoutOptions = {}) {
  const { user, signOut } = useAuth();
  const [isWarningModalOpen, setWarningModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(warningMinutes * 60);

  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const warningTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(() => {
    signOut();
    setWarningModalOpen(false);
  }, [signOut]);

  const resetTimers = useCallback(() => {
    // If user is not logged in or warning modal is already open, don't reset timers based on activity
    if (!user || isWarningModalOpen) return;

    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warningTimer.current) clearInterval(warningTimer.current);

    // Set the main idle timer
    idleTimer.current = setTimeout(() => {
      setWarningModalOpen(true);
      setCountdown(warningMinutes * 60);

      // Start the warning countdown interval
      warningTimer.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(warningTimer.current!);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, idleMinutes * 60 * 1000);
  }, [user, isWarningModalOpen, idleMinutes, warningMinutes, handleLogout]);

  useEffect(() => {
    if (!user) {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (warningTimer.current) clearInterval(warningTimer.current);
      setWarningModalOpen(false);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Use a throttled version of resetTimers if performance becomes an issue,
    // but for simple clearTimeout it's usually fine.
    events.forEach((e) => document.addEventListener(e, resetTimers));
    resetTimers(); // Initialize on mount

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (warningTimer.current) clearInterval(warningTimer.current);
      events.forEach((e) => document.removeEventListener(e, resetTimers));
    };
  }, [user, resetTimers]);

  const stayLoggedIn = () => {
    setWarningModalOpen(false);
    if (warningTimer.current) clearInterval(warningTimer.current);
    resetTimers();
  };

  return {
    isWarningModalOpen,
    countdown,
    stayLoggedIn,
    handleLogout
  };
}
