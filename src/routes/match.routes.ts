import { Router } from 'express';
import { getMatches } from '../controller/match';
import { validateToken } from '../middleware/auth.middleware';
import { SuccessResponse } from '../helpers/api-response';
import prisma from '../database/prisma';

const router = Router();

// Get matches for the current user
router.get('/', validateToken, getMatches);

// Get common media details for a specific match
router.get('/:matchId/common-media', validateToken, async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const { matchId } = req.params;

        const match = await prisma.match.findFirst({
            where: {
                id: parseInt(matchId),
                userId: userId
            }
        });

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        const commonMedia = await prisma.media.findMany({
            where: {
                id: {
                    in: match.commonMediaIds
                }
            },
            include: {
                userMedias: {
                    where: {
                        OR: [
                            { userId: userId },
                            { userId: match.matchedUserId }
                        ]
                    }
                }
            }
        });

        const formattedMedia = commonMedia.map(media => ({
            id: media.id,
            title: media.title,
            type: media.type,
            image: media.image,
            userRating: media.userMedias.find(um => um.userId === userId)?.rating || null,
            matchRating: media.userMedias.find(um => um.userId === match.matchedUserId)?.rating || null
        }));

        res.json(SuccessResponse('Common media fetched successfully', formattedMedia));
    } catch (error) {
        console.error('Error fetching common media:', error);
        res.status(500).json({ error: 'Error fetching common media' });
    }
});

export default router;
