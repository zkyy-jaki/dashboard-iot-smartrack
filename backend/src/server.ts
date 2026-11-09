/**
 * SmarTrack WMS Backend — Main Server Entry Point
 *
 * Stack:
 *   Express   → REST API
 *   Socket.IO → Real-time WebSocket push (telemetryUpdate event)
 *   MQTT      → Eclipse Mosquitto bridge (ESP32 ↔ backend)
 *   Prisma    → SQLite ORM (inventory ledger + persistence)
 *
 * Startup sequence:
 *   1. Connect to SQLite (Prisma)
 *   2. Create Express app + Socket.IO server
 *   3. Register middleware (CORS, JSON parser, routes)
 *   4. Initialise MQTT service (subscribe + publish loop)
 *   5. Start HTTP listener
 *   6. Register graceful shutdown handlers
 */

import 'dotenv/config';
import http from 'http';
import express, { json, urlencoded } from 'express';
import cors from 'cors';
import { Server as SocketServer } from 'socket.io';

import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import apiRouter from './routes';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler';
import { initMqttService, disconnectMqtt, getMqttStatus } from './services/mqttService';

// ── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  // ── Step 1: Database ──
  await connectDatabase();

  // ── Step 2: Express + Socket.IO ──
  const app = express();

  // Trust first proxy (for X-Forwarded-For when behind nginx)
  app.set('trust proxy', 1);

  // ── Middleware ──
  app.use(
    cors({
      origin: (origin, callback) => callback(null, true),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true }));

  // Request logger (dev only)
  if (config.server.nodeEnv === 'development') {
    app.use((req, _res, next) => {
      console.log(`[HTTP] ${req.method} ${req.path}`);
      next();
    });
  }

  // ── API Routes ──
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);

  // ── Error Handlers (must be last) ──
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  // ── Create HTTP server (shared between Express + Socket.IO) ──
  const httpServer = http.createServer(app);

  // ── Socket.IO ──
  const io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Prefer WebSocket transport; fall back to polling if needed
    transports: ['websocket', 'polling'],
    pingTimeout: 20_000,
    pingInterval: 25_000,
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] ◀ Client connected: ${socket.id} (${socket.handshake.address})`);

    // Send current MQTT connection status immediately on connect
    const mqttStatus = getMqttStatus();
    socket.emit('mqttStatus', mqttStatus);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] ▶ Client disconnected: ${socket.id} — reason: ${reason}`);
    });

    // Allow clients to request a manual MQTT status refresh
    socket.on('getMqttStatus', () => {
      socket.emit('mqttStatus', getMqttStatus());
    });
  });

  // ── Step 4: MQTT Service ──
  initMqttService(io);

  // ── Step 5: Start HTTP listener ──
  httpServer.listen(config.server.port, '0.0.0.0', () => {
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║      SmarTrack WMS Backend — STARTED                 ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  REST API  : http://localhost:${config.server.port}/api/v1          ║`);
    console.log(`║  WebSocket : ws://localhost:${config.server.port}  (Socket.IO)      ║`);
    console.log(`║  MQTT      : ${config.mqtt.brokerUrl.padEnd(38)}║`);
    console.log(`║  DB        : SQLite (Prisma)                         ║`);
    console.log(`║  ENV       : ${config.server.nodeEnv.padEnd(38)}║`);
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  Key Endpoints:                                       ║');
    console.log(`║  GET  /api/v1/racks/RACK-001/overview                ║`);
    console.log(`║  GET  /api/v1/products                               ║`);
    console.log(`║  GET  /api/v1/inventory/history                      ║`);
    console.log(`║  GET  /api/v1/sensors/alerts                         ║`);
    console.log(`║  GET  /api/v1/health                                 ║`);
    console.log('╚══════════════════════════════════════════════════════╝\n');
  });

  // ── Step 6: Graceful shutdown ──
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown…`);

    // Close MQTT first (stop receiving new messages)
    disconnectMqtt();

    // Close Socket.IO (disconnect all clients)
    io.close(() => {
      console.log('[Server] Socket.IO server closed.');
    });

    // Close HTTP server (stop accepting new connections)
    httpServer.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDatabase();
      console.log('[Server] ✓ Graceful shutdown complete.');
      process.exit(0);
    });

    // Force exit if cleanup takes too long (10s timeout)
    setTimeout(() => {
      console.error('[Server] ❌ Forced exit after shutdown timeout.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught Exception:', err);
    shutdown('uncaughtException').catch(() => process.exit(1));
  });
  process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled Promise Rejection:', reason);
  });
}

// Run
bootstrap().catch((err) => {
  console.error('[Server] ❌ Bootstrap failed:', err);
  process.exit(1);
});

