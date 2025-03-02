"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { RealtimeEvent } from "@repo/types";

type WsStatus = "connecting" | "open" | "closed";

const BUFFER_SIZE = 500;
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;
const MAX_RETRIES = 10;

export function useWebSocket(url: string) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [status, setStatus] = useState<WsStatus>("connecting");

  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmounted = useRef(false);

  const connect = useCallback(() => {
    if (unmounted.current) return;
    setStatus("connecting");

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmounted.current) return;
      retryCount.current = 0;
      setStatus("open");
    };

    ws.onmessage = (e: MessageEvent) => {
      if (unmounted.current) return;
      try {
        const event = JSON.parse(e.data as string) as RealtimeEvent;
        setLastEvent(event);
        setEvents((prev) => {
          const next = [...prev, event];
          return next.length > BUFFER_SIZE
            ? next.slice(next.length - BUFFER_SIZE)
            : next;
        });
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onclose = () => {
      if (unmounted.current) return;
      setStatus("closed");
      wsRef.current = null;

      if (retryCount.current < MAX_RETRIES) {
        const delay = Math.min(
          BASE_DELAY_MS * 2 ** retryCount.current,
          MAX_DELAY_MS,
        );
        retryCount.current += 1;
        retryTimer.current = setTimeout(connect, delay);
      }
    };
  }, [url]);

  useEffect(() => {
    unmounted.current = false;
    connect();
    return () => {
      unmounted.current = true;
      if (retryTimer.current) clearTimeout(retryTimer.current);

      const ws = wsRef.current;
      if (!ws) return;

      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;

      if (ws.readyState === WebSocket.CONNECTING) {
        // Close only after connection is established to avoid the
        // "WebSocket closed before connection established" browser error
        ws.onopen = () => ws.close();
      } else {
        ws.onopen = null;
        ws.close();
      }

      wsRef.current = null;
    };
  }, [connect]);

  return { events, lastEvent, status };
}
