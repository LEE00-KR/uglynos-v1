import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (socket?.connected) {
    return socket;
  }

  const token = useAuthStore.getState().accessToken;

  // 현재 호스트 기반으로 서버 URL 동적 설정 (모바일 접속 지원)
  const serverUrl = import.meta.env.VITE_API_URL ||
    `${window.location.protocol}//${window.location.hostname}:3000`;

  socket = io(serverUrl, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;

// Battle socket events
export const battleSocket = {
  onBattleUpdate: (callback: (data: unknown) => void) => {
    socket?.on('battle:update', callback);
  },

  onTurnStart: (callback: (data: unknown) => void) => {
    socket?.on('battle:turn_start', callback);
  },

  onTurnEnd: (callback: (data: unknown) => void) => {
    socket?.on('battle:turn_end', callback);
  },

  onBattleEnd: (callback: (data: unknown) => void) => {
    socket?.on('battle:end', callback);
  },

  emitAction: (data: unknown) => {
    socket?.emit('battle:action', data);
  },

  joinBattle: (battleId: string) => {
    socket?.emit('battle:join', { battleId });
  },
};

// Party socket events
export const partySocket = {
  onCreate: (callback: (data: unknown) => void) => {
    socket?.on('party:created', callback);
  },

  onJoin: (callback: (data: unknown) => void) => {
    socket?.on('party:joined', callback);
  },

  onLeave: (callback: (data: unknown) => void) => {
    socket?.on('party:left', callback);
  },

  onUpdate: (callback: (data: unknown) => void) => {
    socket?.on('party:update', callback);
  },

  create: () => {
    socket?.emit('party:create', {});
  },

  join: (partyId: string) => {
    socket?.emit('party:join', { partyId });
  },

  leave: () => {
    socket?.emit('party:leave');
  },
};
