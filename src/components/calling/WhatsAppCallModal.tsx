import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/primitives';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneForwarded,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  AlertCircle,
  X,
  Volume2,
  User,
  Sparkles,
  RefreshCw,
  Send,
  CheckCircle2,
} from 'lucide-react';
import {
  initiateWhatsAppCall,
  requestWhatsAppCallPermission,
  fetchWhatsAppCallPermission,
  fetchWhatsAppCallDetail,
  terminateWhatsAppCall,
  formatCallDuration,
  getCallStateLabel,
  type CallPermissionResponseDTO,
  type WhatsAppCallDetailDTO,
} from '@/lib/whatsappCallingApi';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';

interface WhatsAppCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId?: string;
  contactName?: string;
  phoneNumber?: string;
  onCallCompleted?: (callId: string) => void;
}

export function WhatsAppCallModal({
  isOpen,
  onClose,
  contactId,
  contactName,
  phoneNumber = '',
  onCallCompleted,
}: WhatsAppCallModalProps) {
  const [targetPhone, setTargetPhone] = useState(phoneNumber);
  const [permission, setPermission] = useState<CallPermissionResponseDTO | null>(null);
  const [checkingPermission, setCheckingPermission] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [permissionPromptText, setPermissionPromptText] = useState(
    'Hello! Our AI voice assistant would like to call you regarding your inquiry. Please tap below to allow calls.'
  );
  const [showPermissionPromptModal, setShowPermissionPromptModal] = useState(false);
  const [permissionSuccessMsg, setPermissionSuccessMsg] = useState<string | null>(null);

  // Call Lifecycle State
  const [callSession, setCallSession] = useState<WhatsAppCallDetailDTO | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callState, setCallState] = useState<string>('IDLE'); // IDLE, INITIATING, RINGING, ACTIVE, COMPLETED, FAILED
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize target phone when prop changes
  useEffect(() => {
    if (phoneNumber) {
      setTargetPhone(phoneNumber);
    }
  }, [phoneNumber]);

  // Load permission status when modal opens
  const loadPermission = useCallback(async () => {
    const identifier = contactId || targetPhone;
    if (!identifier) return;

    setCheckingPermission(true);
    setErrorMsg(null);
    try {
      const res = await fetchWhatsAppCallPermission(identifier);
      if (res.data) {
        setPermission(res.data);
      }
    } catch {
      // Permission API may return 404 if contact hasn't opted in yet
      setPermission(null);
    } finally {
      setCheckingPermission(false);
    }
  }, [contactId, targetPhone]);

  useEffect(() => {
    if (isOpen) {
      setCallState('IDLE');
      setActiveCallId(null);
      setCallSession(null);
      setErrorMsg(null);
      setCallDuration(0);
      setPermissionSuccessMsg(null);
      loadPermission();
    } else {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    }
  }, [isOpen, loadPermission]);

  // Duration Timer for ACTIVE calls
  useEffect(() => {
    if (callState === 'ACTIVE') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callState]);

  // Poll in-flight call state
  useEffect(() => {
    if (!activeCallId) return;

    const inFlightStates = ['INITIATED', 'OFFER_SENT', 'RINGING', 'ACTIVE'];
    const shouldPoll = inFlightStates.includes(callState.toUpperCase());

    if (shouldPoll) {
      pollTimerRef.current = setInterval(async () => {
        const res = await fetchWhatsAppCallDetail(activeCallId);
        if (res.data) {
          setCallSession(res.data);
          const state = res.data.state?.toUpperCase() || 'UNKNOWN';

          if (state === 'RINGING' || state === 'OFFER_SENT') {
            setCallState('RINGING');
          } else if (state === 'ACTIVE' || state === 'CONNECTED') {
            setCallState('ACTIVE');
          } else if (state === 'TERMINATED' || state === 'ENDED') {
            setCallState('COMPLETED');
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            if (onCallCompleted) onCallCompleted(activeCallId);
          } else if (
            state === 'REJECTED' ||
            state === 'MISSED' ||
            state === 'TIMEOUT' ||
            state === 'FAILED'
          ) {
            setCallState(state);
            setErrorMsg(
              res.data.metaErrorMessage ||
                res.data.terminationReason ||
                `Call ended: ${getCallStateLabel(state)}`
            );
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          }
        }
      }, 2000);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [activeCallId, callState, onCallCompleted]);

  // Initiate Outbound Call
  const handleStartCall = async () => {
    if (!targetPhone && !contactId) {
      setErrorMsg('A valid phone number or contact ID is required to place a call.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setCallState('INITIATING');

    const cleanPhone = targetPhone.replace(/[^0-9+]/g, '');
    const idempotencyKey = `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const res = await initiateWhatsAppCall(
      {
        contactId,
        toWaId: cleanPhone || undefined,
        idempotencyKey,
      },
      idempotencyKey
    );

    setIsSubmitting(false);

    if (res.error) {
      setCallState('IDLE');
      if (res.status === 403) {
        setErrorMsg(
          'Outbound call blocked: active permission required by Meta policy or recipient rate limit reached.'
        );
      } else if (res.status === 409) {
        setErrorMsg('Tenant calling concurrency limit reached. Please wait for an active call to finish.');
      } else {
        setErrorMsg(res.error);
      }
      return;
    }

    if (res.data) {
      setActiveCallId(res.data.callId);
      setCallState('RINGING');
    }
  };

  // Request Call Permission Template
  const handleSendPermissionRequest = async () => {
    const cleanPhone = targetPhone.replace(/[^0-9+]/g, '');
    if (!cleanPhone && !contactId) {
      setErrorMsg('Phone number is required to request call permission.');
      return;
    }

    setRequestingPermission(true);
    setErrorMsg(null);

    const res = await requestWhatsAppCallPermission({
      contactId,
      userWaId: cleanPhone || undefined,
      messageText: permissionPromptText,
    });

    setRequestingPermission(false);
    setShowPermissionPromptModal(false);

    if (res.error) {
      setErrorMsg(`Failed to send permission request: ${res.error}`);
    } else if (res.data) {
      setPermission(res.data);
      setPermissionSuccessMsg(
        'Interactive call permission request dispatched to recipient via WhatsApp! Awaiting recipient approval.'
      );
    }
  };

  const handleEndCall = async () => {
    if (activeCallId) {
      try {
        await terminateWhatsAppCall(activeCallId);
      } catch (err) {
        console.error('Failed to terminate active call:', err);
      }
    }
    setCallState('COMPLETED');
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }
    if (activeCallId && onCallCompleted) {
      onCallCompleted(activeCallId);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} backdropClassName="bg-black/70 backdrop-blur-md p-4">
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-base-c bg-card-c shadow-soft-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-base-c px-6 py-4 bg-subtle-c/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <WhatsAppIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-primary-c">WhatsApp AI Voice Agent</h2>
              <p className="text-[11px] text-muted-c">Autonomous Full-Duplex Voice Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Recipient Profile Info */}
          <div className="flex items-center justify-between rounded-xl border border-base-c bg-subtle-c p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-accent text-white font-bold text-base shadow-soft">
                {contactName ? contactName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary-c">{contactName || 'Target Recipient'}</h3>
                <p className="font-mono text-xs text-muted-c">{targetPhone || 'No phone provided'}</p>
              </div>
            </div>
            <div>
              {callState === 'ACTIVE' ? (
                <Badge variant="success">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  Active
                </Badge>
              ) : callState === 'RINGING' ? (
                <Badge variant="primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping mr-1" />
                  Ringing
                </Badge>
              ) : callState === 'COMPLETED' ? (
                <Badge variant="neutral">Ended</Badge>
              ) : (
                <Badge variant="neutral">Ready</Badge>
              )}
            </div>
          </div>

          {/* Meta Policy & Outbound Calling Permission Banner */}
          {callState === 'IDLE' && (
            <div className="rounded-xl border border-base-c bg-slate-50 dark:bg-ink-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-c flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary-500" /> Meta Calling Policy
                </span>
                {checkingPermission ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-c" />
                ) : permission?.active ? (
                  <Badge variant="success">Permission Active</Badge>
                ) : (
                  <Badge variant="warning">Permission Required</Badge>
                )}
              </div>

              {permission?.active ? (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Recipient has granted call permission
                    {permission.expiresAt
                      ? ` (valid until ${new Date(permission.expiresAt).toLocaleDateString()})`
                      : ' (Permanent)'}
                    . You may initiate an AI voice call.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-secondary-c">
                    Meta requires prior consent before placing business-initiated WhatsApp voice calls.
                  </p>
                  <button
                    onClick={() => setShowPermissionPromptModal(true)}
                    disabled={requestingPermission}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-primary-500/30 bg-primary-500/10 hover:bg-primary-500/20 px-3 py-2 text-xs font-semibold text-primary-600 dark:text-primary-300 transition-all cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Request Calling Permission via WhatsApp
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Permission Prompt Modal Dialog */}
          {showPermissionPromptModal && (
            <div className="rounded-xl border border-primary-500/30 bg-primary-50/50 dark:bg-primary-950/30 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary-c">Interactive Permission Request</span>
                <button
                  onClick={() => setShowPermissionPromptModal(false)}
                  className="text-muted-c hover:text-primary-c"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                value={permissionPromptText}
                onChange={(e) => setPermissionPromptText(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-base-c bg-card-c p-2 text-xs text-primary-c placeholder-muted-c focus:border-primary-500 focus:outline-none"
                placeholder="Custom invitation message..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowPermissionPromptModal(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendPermissionRequest}
                  disabled={requestingPermission}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-1.5 text-xs font-semibold text-white shadow-soft"
                >
                  {requestingPermission ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Send Request
                </button>
              </div>
            </div>
          )}

          {/* Success Notification */}
          {permissionSuccessMsg && (
            <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{permissionSuccessMsg}</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* IN-CALL VISUALIZER & STATUS MONITOR */}
          {callState !== 'IDLE' && (
            <div className="rounded-2xl border border-base-c bg-slate-900 p-6 text-center text-white space-y-4 shadow-soft-lg">
              {/* Call Status Animation */}
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                {callState === 'ACTIVE' && (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-20" />
                    <span className="absolute inline-flex h-16 w-16 animate-pulse rounded-full bg-emerald-500 opacity-40" />
                  </>
                )}
                {callState === 'RINGING' && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-20" />
                )}
                <div
                  className={`relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-soft ${
                    callState === 'ACTIVE'
                      ? 'bg-emerald-600'
                      : callState === 'RINGING'
                      ? 'bg-blue-600 animate-bounce'
                      : callState === 'COMPLETED'
                      ? 'bg-slate-700'
                      : 'bg-rose-600'
                  }`}
                >
                  {callState === 'ACTIVE' ? (
                    <Volume2 className="h-7 w-7" />
                  ) : callState === 'RINGING' ? (
                    <PhoneForwarded className="h-7 w-7" />
                  ) : (
                    <PhoneOff className="h-7 w-7" />
                  )}
                </div>
              </div>

              {/* State Title & Timer */}
              <div>
                <h4 className="text-base font-bold tracking-tight">
                  {callState === 'INITIATING'
                    ? 'Establishing Call Session...'
                    : callState === 'RINGING'
                    ? 'Ringing Customer WhatsApp...'
                    : callState === 'ACTIVE'
                    ? 'Voice Agent Speaking'
                    : callState === 'COMPLETED'
                    ? 'Call Ended'
                    : `Call ${getCallStateLabel(callState)}`}
                </h4>
                <p className="mt-1 font-mono text-xl font-extrabold text-emerald-400">
                  {formatCallDuration(callDuration)}
                </p>
                {activeCallId && (
                  <p className="mt-1 text-[10px] font-mono text-slate-400">ID: {activeCallId}</p>
                )}
              </div>

              {/* Audio Waveform simulation for active call */}
              {callState === 'ACTIVE' && (
                <div className="flex items-center justify-center gap-1.5 py-1">
                  {[40, 75, 55, 90, 60, 85, 45, 95, 50, 70].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-emerald-400 rounded-full animate-pulse"
                      style={{
                        height: `${h * 0.25}px`,
                        animationDuration: `${0.4 + (i % 3) * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* End Call Button */}
              {(callState === 'ACTIVE' || callState === 'RINGING') && (
                <button
                  onClick={handleEndCall}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-6 py-2.5 text-xs font-bold text-white shadow-soft transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <PhoneOff className="h-4 w-4" /> End Call
                </button>
              )}
            </div>
          )}

          {/* Action Buttons in IDLE mode */}
          {callState === 'IDLE' && (
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-base-c bg-card-c px-4 py-2 text-xs font-semibold text-secondary-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartCall}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2 text-xs font-bold text-white shadow-soft transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PhoneCall className="h-4 w-4" />
                )}
                Initiate AI Call
              </button>
            </div>
          )}

          {/* Dismiss button when call finalized */}
          {(callState === 'COMPLETED' ||
            callState === 'REJECTED' ||
            callState === 'MISSED' ||
            callState === 'FAILED' ||
            callState === 'TIMEOUT') && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 text-xs font-bold transition-all shadow-soft"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
