import { SuccessResponse } from '../../helpers/api-response'
import { Request, Response } from 'express'
import prisma from '../../database/prisma'

/**
 * Get matches for the currently logged-in user
 * Matches are based on shared media preferences
 */
const getMatches = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        // First, ensure we have updated match calculations
        await calculateMatches(userId);

        // Get all matches for the user
        const matches = await prisma.match.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                matchPercentage: 'desc'
            },
            include: {
                matchedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        Profile: true
                    }
                }
            }
        });

        res.json(SuccessResponse('Matches fetched successfully', matches));
    } catch (error) {
        console.error("Error fetching matches:", error);
        res.status(500).json({ error: 'Error fetching matches' });
    }
};

/**
 * Calculate and store match data for a user
 * This identifies users with similar media preferences
 */
const calculateMatches = async (userId: number) => {
    try {
        // Get the user's media
        const userMedia = await prisma.userMedia.findMany({
            where: { userId },
            include: { media: true }
        });

        if (userMedia.length === 0) {
            return; // No media to match on
        }

        // Get all other users with their media
        const allUsers = await prisma.user.findMany({
            where: {
                id: { not: userId },
                userMedia: { some: {} } // Only get users with media
            },
            include: {
                userMedia: {
                    include: { media: true }
                }
            }
        });

        // Calculate match percentage for each user
        for (const otherUser of allUsers) {
            // Find common media between current user and other user
            const userMediaIds = userMedia.map(m => m.mediaId);
            
            const otherUserMedia = otherUser.userMedia.filter(m => 
                userMediaIds.includes(m.mediaId)
            );
            
            // If there are common items, calculate match
            if (otherUserMedia.length > 0) {
                const commonMediaIds = otherUserMedia.map(m => m.mediaId);
                
                // Calculate match percentage based on common media count
                // Simple algorithm: (common media count / user's media count) * 100
                const matchPercentage = (otherUserMedia.length / userMedia.length) * 100;
                
                // Find existing match record if any
                const existingMatch = await prisma.match.findFirst({
                    where: {
                        userId,
                        matchedUserId: otherUser.id
                    }
                });
                
                if (existingMatch) {
                    // Update existing match
                    await prisma.match.update({
                        where: {
                            id: existingMatch.id
                        },
                        data: {
                            matchPercentage,
                            commonMediaIds,
                            updatedAt: new Date()
                        }
                    });
                } else {
                    // Create new match
                    await prisma.match.create({
                        data: {
                            userId,
                            matchedUserId: otherUser.id,
                            matchPercentage,
                            commonMediaIds,
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error calculating matches:", error);
    }
};

export { getMatches, calculateMatches };