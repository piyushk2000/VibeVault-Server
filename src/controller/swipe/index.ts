import { PrismaClient } from '@prisma/client';
import { SuccessResponse, FailureResponse } from '../../helpers/api-response';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

const getDiscoverUsers = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const { limit = 10 } = req.query;

        // Get users that haven't been swiped on by current user
        const swipedUserIds = await prisma.swipe.findMany({
            where: { swiperId: userId },
            select: { swipedId: true }
        });

        const swipedIds = swipedUserIds.map(s => s.swipedId);
        swipedIds.push(userId); // Exclude self

        // Get users with their media preferences for better matching
        const users = await prisma.user.findMany({
            where: {
                id: { notIn: swipedIds }
            },
            take: parseInt(limit.toString()),
            include: {
                Profile: true,
                userMedia: {
                    include: {
                        media: {
                            select: {
                                id: true,
                                title: true,
                                type: true,
                                genres: true,
                                image: true
                            }
                        }
                    },
                    orderBy: { rating: 'desc' },
                    take: 5 // Top 5 rated media
                }
            }
        });

        // Format users for discovery
        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            bio: user.Profile?.bio || '',
            interests: user.Profile?.interests || [],
            avatar: user.Profile?.avatar ? `data:image/jpeg;base64,${user.Profile.avatar.toString('base64')}` : null,
            topMedia: user.userMedia.map(um => ({
                title: um.media.title,
                type: um.media.type,
                rating: um.rating,
                image: um.media.image,
                genres: um.media.genres
            })),
            mediaCount: user.userMedia.length
        }));

        res.json(SuccessResponse('Users fetched successfully', formattedUsers));
    } catch (error) {
        console.error('Error fetching discover users:', error);
        res.status(500).json(FailureResponse('Error fetching users', '5004'));
    }
};

const swipeUser = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const { swipedUserId, action } = req.body;

        if (!['LIKE', 'PASS'].includes(action)) {
            res.status(400).json(FailureResponse('Invalid swipe action', '4001'));
            return;
        }

        // Check if already swiped
        const existingSwipe = await prisma.swipe.findUnique({
            where: {
                swiperId_swipedId: {
                    swiperId: userId,
                    swipedId: swipedUserId
                }
            }
        });

        if (existingSwipe) {
            res.status(400).json(FailureResponse('Already swiped on this user', '4002'));
            return;
        }

        // Create swipe record
        const swipe = await prisma.swipe.create({
            data: {
                swiperId: userId,
                swipedId: swipedUserId,
                action
            }
        });

        let isMatch = false;
        let connection = null;

        // Check for match if it's a LIKE
        if (action === 'LIKE') {
            const reciprocalSwipe = await prisma.swipe.findUnique({
                where: {
                    swiperId_swipedId: {
                        swiperId: swipedUserId,
                        swipedId: userId
                    }
                }
            });

            if (reciprocalSwipe && reciprocalSwipe.action === 'LIKE') {
                // It's a match! Create connection
                isMatch = true;
                
                // Ensure user1Id is always smaller for consistency
                const user1Id = Math.min(userId, swipedUserId);
                const user2Id = Math.max(userId, swipedUserId);

                connection = await prisma.connection.create({
                    data: {
                        user1Id,
                        user2Id,
                        status: 'MATCHED'
                    },
                    include: {
                        user1: {
                            select: {
                                id: true,
                                name: true,
                                Profile: {
                                    select: {
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
                                        avatar: true
                                    }
                                }
                            }
                        }
                    }
                });

                // Format connection for response
                connection = {
                    ...connection,
                    user1: {
                        ...connection.user1,
                        avatar: connection.user1.Profile?.avatar ? 
                            `data:image/jpeg;base64,${connection.user1.Profile.avatar.toString('base64')}` : null
                    },
                    user2: {
                        ...connection.user2,
                        avatar: connection.user2.Profile?.avatar ? 
                            `data:image/jpeg;base64,${connection.user2.Profile.avatar.toString('base64')}` : null
                    }
                };
            }
        }

        res.json(SuccessResponse('Swipe recorded successfully', {
            swipe,
            isMatch,
            connection
        }));
    } catch (error) {
        console.error('Error recording swipe:', error);
        res.status(500).json(FailureResponse('Error recording swipe', '5005'));
    }
};

const getPendingSwipes = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;

        // Get users who swiped right on current user but haven't been swiped back
        const pendingSwipes = await prisma.swipe.findMany({
            where: {
                swipedId: userId,
                action: 'LIKE',
                swiped: {
                    swipes: {
                        none: {
                            swiperId: userId,
                            swipedId: { in: await prisma.swipe.findMany({
                                where: { swipedId: userId, action: 'LIKE' },
                                select: { swiperId: true }
                            }).then(swipes => swipes.map(s => s.swiperId)) }
                        }
                    }
                }
            },
            include: {
                swiper: {
                    include: {
                        Profile: true,
                        userMedia: {
                            include: {
                                media: {
                                    select: {
                                        title: true,
                                        type: true,
                                        image: true,
                                        genres: true
                                    }
                                }
                            },
                            orderBy: { rating: 'desc' },
                            take: 3
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedPendingSwipes = pendingSwipes.map(swipe => ({
            id: swipe.id,
            swiperId: swipe.swiperId,
            user: {
                id: swipe.swiper.id,
                name: swipe.swiper.name,
                bio: swipe.swiper.Profile?.bio || '',
                interests: swipe.swiper.Profile?.interests || [],
                avatar: swipe.swiper.Profile?.avatar ? 
                    `data:image/jpeg;base64,${swipe.swiper.Profile.avatar.toString('base64')}` : null,
                topMedia: swipe.swiper.userMedia.map(um => ({
                    title: um.media.title,
                    type: um.media.type,
                    rating: um.rating,
                    image: um.media.image,
                    genres: um.media.genres
                }))
            },
            createdAt: swipe.createdAt
        }));

        res.json(SuccessResponse('Pending swipes fetched successfully', formattedPendingSwipes));
    } catch (error) {
        console.error('Error fetching pending swipes:', error);
        res.status(500).json(FailureResponse('Error fetching pending swipes', '5006'));
    }
};

export { getDiscoverUsers, swipeUser, getPendingSwipes };