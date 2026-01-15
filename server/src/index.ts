import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { setupSocket } from './socket/index.js';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.NODE_ENV === 'development' ? true : env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupSocket(io);

const PORT = env.PORT;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
