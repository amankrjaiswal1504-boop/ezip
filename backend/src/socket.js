// Socket.IO: real-time notifications, live pickup status and collector location.
// Rooms: user:<id>, role:<role>, pickup:<pickupId>.
const { Server } = require('socket.io');
const { verifyToken, COOKIE_NAME } = require('./utils/jwt');
const User = require('./models/User');
const Pickup = require('./models/Pickup');
const logger = require('./utils/logger');

let io = null;

function allowedOrigins() {
  return (process.env.SOCKET_CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim());
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((p) => p.trim().split('='))
      .filter(([k]) => k)
      .map(([k, ...v]) => [k, decodeURIComponent(v.join('='))])
  );
}

function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: allowedOrigins(), credentials: true } });

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = cookies[COOKIE_NAME] || socket.handshake.auth?.token;
      if (token) {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id);
        if (user?.isActive) socket.data.user = user;
      }
    } catch (err) {
      // anonymous socket
    }
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    if (user) {
      socket.join(`user:${user._id}`);
      socket.join(`role:${user.role}`);
      // Staff see the same live admin feed (permissions still apply on the API).
      if (user.role === 'staff') socket.join('role:admin');
    }

    // Customers/collectors/admins can follow a pickup they're allowed to see.
    socket.on('pickup:watch', async (pickupId, ack) => {
      if (!user) return ack?.({ ok: false });
      const filter = { pickupId: String(pickupId).toUpperCase() };
      if (user.role === 'customer') filter.customer = user._id;
      if (user.role === 'collector') filter.collector = user._id;
      const pickup = await Pickup.findOne(filter).select('_id');
      if (!pickup) return ack?.({ ok: false });
      socket.join(`pickup:${filter.pickupId}`);
      return ack?.({ ok: true });
    });
    socket.on('pickup:unwatch', (pickupId) => socket.leave(`pickup:${String(pickupId).toUpperCase()}`));
  });

  logger.info('Socket.IO ready');
  return io;
}

function emitTo(room, event, payload) {
  if (io) io.to(room).emit(event, payload);
}

module.exports = { initSocket, emitTo, getIO: () => io };
