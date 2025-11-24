import { useState, useEffect, useRef, useCallback } from "react";

interface KafkaMessage {
  topic: string;
  partition: number;
  offset: string;
  key?: string;
  value: string;
  timestamp: string;
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export const useWebSocket = (
  url: string,
  onMessage: (message: KafkaMessage) => void
) => {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [messageCount, setMessageCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<KafkaMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const onMessageRef = useRef(onMessage);

  // Keep onMessage reference current
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    // Don't connect if already connecting or connected
    if (
      wsRef.current?.readyState === WebSocket.CONNECTING ||
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      return;
    }

    try {
      setConnectionStatus("connecting");
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setConnectionStatus("connected");
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: KafkaMessage = JSON.parse(event.data);
          setLastMessage(message);
          setMessageCount((prev) => prev + 1);
          onMessageRef.current(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setConnectionStatus("disconnected");

        // Only attempt to reconnect if it wasn't a manual close
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          console.log(
            `Attempting to reconnect in ${delay}ms (attempt ${
              reconnectAttemptsRef.current + 1
            }/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else if (event.code !== 1000) {
          console.error("Maximum reconnection attempts reached");
          setConnectionStatus("error");
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("error");
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      setConnectionStatus("error");
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    setConnectionStatus("disconnected");
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionStatus,
    messageCount,
    lastMessage,
    sendMessage,
    reconnect: connect,
    disconnect,
  };
};
