import { PrismaClient } from '@prisma/client';
import { SuccessResponse, FailureResponse } from '../../helpers/api-response';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

const getProfile = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        
        const profile = await prisma.profile.findUnique({
            where: { userId },
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        createdAt: true
                    }
                }
            }
        });

        if (!profile) {
            // Create default profile if doesn't exist
            const newProfile = await prisma.profile.create({
                data: {
                    userId,
                    bio: '',
                    interests: []
                },
                include: {
                    User: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            createdAt: true
                        }
                    }
                }
            });
            res.json(SuccessResponse('Profile created', newProfile));
            return;
        }

        // Convert avatar blob to base64 if exists
        const profileData = {
            ...profile,
            avatar: profile.avatar ? `data:image/jpeg;base64,${profile.avatar.toString('base64')}` : null
        };

        res.json(SuccessResponse('Profile fetched successfully', profileData));
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json(FailureResponse('Error fetching profile', '5001'));
    }
};

const updateProfile = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const { bio, interests, avatar } = req.body;

        let avatarBuffer = null;
        if (avatar && avatar.startsWith('data:image/')) {
            // Convert base64 to buffer
            const base64Data = avatar.split(',')[1];
            avatarBuffer = Buffer.from(base64Data, 'base64');
        }

        const updatedProfile = await prisma.profile.upsert({
            where: { userId },
            update: {
                bio: bio || undefined,
                interests: interests || undefined,
                avatar: avatarBuffer || undefined
            },
            create: {
                userId,
                bio: bio || '',
                interests: interests || [],
                avatar: avatarBuffer
            },
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        createdAt: true
                    }
                }
            }
        });

        // Convert avatar blob to base64 for response
        const profileData = {
            ...updatedProfile,
            avatar: updatedProfile.avatar ? `data:image/jpeg;base64,${updatedProfile.avatar.toString('base64')}` : null
        };

        res.json(SuccessResponse('Profile updated successfully', profileData));
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json(FailureResponse('Error updating profile', '5002'));
    }
};

const updateUser = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { name },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json(SuccessResponse('User updated successfully', updatedUser));
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json(FailureResponse('Error updating user', '5003'));
    }
};

export { getProfile, updateProfile, updateUser };