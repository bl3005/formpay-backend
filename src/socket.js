const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  // Authenticate the socket using the same JWT used for REST auth,
  // then join a private room scoped to that user so events only
  // reach the dashboard that owns the form.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      // no-op, room membership is cleaned up automatically
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

// Emit a submission event to the form owner's private room only
const emitNewSubmission = (userId, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit('submission:new', payload);
};

module.exports = { initSocket, getIO, emitNewSubmission };
