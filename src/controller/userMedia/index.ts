import { SuccessResponse } from '../../helpers/api-response'
import axios from 'axios'
import { Request, Response } from 'express'
import prisma from '../../database/prisma'

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
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status, rating, review } = req.body;

        // Check if the userMedia belongs to the current user
        const existingUserMedia = await prisma.userMedia.findFirst({
            where: {
                id: parseInt(id),
                userId,
            },
        });

        if (!existingUserMedia) {
            return res.status(404).json({ error: 'Media not found in your library' });
        }

        // Update userMedia entry
        const updatedUserMedia = await prisma.userMedia.update({
            where: {
                id: parseInt(id),
            },
            data: {
                status,
                rating: rating || 0,
                review: review || undefined,
            },
            include: {
                media: true,
            },
        });

        res.json(SuccessResponse('User media updated successfully', updatedUserMedia));
    } catch (error) {
        console.error('Error updating user media:', error);
        res.status(500).json({ error: 'Error updating media in user list' });
    }
};

const deleteUserMedia = async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Check if the userMedia belongs to the current user
        const existingUserMedia = await prisma.userMedia.findFirst({
            where: {
                id: parseInt(id),
                userId,
            },
        });

        if (!existingUserMedia) {
            return res.status(404).json({ error: 'Media not found in your library' });
        }

        // Delete userMedia entry
        await prisma.userMedia.delete({
            where: {
                id: parseInt(id),
            },
        });

        res.json(SuccessResponse('Media removed from library successfully', { id: parseInt(id) }));
    } catch (error) {
        console.error('Error deleting user media:', error);
        res.status(500).json({ error: 'Error removing media from user list' });
    }
};

const getUserMedia = async (req: any, res: any) => {
    const userId = req.user.id;
    const userMedias = await prisma.userMedia.findMany({
        where: { userId },
        include: { media: true },
    });
    res.json(SuccessResponse('User media fetched successfully', userMedias));
};

export { addUserMedia, updateUserMedia, deleteUserMedia, getUserMedia };
