import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CallsView } from '@/components/calling/CallsView';
import { CallDetailDrawer } from '@/components/calling/CallDetailDrawer';

export function VoiceDashboardView() {
  const { callId } = useParams<{ callId?: string }>();
  const navigate = useNavigate();
  const [activeCallId, setActiveCallId] = useState<string | null>(callId || null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(!!callId);

  useEffect(() => {
    if (callId) {
      setActiveCallId(callId);
      setDrawerOpen(true);
    }
  }, [callId]);

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setActiveCallId(null);
    if (callId) {
      navigate('/voice', { replace: true });
    }
  };

  return (
    <div className="relative">
      <CallsView />

      {activeCallId && (
        <CallDetailDrawer
          callId={activeCallId}
          isOpen={drawerOpen}
          onClose={handleCloseDrawer}
        />
      )}
    </div>
  );
}

export default VoiceDashboardView;
