const { Server } = require('socket.io');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join_user', (userId) => {
      if (userId) {
        const roomName = `user_${userId}`;
        socket.join(roomName);
      }
    });

    socket.on('typing', ({ senderId, receiverId }) => {
      if (receiverId) {
        socket.to(`user_${receiverId}`).emit('user_typing', { senderId });
      }
    });

    socket.on('stop_typing', ({ senderId, receiverId }) => {
      if (receiverId) {
        socket.to(`user_${receiverId}`).emit('user_stop_typing', { senderId });
      }
    });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  return io;
};

const getIO = () => io;

const emitToUser = (userId, event, payload) => {
  if (io && userId) {
    io.to(`user_${userId}`).emit(event, payload);
  }
};

module.exports = { initSocket, getIO, emitToUser };
