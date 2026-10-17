import { useEffect, useRef, useState, useCallback } from 'react';
import { TelemetryPacket } from '../types';
import { fetchLatestTelemetry } from './api';

export function useTelemetryStream(enabled: boolean = true) {
  const [telemetry, setTelemetry] = useState<TelemetryPacket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [history, setHistory] = useState<TelemetryPacket[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const isPausedRef = useRef<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      isPausedRef.current = !prev;
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let socket: WebSocket | null = null;
    let fallbackInterval: any = null;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;

    const handleNewPacket = (packet: TelemetryPacket) => {
      if (isPausedRef.current) return;
      setTelemetry(packet);
      setHistory(prev => {
        const next = [...prev, packet];
        return next.length > 50 ? next.slice(next.length - 50) : next;
      });
    };

    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        if (fallbackInterval) clearInterval(fallbackInterval);
      };

      socket.onmessage = (event) => {
        try {
          const data: TelemetryPacket = JSON.parse(event.data);
          handleNewPacket(data);
        } catch (e) {
          console.error('Failed to parse telemetry frame', e);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Fallback polling every 500ms if websocket closes
        fallbackInterval = setInterval(async () => {
          try {
            const data = await fetchLatestTelemetry();
            handleNewPacket(data);
          } catch {}
        }, 500);
      };

      socket.onerror = () => {
        socket?.close();
      };
    } catch {
      // In case WebSocket cannot be created, poll immediately
      fallbackInterval = setInterval(async () => {
        try {
          const data = await fetchLatestTelemetry();
          handleNewPacket(data);
        } catch {}
      }, 500);
    }

    return () => {
      if (fallbackInterval) clearInterval(fallbackInterval);
      if (socket) socket.close();
    };
  }, [enabled]);

  return { telemetry, history, isConnected, isPaused, togglePause };
}
