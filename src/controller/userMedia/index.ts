import { PrismaClient } from '@prisma/client'
import { SuccessResponse } from '../../helpers/api-response'
import axios from 'axios'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

const addUserMedia = async (req: any, res: any) => {
    const userId = req.user.id;
    const { mediaData, status, rating, progress } = req.body;

    // Check if media exists, if not, create it
    if (!mediaData.apiId) {
        return res.status(400).json({ error: 'apiId is required' });
    }
    let media = await prisma.media.findFirst({
        where: {
            apiId: Number(mediaData.apiId),  // Convert to number since schema expects number type
        },
    });
    if (!media) {
        media = await prisma.media.create({
            data: {
                apiId: mediaData.apiId,
                title: mediaData.title,
                description: mediaData.description,
                genres: mediaData.genres,
                image: mediaData.image,
                type: mediaData.type,
                meta: mediaData.meta,
            },
        });
    }

    const finalProgress = status === 'COMPLETED' ? mediaData.totalEpisodes : progress;

    // Create userMedia entry with type field
    const userMedia = await prisma.userMedia.create({
        data: {
            userId,
            mediaId: media.id,
            status,
            rating,
            progress: finalProgress,
            type: mediaData.type, // Add the type field from mediaData
        },
    });

    res.json(SuccessResponse('Media added to user list successfully', userMedia));
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
