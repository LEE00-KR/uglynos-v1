import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { JwtPayload } from '../middlewares/authMiddleware.js';
import { battleService } from '../services/battleService.js';
import type { BattleAction } from '../types/game.js';

interface BattleActionData {
  battleId: string;
  actions: BattleAction[];
}

interface BattleJoinData {
  battleId: string;
}

interface BattleStartData {
  stageId: number;
}

// Store io instance for external access
let ioInstance: Server | null = null;

export const getIo = () => ioInstance;

export const setupSocket = (io: Server) => {
  ioInstance = io;

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
    socket.on('battle:start', (data: BattleStartData) => {
      handleBattleStart(io, socket, data);
    });

    socket.on('battle:submit_actions', (data: BattleActionData) => {
      handleBattleSubmitActions(io, socket, data);
    });

    socket.on('battle:join', (data: BattleJoinData) => {
      handleBattleJoin(socket, data);
    });

    // Party events
    socket.on('party:create', (data) => {
      handlePartyCreate(io, socket, data);
    });

    socket.on('party:join', (data) => {
      handlePartyJoin(io, socket, data);
    });

    socket.on('party:leave', () => {
      handlePartyLeave(io, socket);
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.data.userId}`);
      handleDisconnect(socket);
    });
  });
};

async function handleBattleStart(_io: Server, socket: Socket, data: BattleStartData) {
  try {
    const characterId = socket.data.characterId;
    if (!characterId) {
      socket.emit('battle:error', { message: 'No character selected' });
      return;
    }

    // Start battle via battle service
    const battleState = await battleService.startBattle(characterId, {
      stageId: data.stageId,
    });

    // Convert units Map to array for client
    const units = Array.from(battleState.units.values()).map((unit) => ({
      id: unit.id,
      type: unit.type,
      templateId: unit.templateId,
      name: unit.name,
      level: unit.level,
      hp: unit.hp,
      maxHp: unit.maxHp,
      mp: unit.mp,
      maxMp: unit.maxMp,
      stats: unit.stats,
      element: unit.element,
      statusEffects: unit.statusEffects,
      isAlive: unit.isAlive,
      isDefending: unit.isDefending,
      isCapturable: unit.isCapturable,
      isRareColor: unit.isRareColor,
      loyalty: unit.loyalty,
    }));

    // Join battle room
    socket.join(`battle:${battleState.id}`);

    // Emit battle started event
    socket.emit('battle:started', {
      battleId: battleState.id,
      stageId: battleState.stageId,
      units,
      turnOrder: battleState.turnOrder,
      turnNumber: battleState.turnNumber,
    });

    logger.info(`Battle started: ${battleState.id} for character ${characterId}`);
  } catch (error) {
    logger.error('Battle start error:', error);
    socket.emit('battle:error', {
      message: error instanceof Error ? error.message : 'Failed to start battle',
    });
  }
}

async function handleBattleSubmitActions(
  io: Server,
  socket: Socket,
  data: BattleActionData
) {
  try {
    const characterId = socket.data.characterId;
    if (!characterId) {
      socket.emit('battle:error', { message: 'No character selected' });
      return;
    }

    // Submit actions
    for (const action of data.actions) {
      await battleService.submitAction(characterId, {
        battleId: data.battleId,
        ...action,
      });
    }

    // Process the turn
    const turnResult = await battleService.processTurn(data.battleId);

    // Convert unit updates for client
    const unitUpdates = new Map();
    if (turnResult.unitUpdates) {
      turnResult.unitUpdates.forEach((updates, unitId) => {
        unitUpdates.set(unitId, updates);
      });
    }

    // Emit turn result to all players in battle room
    io.to(`battle:${data.battleId}`).emit('battle:turn_result', {
      turnNumber: turnResult.turnNumber,
      actions: turnResult.actions,
      unitUpdates: Object.fromEntries(unitUpdates),
      defeatedUnits: turnResult.defeatedUnits,
      capturedPet: turnResult.capturedPet,
      battleEnded: turnResult.battleEnded,
      result: turnResult.result,
      rewards: turnResult.rewards,
    });

    // If battle ended, emit end event and clean up
    if (turnResult.battleEnded) {
      io.to(`battle:${data.battleId}`).emit('battle:ended', {
        result: turnResult.result,
        rewards: turnResult.rewards,
      });

      // Leave battle room
      const socketsInRoom = await io.in(`battle:${data.battleId}`).fetchSockets();
      for (const s of socketsInRoom) {
        s.leave(`battle:${data.battleId}`);
      }

      logger.info(`Battle ended: ${data.battleId} with result ${turnResult.result}`);
    }
  } catch (error) {
    logger.error('Battle action error:', error);
    socket.emit('battle:error', {
      message: error instanceof Error ? error.message : 'Failed to process actions',
    });
  }
}

function handleBattleJoin(socket: Socket, data: BattleJoinData) {
  try {
    // Join battle room to receive updates
    socket.join(`battle:${data.battleId}`);
    logger.info(`Socket ${socket.id} joined battle ${data.battleId}`);
  } catch (error) {
    logger.error('Battle join error:', error);
    socket.emit('battle:error', {
      message: 'Failed to join battle',
    });
  }
}

async function handlePartyCreate(_io: Server, socket: Socket, _data: unknown) {
  try {
    const characterId = socket.data.characterId;
    if (!characterId) {
      socket.emit('party:error', { message: 'No character selected' });
      return;
    }

    // Generate party ID
    const partyId = `party-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Join party room
    socket.join(`party:${partyId}`);
    socket.data.partyId = partyId;
    socket.data.isPartyLeader = true;

    socket.emit('party:created', {
      partyId,
      leaderId: characterId,
      members: [characterId],
    });

    logger.info(`Party created: ${partyId} by character ${characterId}`);
  } catch (error) {
    logger.error('Party create error:', error);
    socket.emit('party:error', { message: 'Failed to create party' });
  }
}

async function handlePartyJoin(io: Server, socket: Socket, data: { partyId: string }) {
  try {
    const characterId = socket.data.characterId;
    if (!characterId) {
      socket.emit('party:error', { message: 'No character selected' });
      return;
    }

    const partyId = data.partyId;

    // Check if party exists (has members in room)
    const socketsInParty = await io.in(`party:${partyId}`).fetchSockets();
    if (socketsInParty.length === 0) {
      socket.emit('party:error', { message: 'Party not found' });
      return;
    }

    if (socketsInParty.length >= 5) {
      socket.emit('party:error', { message: 'Party is full' });
      return;
    }

    // Join party room
    socket.join(`party:${partyId}`);
    socket.data.partyId = partyId;
    socket.data.isPartyLeader = false;

    // Get member list
    const members = socketsInParty.map((s) => s.data.characterId);
    members.push(characterId);

    // Notify all party members
    io.to(`party:${partyId}`).emit('party:joined', {
      partyId,
      memberId: characterId,
      members,
    });

    logger.info(`Character ${characterId} joined party ${partyId}`);
  } catch (error) {
    logger.error('Party join error:', error);
    socket.emit('party:error', { message: 'Failed to join party' });
  }
}

async function handlePartyLeave(io: Server, socket: Socket) {
  try {
    const partyId = socket.data.partyId;
    const characterId = socket.data.characterId;

    if (!partyId) return;

    // Leave party room
    socket.leave(`party:${partyId}`);

    // Notify remaining members
    const socketsInParty = await io.in(`party:${partyId}`).fetchSockets();
    const members = socketsInParty.map((s) => s.data.characterId);

    io.to(`party:${partyId}`).emit('party:left', {
      partyId,
      memberId: characterId,
      members,
    });

    // If leader left, assign new leader
    if (socket.data.isPartyLeader && socketsInParty.length > 0) {
      const newLeader = socketsInParty[0];
      newLeader.data.isPartyLeader = true;
      io.to(`party:${partyId}`).emit('party:leader_changed', {
        newLeaderId: newLeader.data.characterId,
      });
    }

    // Clean up socket data
    socket.data.partyId = undefined;
    socket.data.isPartyLeader = undefined;

    logger.info(`Character ${characterId} left party ${partyId}`);
  } catch (error) {
    logger.error('Party leave error:', error);
  }
}

function handleDisconnect(socket: Socket) {
  // Handle party leave on disconnect
  if (socket.data.partyId) {
    handlePartyLeave(ioInstance as Server, socket);
  }
}
