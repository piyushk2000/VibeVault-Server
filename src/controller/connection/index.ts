import { SuccessResponse, FailureResponse } from '../../helpers/api-response';
import { Request, Response } from 'express';
import prisma from '../../database/prisma';

const getConnections = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;

        const connections = await prisma.connection.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ],
                status: 'MATCHED'
            },
            include: {
                user1: {
                    select: {
                        id: true,
                        name: true,
                        Profile: {
                            select: {
                                bio: true,
                                avatar: true
                            }
                        }
                    }
                },
                user2: {
                    select: {
                        id: true,
                        name: true,
                        Profile: {
                            select: {
                                bio: true,
                                avatar: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        content: true,
                        createdAt: true,
                        senderId: true,
                        isRead: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        const formattedConnections = connections.map(connection => {
            const otherUser = connection.user1Id === userId ? connection.user2 : connection.user1;
            const lastMessage = connection.messages[0] || null;
            
            return {
                id: connection.id,
                user: {
                    id: otherUser.id,
                    name: otherUser.name,
                    bio: otherUser.Profile?.bio || '',
                    avatar: otherUser.Profile?.avatar ? 
                        `data:image/jpeg;base64,${otherUser.Profile.avatar.toString('base64')}` : null
                },
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    isFromMe: lastMessage.senderId === userId,
                    isRead: lastMessage.isRead
                } : null,
                createdAt: connection.createdAt,
                updatedAt: connection.updatedAt
            };
        });

        res.json(SuccessResponse('Connections fetched successfully', formattedConnections));
    } catch (error) {

        res.status(500).json(FailureResponse('Error fetching connections', '5007'));
    }
};

const getConnectionMessages = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const { connectionId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Verify user is part of this connection
        const connection = await prisma.connection.findFirst({
            where: {
                id: parseInt(connectionId),
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            }
        });

        if (!connection) {
            res.status(404).json(FailureResponse('Connection not found', '4004'));
            return;
        }

        const messages = await prisma.message.findMany({
            where: { connectionId: parseInt(connectionId) },
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
            },
            orderBy: { createdAt: 'desc' },
            skip: (parseInt(page.toString()) - 1) * parseInt(limit.toString()),
            take: parseInt(limit.toString())
        });

        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                connectionId: parseInt(connectionId),
                senderId: { not: userId },
                isRead: false
            },
            data: { isRead: true }
        });

        const formattedMessages = messages.map(message => ({
            id: message.id,
            content: message.content,
            messageType: message.messageType,
            isFromMe: message.senderId === userId,
            sender: {
                id: message.sender.id,
                name: message.sender.name,
                avatar: message.sender.Profile?.avatar ? 
                    `data:image/jpeg;base64,${message.sender.Profile.avatar.toString('base64')}` : null
            },
            createdAt: message.createdAt,
            isRead: message.isRead
        })).reverse(); // Reverse to show oldest first

        res.json(SuccessResponse('Messages fetched successfully', formattedMessages));
    } catch (error) {

        res.status(500).json(FailureResponse('Error fetching messages', '5008'));
    }
};

const sendMessage = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const { connectionId } = req.params;
        const { content, messageType = 'TEXT' } = req.body;

        // Verify user is part of this connection
        const connection = await prisma.connection.findFirst({
            where: {
                id: parseInt(connectionId),
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            }
        });

        if (!connection) {
            res.status(404).json(FailureResponse('Connection not found', '4004'));
            return;
        }

        const message = await prisma.message.create({
            data: {
                connectionId: parseInt(connectionId),
                senderId: userId,
                content,
                messageType
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
            where: { id: parseInt(connectionId) },
            data: { updatedAt: new Date() }
        });

        const formattedMessage = {
            id: message.id,
            content: message.content,
            messageType: message.messageType,
            isFromMe: true,
            sender: {
                id: message.sender.id,
                name: message.sender.name,
                avatar: message.sender.Profile?.avatar ? 
                    `data:image/jpeg;base64,${message.sender.Profile.avatar.toString('base64')}` : null
            },
            createdAt: message.createdAt,
            isRead: message.isRead
        };

        res.json(SuccessResponse('Message sent successfully', formattedMessage));
    } catch (error) {

        res.status(500).json(FailureResponse('Error sending message', '5009'));
    }
};

export { getConnections, getConnectionMessages, sendMessage };