import { PrismaClient } from '@prisma/client'
import { SuccessResponse } from '../../helpers/api-response'
import axios from 'axios'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

const addUserMedia = async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const { mediaId, rating, status, review, type } = req.body;

        // Check if media exists in our database
        let media = await prisma.media.findFirst({
            where: {
                id: mediaId,
            },
        });

        if (!media) {
            return res.status(400).json({ error: 'Media not found' });
        }

        // Check if user already has this media
        const existingUserMedia = await prisma.userMedia.findFirst({
            where: {
                userId,
                mediaId,
            },
        });

        if (existingUserMedia) {
            // Update existing entry
            const updatedUserMedia = await prisma.userMedia.update({
                where: {
                    id: existingUserMedia.id,
                },
                data: {
                    status,
                    rating,
                    review,
                    type,
                },
                include: {
                    media: true,
                },
            });
            return res.json(SuccessResponse('Media updated in user list successfully', updatedUserMedia));
        }

        // Create new userMedia entry
        const userMedia = await prisma.userMedia.create({
            data: {
                userId,
                mediaId,
                status,
                rating,
                review,
                type,
            },
            include: {
                media: true,
            },
        });

        res.json(SuccessResponse('Media added to user list successfully', userMedia));
    } catch (error) {
        console.error('Error adding user media:', error);
        res.status(500).json({ error: 'Error adding media to user list' });
    }
};

const updateUserMedia = async (req: any, res: any) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { status, rating, progress, type } = req.body;

    // Update userMedia entry
    const userMedia = await prisma.userMedia.updateMany({
        where: {
            id: parseInt(id),
            userId,
        },
        data: {
            status,
            rating,
            progress: status === 'COMPLETED' ? undefined : progress,
            type, // Add the type field to updates
        },
    });

    res.json(SuccessResponse('User media updated successfully', userMedia));
};

const getUserMedia = async (req: any, res: any) => {
    const userId = req.user.id;
    const userMedias = await prisma.userMedia.findMany({
        where: { userId },
        include: { media: true },
    });
    res.json(SuccessResponse('User media fetched successfully', userMedias));
};

export { addUserMedia, updateUserMedia, getUserMedia };
