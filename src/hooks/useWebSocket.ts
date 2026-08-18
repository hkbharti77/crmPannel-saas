/**
 * useWebSocket.ts
 *
 * Manages the STOMP-over-SockJS WebSocket connection for real-time messaging
 * in the CRM web panel. Mirrors the pattern used by the mobile app
 * (CRMLiteFrontend/src/store/useWebSocketStore.ts).
 *
 * Backend endpoint: /ws (SockJS)
 * Subscription:     /topic/{tenantId}/messages
 *
 * Payload shape (from DistributedWebSocketPublisher / WhatsAppIngressService):
 *   { id, contactId, contactName, content, direction, sentiment?, escalated? }
 */

import { useEffect, useRef, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAuthToken, getTenantId } from '@/lib/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const WS_URL = `${API_BASE_URL}/ws`;

export type WsIncomingMessage = {
  id: string;
  contactId: string;
  contactName?: string;
  content: string;
  direction?: 'INCOMING' | 'OUTGOING';
  sentiment?: string;
  escalated?: boolean;
  timestamp?: string;
};

type MessageListener = (msg: WsIncomingMessage) => void;

/**
 * A singleton-ish listener registry so multiple React components can
 * subscribe without each creating their own STOMP connection.
 */
const listeners = new Set<MessageListener>();

let stompClient: Client | null = null;
let isConnected = false;
let retryCount = 0;
const MAX_RETRIES = 10;

function connectStomp() {
  const token = getAuthToken();
  const tenantId = getTenantId();

  if (!token || !tenantId) {
    console.warn('[WS] Cannot connect: missing token or tenantId');
    return;
  }

  if (isConnected && stompClient?.connected) {
    return; // already connected
  }

  // Tear down previous client if any
  if (stompClient) {
    try { stompClient.deactivate(); } catch { /* ignore */ }
    stompClient = null;
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    reconnectDelay: 2000,

    onConnect: () => {
      console.log('✅ [WS] WebSocket connected for tenant:', tenantId);
      isConnected = true;
      retryCount = 0;

      if (stompClient) {
        stompClient.reconnectDelay = 2000;
      }

      stompClient!.subscribe(
        `/topic/${tenantId}/messages`,
        (frame: IMessage) => {
          try {
            const incoming: WsIncomingMessage = JSON.parse(frame.body);
            console.log('📩 [WS] Real-time message:', incoming);

            // Fan out to all registered listeners
            listeners.forEach((fn) => {
              try { fn(incoming); } catch (e) { console.error('[WS] Listener error:', e); }
            });
          } catch (e) {
            console.error('[WS] Failed to parse frame:', e);
          }
        },
      );
    },

    onDisconnect: () => {
      console.log('🔴 [WS] Disconnected');
      isConnected = false;
    },

    onWebSocketClose: () => {
      if (retryCount >= MAX_RETRIES) {
        console.error('❌ [WS] Max retries reached. Stopping reconnection.');
        stompClient?.deactivate();
        return;
      }

      const nextDelay = Math.min((stompClient?.reconnectDelay ?? 2000) * 1.5, 30000);
      if (stompClient) stompClient.reconnectDelay = nextDelay;

      console.warn(`⚠️ [WS] Closed. Retry ${retryCount + 1}/${MAX_RETRIES} in ${nextDelay}ms`);
      retryCount++;
    },

    onStompError: (frame) => {
      const errMsg = frame.headers['message'] || '';
      console.error('[WS] STOMP Error:', errMsg);

      if (
        errMsg.toLowerCase().includes('unauthenticated') ||
        errMsg.toLowerCase().includes('access denied') ||
        errMsg.toLowerCase().includes('unauthorized')
      ) {
        console.warn('🔴 [WS] Auth error — stopping reconnection.');
        stompClient?.deactivate();
        isConnected = false;
        retryCount = 0;
      }
    },
  });

  stompClient.activate();
}

function disconnectStomp() {
  if (stompClient) {
    try { stompClient.deactivate(); } catch { /* ignore */ }
    stompClient = null;
    isConnected = false;
    retryCount = 0;
  }
}

/**
 * Hook: manages connection lifecycle and lets the calling component
 * register a callback for incoming WebSocket messages.
 *
 * Usage:
 *   useWebSocket((msg) => {
 *     // handle msg.contactId, msg.content, etc.
 *   });
 */
export function useWebSocket(onMessage?: MessageListener) {
  const listenerRef = useRef<MessageListener | undefined>(onMessage);
  listenerRef.current = onMessage;

  // Stable wrapper so the Set entry never changes
  const stableListener = useCallback((msg: WsIncomingMessage) => {
    listenerRef.current?.(msg);
  }, []);

  useEffect(() => {
    // Register listener
    if (onMessage) {
      listeners.add(stableListener);
    }

    // Connect (idempotent — won't double-connect)
    connectStomp();

    return () => {
      listeners.delete(stableListener);

      // If no listeners remain, disconnect to free resources
      if (listeners.size === 0) {
        disconnectStomp();
      }
    };
  }, [stableListener, onMessage]);
}
