import io, { Socket } from 'socket.io-client';
import fallbackDataService from './fallbackDataService';

const getEnvValue = (key: string) => {
  const env = (import.meta as any)?.env;
  if (env) {
    return env[key];
  }
  return undefined;
};

const DEFAULT_SOCKET_URL = getEnvValue('VITE_SOCKET_URL') || 'http://localhost:5000';
const SENSOR_EVENT = 'sensor:update';

type SocketFactory = (url: string, options: Record<string, unknown>) => Socket;
type Subscriber = (data: any) => void;

type SocketServiceDeps = {
  socketUrl?: string;
  socketFactory?: SocketFactory;
  fallbackData?: typeof fallbackDataService;
  intervalMs?: number;
};

export const createSocketService = ({
  socketUrl = DEFAULT_SOCKET_URL,
  socketFactory = io as unknown as SocketFactory,
  fallbackData = fallbackDataService,
  intervalMs = 3000,
}: SocketServiceDeps = {}) => {
  let socket: Socket | null = null;
  let fallbackIntervalId: ReturnType<typeof setInterval> | null = null;
  const grainDataSubscribers = new Set<Subscriber>();

  const startFallbackMode = (callback?: Subscriber) => {
    if (fallbackIntervalId) return;

    if (callback) {
      grainDataSubscribers.add(callback);
    }

    console.log('ðŸ“¡ Entering fallback mode - using mock sensor data');
    fallbackIntervalId = setInterval(() => {
      if (!socket?.connected) {
        const mockData = fallbackData.getDefaultSensorData();
        const payload = {
          ...mockData,
          _isFallback: true,
        };

        grainDataSubscribers.forEach((subscriber) => subscriber(payload));
      }
    }, intervalMs);
  };

  const connect = (): Socket => {
    // Reuse an existing socket even while it is reconnecting to avoid churn.
    if (socket) {
      return socket;
    }

    socket = socketFactory(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('âœ… Socket connected:', socket?.id);
      if (fallbackIntervalId) {
        clearInterval(fallbackIntervalId);
        fallbackIntervalId = null;
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('âš ï¸ Socket disconnected - starting fallback mode. Reason:', reason);
      startFallbackMode();
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error);
    });

    return socket;
  };

  return {
    connect,

    getSocket(): Socket | null {
      return socket;
    },

    isConnected(): boolean {
      return socket?.connected ?? false;
    },

    disconnect() {
      if (fallbackIntervalId) {
        clearInterval(fallbackIntervalId);
        fallbackIntervalId = null;
      }
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    },

    startFallbackMode,

    onGrainDataUpdate(callback: Subscriber) {
      const s = connect();
      grainDataSubscribers.add(callback);

      s.on(SENSOR_EVENT, callback);
      s.on('grain-data-update', callback);

      if (!s.connected) {
        startFallbackMode(callback);
      }

      return () => {
        s.off(SENSOR_EVENT, callback);
        s.off('grain-data-update', callback);
        grainDataSubscribers.delete(callback);
      };
    },

    onAnalysisResult(callback: (data: unknown) => void) {
      const s = connect();
      s.on('analysis-result', callback);

      return () => {
        s.off('analysis-result', callback);
      };
    },

    onReportUpdate(callback: (data: any) => void) {
      const s = connect();
      s.on('report:new', callback);

      return () => {
        s.off('report:new', callback);
      };
    },

    onCameraStatus(callback: (status: string) => void) {
      const s = connect();
      s.on('camera:status', callback);

      return () => {
        s.off('camera:status', callback);
      };
    },

    onCameraImage(callback: (base64: string) => void) {
      const s = connect();
      s.on('camera:image', callback);

      return () => {
        s.off('camera:image', callback);
      };
    },

    emitAnalysisRequest(data: Record<string, unknown>) {
      const s = connect();
      if (s.connected) {
        s.emit('analyze-grain', data);
      } else {
        console.warn('Socket not connected, analysis request queued');
      }
    },
  };
};

export const socketService = createSocketService();

export default socketService;
