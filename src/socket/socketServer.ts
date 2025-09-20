import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import prisma from '../database/prisma';

interface AuthenticatedSocket extends Socket {
    userId?: number;
}

export const initializeSocket = (server: HTTPServer) => {
    const io = new SocketIOServer(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });

    // Authentication middleware
    io.use(async (socket: any, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xyz') as any;
            socket.userId = decoded.userId;
            
            // Join user to their personal room
            socket.join(`user_${socket.userId}`);
            
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: any) => {


        // Join connection rooms for active chats
        socket.on('join_connection', async (connectionId: number) => {
            try {
                // Verify user is part of this connection
                const connection = await prisma.connection.findFirst({
                    where: {
                        id: connectionId,
                        OR: [
                            { user1Id: socket.userId },
                            { user2Id: socket.userId }
                        ]
                    }
                });

                if (connection) {
                    socket.join(`connection_${connectionId}`);

                }
            } catch (error) {
                console.error('Error joining connection:', error);
            }
        });

        // Handle sending messages
        socket.on('send_message', async (data: {
            connectionId: number;
            content: string;
            messageType?: string;
        }) => {
            try {
                const { connectionId, content, messageType = 'TEXT' } = data;

                // Verify user is part of this connection
                const connection = await prisma.connection.findFirst({
                    where: {
                        id: connectionId,
                        OR: [
                            { user1Id: socket.userId },
                            { user2Id: socket.userId }
                        ]
                    }
                });

                if (!connection) {
                    socket.emit('error', { message: 'Connection not found' });
                    return;
                }

                // Create message in database
                const message = await prisma.message.create({
                    data: {
                        connectionId,
                        senderId: socket.userId,
                        content,
                        messageType: messageType as any // Cast to MessageType enum
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                Profile: {
                                    select: {
                                        avatar: true
                                    }
                                }
                            }
                        }
                    }
                });

                // Update connection's updatedAt
                await prisma.connection.update({
                    where: { id: connectionId },
                    data: { updatedAt: new Date() }
                });

                const formattedMessage = {
                    id: message.id,
                    content: message.content,
                    messageType: message.messageType,
                    sender: {
                        id: message.sender.id,
                        name: message.sender.name,
                        avatar: message.sender.Profile?.avatar ? 
                            `data:image/jpeg;base64,${message.sender.Profile.avatar.toString('base64')}` : null
                    },
                    createdAt: message.createdAt,
                    isRead: message.isRead
                };

                // Send to all users in the connection room
                io.to(`connection_${connectionId}`).emit('new_message', {
                    connectionId,
                    message: formattedMessage
                });

                // Send notification to the other user if they're not in the room
                const otherUserId = connection.user1Id === socket.userId ? connection.user2Id : connection.user1Id;
                socket.to(`user_${otherUserId}`).emit('message_notification', {
                    connectionId,
                    message: formattedMessage
                });

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle typing indicators
        socket.on('typing_start', (data: { connectionId: number }) => {
            socket.to(`connection_${data.connectionId}`).emit('user_typing', {
                userId: socket.userId,
                connectionId: data.connectionId
            });
        });

        socket.on('typing_stop', (data: { connectionId: number }) => {
            socket.to(`connection_${data.connectionId}`).emit('user_stopped_typing', {
                userId: socket.userId,
                connectionId: data.connectionId
            });
        });

        // Handle match notifications
        socket.on('new_match', (data: { userId: number, matchData: any }) => {
            socket.to(`user_${data.userId}`).emit('match_notification', data.matchData);
        });

        // Handle disconnection
        socket.on('disconnect', () => {

        });
    });

    return io;
};