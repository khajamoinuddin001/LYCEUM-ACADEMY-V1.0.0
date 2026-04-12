import { Server } from 'socket.io';

export function initLmsSockets(server, allowedOrigins) {
  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin']
    }
  });

  console.log('🔌 Socket.IO initialized for LMS');

  const lmsNamespace = io.of('/lms');

  lmsNamespace.on('connection', (socket) => {
    console.log(`👤 Socket connected to /lms: ${socket.id}`);

    // Join a specific class session room
    socket.on('join-session', (sessionId) => {
      socket.join(`session-${sessionId}`);
      console.log(`🚪 Socket ${socket.id} joined session-${sessionId}`);
      
      // Notify others that attendance might have changed
      const room = lmsNamespace.adapter.rooms.get(`session-${sessionId}`);
      const count = room ? room.size : 1;
      lmsNamespace.to(`session-${sessionId}`).emit('attendance-updated', { count });
    });

    // Teacher navigates to a new slide
    socket.on('update-slide', ({ sessionId, lessonId, slideIndex }) => {
      // Broadcast to all in the room
      lmsNamespace.to(`session-${sessionId}`).emit('slide-updated', { lessonId, slideIndex });
    });

    // Teacher navigates to a new PDF page
    socket.on('update-pdf-page', ({ sessionId, lessonId, pdfPage }) => {
      // Broadcast to all in the room
      lmsNamespace.to(`session-${sessionId}`).emit('pdf-page-updated', { lessonId, pdfPage });
    });

    // Student submits an answer (teacher receives it)
    socket.on('submit-activity', ({ sessionId, submission }) => {
      // Broadcast to teacher/admin in the same room
      socket.to(`session-${sessionId}`).emit('activity-submitted', submission);
    });

    // Teacher switching lessons during a session
    socket.on('switch-lesson', ({ sessionId, courseId, lessonId }) => {
      // Broadcast to ALL in the namespace, but include courseId for instant matching
      lmsNamespace.emit('lesson-switched', { sessionId, courseId, lessonId });
    });

    // Teacher ends the session
    socket.on('end-session', ({ sessionId, courseId }) => {
      lmsNamespace.to(`session-${sessionId}`).emit('session-ended');
      // Also broadcast globally so App.tsx and other views can react
      lmsNamespace.emit('global-session-ended', { sessionId, courseId });
    });

    socket.on('disconnect', () => {
      console.log(`👋 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
