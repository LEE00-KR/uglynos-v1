import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { JwtPayload } from '../middlewares/authMiddleware.js';

export const setupSocket = (io: Server) => {
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      socket.data.userId = decoded.userId;
      socket.data.characterId = decoded.characterId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`User connected: ${socket.data.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.data.userId}`);

    if (socket.data.characterId) {
      socket.join(`character:${socket.data.characterId}`);
    }

    // Battle events
    socket.on('battle:action', (data) => {
      handleBattleAction(socket, data);
    });

    socket.on('battle:join', (data) => {
      handleBattleJoin(socket, data);
    });

    // Party events
    socket.on('party:create', (data) => {
      handlePartyCreate(socket, data);
    });

    socket.on('party:join', (data) => {
      handlePartyJoin(socket, data);
    });

    socket.on('party:leave', () => {
      handlePartyLeave(socket);
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.data.userId}`);
      handleDisconnect(socket);
    });
  });
};

function handleBattleAction(_socket: Socket, _data: unknown) {
  // TODO: Implement battle action handling
}

function handleBattleJoin(_socket: Socket, _data: unknown) {
  // TODO: Implement battle join
}

function handlePartyCreate(_socket: Socket, _data: unknown) {
  // TODO: Implement party creation
}

function handlePartyJoin(_socket: Socket, _data: unknown) {
  // TODO: Implement party join
}

function handlePartyLeave(_socket: Socket) {
  // TODO: Implement party leave
}

function handleDisconnect(_socket: Socket) {
  // TODO: Handle cleanup on disconnect
}
