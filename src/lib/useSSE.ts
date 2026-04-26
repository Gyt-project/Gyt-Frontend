'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * useSSE connects to a WebSocket endpoint and calls `onEvent` for each
 * non-heartbeat event received. The path should start with `/ws/` (e.g.
 * `/ws/pr/owner/repo/1`) — the access token is appended automatically.
 *
 * @param path    WS path (null to disable)
 * @param onEvent called with `(eventType: string, data: unknown)`
 * @returns `connected` boolean
 */
export function useSSE(
  path: string | null,
  onEvent: (type: string, data: unknown) => void,
): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!path) return;

    let ws: WebSocket | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function connect() {
      const token =
        typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
      if (!token) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}${path}?token=${encodeURIComponent(token)}`;
      ws = new WebSocket(url);

      ws.onopen = () => {
        if (!cancelled) setConnected(true);
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data as string) as { type?: string };
          if (!cancelled && data.type && data.type !== 'connected') {
            onEventRef.current(data.type, data);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!cancelled) {
          setConnected(false);
          retryTimeout = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      ws?.close();
    };
  }, [path]);

  return { connected };
}

