import { SuccessResponse } from '../../helpers/api-response'
import axios from 'axios'
import { Request, Response } from 'express'
import prisma from '../../database/prisma'

// const addMediaToUser = async (req: any, res: any) => {
//     console.log(req.body)
//     const { name, url } = req.body

//     const media = await prisma.media.create({
//         data: {
//             name,
//             url,
//         },
//     })
//     res.json(SuccessResponse('Media added successfully', media))
// }

const fetchAnime = async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 20, search = '', sort = 'popularity' } = req.query
    try {
        const params: any = {
            page,
            limit,
            order: sort.toString(), // popularity, ranked, name, aired_on, episodes, status
            locale: 'en'
        };

        // Add search parameter if provided
        if (search && search.toString().trim()) {
            params.search = search.toString().trim();
        }

        const response = await axios.get('https://shikimori.one/api/animes', {
            params
        })

        // Transform and store anime data
        const transformedAnime = await Promise.all(
            response.data.map(async (anime: any) => {
                // Check if anime already exists in database
                let existingMedia = await prisma.media.findFirst({
                    where: { apiId: anime.id }
                });

                if (!existingMedia) {
                    // Create new media entry
                    existingMedia = await prisma.media.create({
                        data: {
                            apiId: anime.id,
                            title: anime.name || anime.russian || 'Unknown Title',
                            description: anime.description || 'No description available',
                            genres: anime.genres?.map((g: any) => g.name) || [],
                            image: `https://shikimori.one${anime.image.original}`,
                            type: 'ANIME',
                            meta: {
                                score: anime.score,
                                episodes: anime.episodes,
                                status: anime.status,
                                aired_on: anime.aired_on,
                                released_on: anime.released_on
                            }
                        }
                    });
                }

                return existingMedia;
            })
        );

        // Shikimori pagination logic - no total pages available
        const currentPageNum = parseInt(page.toString());
        const limitNum = parseInt(limit.toString());
        const hasNextPage = response.data.length === limitNum;
        const hasPrevPage = currentPageNum > 1;

        res.json(SuccessResponse('Anime fetched successfully', {
            data: transformedAnime,
            pagination: {
                currentPage: currentPageNum,
                totalPages: null, // Shikimori doesn't provide total pages
                hasNextPage,
                hasPrevPage
            }
        }))
    } catch (error) {

        res.status(500).json({ error: 'Error fetching anime data' })
    }
}

const fetchAnimeById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    try {
        const response = await axios.get(`https://api.jikan.moe/v4/anime/${id}`)
        res.json(SuccessResponse('Anime fetched successfully', response.data))
    } catch (error) {
        res.status(500).json({ error: 'Error fetching anime data' })
    }
}

const fetchMovies = async (req: Request, res: Response): Promise<void> => {
    const { page = 1, search = '', sort = 'popularity.desc' } = req.query
    try {
        // Validate page parameter (TMDB API limits: 1-500)
        const pageNum = parseInt(page.toString());
        if (pageNum < 1 || pageNum > 500) {
            res.status(400).json({
                success: false,
                message: 'Invalid page number. Pages must be between 1 and 500.',
                data: null
            });
            return;
        }

        let apiUrl = 'https://api.themoviedb.org/3/discover/movie';
        let params: any = {
            api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9',
            page: pageNum,
            sort_by: sort.toString() // popularity.desc, release_date.desc, vote_average.desc, vote_count.desc
        };

        // Use search API if search query is provided
        if (search && search.toString().trim()) {
            apiUrl = 'https://api.themoviedb.org/3/search/movie';
            params = {
                api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9',
                page: pageNum,
                query: search.toString().trim()
            };
        }

        const response = await axios.get(apiUrl, {
            params,
            headers: {
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyOTFkZjMzNGQ2NDc3YmZkYTg3M2YyMmE0MWE2ZjFjOSIsIm5iZiI6MTczMTk1NTMxNC4yODQxNTI3LCJzdWIiOiI2NzNiOGExMjYyNzIyZTc5YTIxNTVhMTEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Luf3z_s74-3sqetUzBI1HKvQ95Qkh1zDn71jODiQLQg'
            }
        })

        // Get genre names (with error handling - don't fail if genre API fails)
        let genreMap = {};
        try {
            const genreResponse = await axios.get('https://api.themoviedb.org/3/genre/movie/list', {
                params: { api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9' },
                timeout: 5000 // 5 second timeout
            });
            genreMap = genreResponse.data.genres.reduce((acc: any, genre: any) => {
                acc[genre.id] = genre.name;
                return acc;
            }, {});
        } catch (genreError) {
            console.warn('Failed to fetch movie genres, using genre IDs instead:', genreError.message);
            // Continue without genre names - frontend can handle this
        }

        console.log(`Movies API call successful: ${apiUrl.includes('search') ? 'search' : 'discover'}, page: ${pageNum}, results: ${response.data.results?.length || 0}`)

        // Transform and store movie data
        const transformedMovies = await Promise.all(
            response.data.results.map(async (movie: any) => {
                // Check if movie already exists in database
                let existingMedia = await prisma.media.findFirst({
                    where: { apiId: movie.id }
                });

                if (!existingMedia) {
                    // Create new media entry
                    existingMedia = await prisma.media.create({
                        data: {
                            apiId: movie.id,
                            title: movie.title || movie.original_title || 'Unknown Title',
                            description: movie.overview || 'No description available',
                            genres: movie.genre_ids?.map((id: number) => genreMap[id] || `Genre ${id}`).filter(Boolean) || [],
                            image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
                            type: 'MOVIE',
                            meta: {
                                vote_average: movie.vote_average,
                                vote_count: movie.vote_count,
                                release_date: movie.release_date,
                                adult: movie.adult,
                                popularity: movie.popularity
                            }
                        }
                    });
                }

                return existingMedia;
            })
        );

        res.json(SuccessResponse('Movies fetched successfully', {
            data: transformedMovies,
            pagination: {
                currentPage: response.data.page,
                totalPages: Math.min(response.data.total_pages, 500), // Cap at 500 due to TMDB limit
                totalResults: response.data.total_results,
                hasNextPage: response.data.page < Math.min(response.data.total_pages, 500),
                hasPrevPage: response.data.page > 1
            }
        }))
    } catch (error: any) {
        // Handle TMDB API specific errors
        if (error.response?.data?.status_code === 22) {
            res.status(400).json({
                success: false,
                message: 'Invalid page number. Please use a page between 1 and 500.',
                data: null
            });
            return;
        }
        
        if (error.response?.data?.status_message) {
            res.status(400).json({
                success: false,
                message: error.response.data.status_message,
                data: null
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Error fetching movie data',
            data: null
        });
    }
}

const fetchSeries = async (req: Request, res: Response): Promise<void> => {
    const { page = 1, search = '', sort = 'popularity.desc' } = req.query
    try {
        // Validate page parameter (TMDB API limits: 1-500)
        const pageNum = parseInt(page.toString());
        if (pageNum < 1 || pageNum > 500) {
            res.status(400).json({
                success: false,
                message: 'Invalid page number. Pages must be between 1 and 500.',
                data: null
            });
            return;
        }

        let apiUrl = 'https://api.themoviedb.org/3/discover/tv';
        let params: any = {
            api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9',
            page: pageNum,
            sort_by: sort.toString() // popularity.desc, first_air_date.desc, vote_average.desc, vote_count.desc
        };

        // Use search API if search query is provided
        if (search && search.toString().trim()) {
            apiUrl = 'https://api.themoviedb.org/3/search/tv';
            params = {
                api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9',
                page: pageNum,
                query: search.toString().trim()
            };
        }

        const response = await axios.get(apiUrl, {
            params,
            headers: {
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyOTFkZjMzNGQ2NDc3YmZkYTg3M2YyMmE0MWE2ZjFjOSIsIm5iZiI6MTczMTk1NTMxNC4yODQxNTI3LCJzdWIiOiI2NzNiOGExMjYyNzIyZTc5YTIxNTVhMTEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Luf3z_s74-3sqetUzBI1HKvQ95Qkh1zDn71jODiQLQg'
            }
        })

        // Get genre names (with error handling - don't fail if genre API fails)
        let genreMap = {};
        try {
            const genreResponse = await axios.get('https://api.themoviedb.org/3/genre/tv/list', {
                params: { api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9' },
                timeout: 5000 // 5 second timeout
            });
            genreMap = genreResponse.data.genres.reduce((acc: any, genre: any) => {
                acc[genre.id] = genre.name;
                return acc;
            }, {});
        } catch (genreError) {
            console.warn('Failed to fetch TV genres, using genre IDs instead:', genreError.message);
            // Continue without genre names - frontend can handle this
        }

        console.log(`Series API call successful: ${apiUrl.includes('search') ? 'search' : 'discover'}, page: ${pageNum}, results: ${response.data.results?.length || 0}`)

        // Transform and store TV series data
        const transformedSeries = await Promise.all(
            response.data.results.map(async (series: any) => {
                // Check if series already exists in database
                let existingMedia = await prisma.media.findFirst({
                    where: { apiId: series.id }
                });

                if (!existingMedia) {
                    // Create new media entry
                    existingMedia = await prisma.media.create({
                        data: {
                            apiId: series.id,
                            title: series.name || series.original_name || 'Unknown Title',
                            description: series.overview || 'No description available',
                            genres: series.genre_ids?.map((id: number) => genreMap[id] || `Genre ${id}`).filter(Boolean) || [],
                            image: series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : '',
                            type: 'SHOW',
                            meta: {
                                vote_average: series.vote_average,
                                vote_count: series.vote_count,
                                first_air_date: series.first_air_date,
                                popularity: series.popularity,
                                origin_country: series.origin_country
                            }
                        }
                    });
                }

                return existingMedia;
            })
        );

        res.json(SuccessResponse('Series fetched successfully', {
            data: transformedSeries,
            pagination: {
                currentPage: response.data.page,
                totalPages: Math.min(response.data.total_pages, 500), // Cap at 500 due to TMDB limit
                totalResults: response.data.total_results,
                hasNextPage: response.data.page < Math.min(response.data.total_pages, 500),
                hasPrevPage: response.data.page > 1
            }
        }))
    } catch (error: any) {
        // Handle TMDB API specific errors
        if (error.response?.data?.status_code === 22) {
            res.status(400).json({
                success: false,
                message: 'Invalid page number. Please use a page between 1 and 500.',
                data: null
            });
            return;
        }
        
        if (error.response?.data?.status_message) {
            res.status(400).json({
                success: false,
                message: error.response.data.status_message,
                data: null
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Error fetching series data',
            data: null
        });
    }
}

const fetchMovieById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
            params: {
                api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9'
            },
            headers: {
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyOTFkZjMzNGQ2NDc3YmZkYTg3M2YyMmE0MWE2ZjFjOSIsIm5iZiI6MTczMTk1NTMxNC4yODQxNTI3LCJzdWIiOiI2NzNiOGExMjYyNzIyZTc5YTIxNTVhMTEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Luf3z_s74-3sqetUzBI1HKvQ95Qkh1zDn71jODiQLQg'
            }
        })
        res.json(SuccessResponse('Movie fetched successfully', response.data))
    } catch (error) {
        res.status(500).json({ error: 'Error fetching movie data' })
    }
}

const fetchSeriesById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/tv/${id}`, {
            params: {
                api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9'
            },
            headers: {
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyOTFkZjMzNGQ2NDc3YmZkYTg3M2YyMmE0MWE2ZjFjOSIsIm5iZiI6MTczMTk1NTMxNC4yODQxNTI3LCJzdWIiOiI2NzNiOGExMjYyNzIyZTc5YTIxNTVhMTEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Luf3z_s74-3sqetUzBI1HKvQ95Qkh1zDn71jODiQLQg'
            }
        })
        res.json(SuccessResponse('Series fetched successfully', response.data))
    } catch (error) {
        res.status(500).json({ error: 'Error fetching series data' })
    }
}

export {fetchAnime, fetchMovies,fetchSeries,fetchAnimeById,fetchMovieById,fetchSeriesById}