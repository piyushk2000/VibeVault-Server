import { PrismaClient } from '@prisma/client';
import { SuccessResponse, FailureResponse } from '../../helpers/api-response';
import { Request, Response } from 'express';
import { LocationService } from '../../services/locationService';

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

        // Convert avatar and photos blobs to base64 if exist
        const profileData = {
            ...profile,
            avatar: profile.avatar ? `data:image/jpeg;base64,${profile.avatar.toString('base64')}` : null,
            photos: profile.photos ? profile.photos.map(photo => `data:image/jpeg;base64,${photo.toString('base64')}`) : []
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
        const { bio, interests, avatar, photos, location, latitude, longitude, mbtiType } = req.body;

        let avatarBuffer = null;
        if (avatar && avatar.startsWith('data:image/')) {
            // Convert base64 to buffer
            const base64Data = avatar.split(',')[1];
            avatarBuffer = Buffer.from(base64Data, 'base64');
        }

        let photosBuffers: Buffer[] = [];
        if (photos && Array.isArray(photos)) {
            // Limit to 10 photos
            const limitedPhotos = photos.slice(0, 10);
            photosBuffers = limitedPhotos
                .filter(photo => photo && photo.startsWith('data:image/'))
                .map(photo => {
                    const base64Data = photo.split(',')[1];
                    return Buffer.from(base64Data, 'base64');
                });
        }

        const updatedProfile = await prisma.profile.upsert({
            where: { userId },
            update: {
                bio: bio || undefined,
                interests: interests || undefined,
                avatar: avatarBuffer || undefined,
                photos: photosBuffers.length > 0 ? photosBuffers : undefined,
                location: location || undefined,
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
                mbtiType: mbtiType || undefined
            },
            create: {
                userId,
                bio: bio || '',
                interests: interests || [],
                avatar: avatarBuffer,
                photos: photosBuffers,
                location: location || null,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                mbtiType: mbtiType || null
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

        // Convert avatar and photos blobs to base64 for response
        const profileData = {
            ...updatedProfile,
            avatar: updatedProfile.avatar ? `data:image/jpeg;base64,${updatedProfile.avatar.toString('base64')}` : null,
            photos: updatedProfile.photos ? updatedProfile.photos.map(photo => `data:image/jpeg;base64,${photo.toString('base64')}`) : []
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

const searchLocations = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query } = req.query;
        
        if (!query || typeof query !== 'string') {
            res.status(400).json(FailureResponse('Query parameter is required', '4001'));
            return;
        }

        const locations = await LocationService.searchCities(query, 10);
        res.json(SuccessResponse('Locations fetched successfully', locations));
    } catch (error) {
        console.error('Error searching locations:', error);
        res.status(500).json(FailureResponse('Error searching locations', '5004'));
    }
};

const getLocationByCoordinates = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lat, lng } = req.query;
        
        if (!lat || !lng) {
            res.status(400).json(FailureResponse('Latitude and longitude are required', '4002'));
            return;
        }

        const location = await LocationService.getCityByCoordinates(
            parseFloat(lat as string), 
            parseFloat(lng as string)
        );
        
        if (!location) {
            res.status(404).json(FailureResponse('Location not found', '4004'));
            return;
        }

        res.json(SuccessResponse('Location fetched successfully', location));
    } catch (error) {
        console.error('Error getting location by coordinates:', error);
        res.status(500).json(FailureResponse('Error getting location', '5005'));
    }
};

export { getProfile, updateProfile, updateUser, searchLocations, getLocationByCoordinates };