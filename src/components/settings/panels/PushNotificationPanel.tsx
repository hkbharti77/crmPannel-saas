import { useState, useEffect } from 'react';
import {
  Bell, BellRing, Smartphone, Laptop, CheckCircle2,
  AlertCircle, Trash2, Send, Loader2, RefreshCw, Key
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import { requestAndRegisterDevice, getOrCreateInstallationId } from '@/lib/firebase';
import { apiFetch } from '@/lib/api';

interface DeviceItem {
  id: string;
  installationId: string;
  deviceName: string;
  platform: string;
  browser?: string;
  lastSeenAt?: string;
  createdAt?: string;
}

export function PushNotificationPanel() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState<boolean>(true);

  const currentInstallationId = getOrCreateInstallationId();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ devices?: DeviceItem[]; isFirebaseConfigured?: boolean }>('/api/v1/user/devices');
      if (res.data) {
        setDevices(res.data.devices || []);
        setIsFirebaseConfigured(res.data.isFirebaseConfigured ?? true);
      }
    } catch (err: any) {
      console.warn('Failed to load registered devices: ', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    setEnabling(true);
    setError(null);
    setMessage(null);

    const result = await requestAndRegisterDevice();
    setPermission(result.permission);

    if (result.success) {
      setMessage('✅ Push notifications successfully activated on this browser!');
      await loadDevices();
    } else {
      setError(result.error || 'Failed to activate push notifications.');
    }
    setEnabling(false);
  };

  const handleSendTestPush = async () => {
    setSendingTest(true);
    setError(null);
    setMessage(null);

    try {
      const res = await apiFetch<{ sent?: boolean; message?: string }>('/api/v1/user/devices/test', {
        method: 'POST'
      });
      if (res.data?.sent) {
        setMessage('🚀 ' + (res.data.message || 'Test push notification sent!'));
      } else {
        setError(res.error || res.data?.message || 'Could not send test notification.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to trigger test push notification.');
    } finally {
      setSendingTest(false);
    }
  };

  const handleRevokeDevice = async (installationId: string) => {
    setRevokingId(installationId);
    setError(null);
    try {
      await apiFetch(`/api/v1/user/devices/${encodeURIComponent(installationId)}`, {
        method: 'DELETE'
      });
      setDevices(prev => prev.filter(d => d.installationId !== installationId));
      setMessage('Device deregistered successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke device.');
    } finally {
      setRevokingId(null);
    }
  };

  const isCurrentDeviceRegistered = devices.some(d => d.installationId === currentInstallationId);

  return (
    <div className="space-y-6 max-w-4xl">
      <PanelHeader
        title="Web Push Notifications (Firebase FCM)"
        description="Receive instant desktop & mobile alerts for new lead assignments, customer replies, and appointment reminders."
        icon={<Bell className="w-6 h-6 text-amber-500" />}
      />

      {/* Alerts */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button onClick={() => setMessage(null)} className="text-emerald-600 hover:text-emerald-800 text-sm font-semibold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800 text-sm font-semibold">✕</button>
        </div>
      )}

      {/* Browser Permission & Activation Card */}
      <SectionCard
        title="Browser Notification Status"
        description="Configure your browser to permit real-time CRM updates."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  Current Browser Permission
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    permission === 'granted'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : permission === 'denied'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}>
                    {permission.toUpperCase()}
                  </span>
                  {isCurrentDeviceRegistered && (
                    <span className="text-xs text-slate-500 font-medium">• Token Registered & Active</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleEnableNotifications}
                disabled={enabling}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all disabled:opacity-50"
              >
                {enabling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    {isCurrentDeviceRegistered ? 'Re-register This Device' : 'Enable on This Device'}
                  </>
                )}
              </button>

              <button
                onClick={handleSendTestPush}
                disabled={sendingTest || devices.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Test Notification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Active Registered Devices */}
      <SectionCard
        title="Registered Devices"
        description="All browser sessions and mobile devices linked to your account for push notifications."
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Devices ({devices.length})
            </span>
            <button
              onClick={loadDevices}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <p className="text-xs">Loading registered devices...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
              No devices registered yet. Click <strong>"Enable on This Device"</strong> above to start receiving alerts.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              {devices.map(device => {
                const isCurrent = device.installationId === currentInstallationId;
                return (
                  <div key={device.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                        {device.platform === 'WEB' ? <Laptop className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                            {device.deviceName}
                          </p>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/40">
                              This Device
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ID: {device.installationId.substring(0, 16)}... • Last active: {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeDevice(device.installationId)}
                      disabled={revokingId === device.installationId}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Deregister this device"
                    >
                      {revokingId === device.installationId ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Production & Cloud Messaging Info */}
      <SectionCard
        title="Firebase Push Configuration"
        description="Information for production credentials and Web Push certificates."
      >
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
            <Key className="w-4 h-4 text-amber-500" />
            <span>FCM Delivery Mode:</span>
            <span className={`px-2 py-0.5 rounded font-semibold ${
              isFirebaseConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {isFirebaseConfigured ? 'Active (Firebase Cloud Messaging)' : 'Development Mock / Dry-Run'}
            </span>
          </div>
          <p>
            In production, Web Push certificates (VAPID key) are generated in the{' '}
            <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-600 hover:underline font-medium">
              Firebase Console → Project Settings → Cloud Messaging
            </a>{' '}
            and placed in <code>.env</code> as <code>VITE_VAPID_KEY</code>.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
